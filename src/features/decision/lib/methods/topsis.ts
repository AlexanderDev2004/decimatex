import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, formatNumber, buildStepRows, createZeroMatrix } from "./shared"

export function runTopsis(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	weights: number[],
): RankingResult[] {
	const nCriteria = criteria.length
	const nAlternatives = alternatives.length
	const normalizedWeights = normalizeWeights(weights, nCriteria)

	const matrix2d: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	matrix.forEach((m) => {
		const altIdx = alternatives.findIndex((a) => a.id === m.alternativeId)
		const critIdx = criteria.findIndex((c) => c.id === m.criteriaId)
		if (altIdx !== -1 && critIdx !== -1) {
			matrix2d[altIdx][critIdx] = m.value
		}
	})

	const normalized: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let j = 0; j < nCriteria; j++) {
		let sum = 0
		for (let i = 0; i < nAlternatives; i++) {
			sum += matrix2d[i][j] ** 2
		}
		const sqrt = Math.sqrt(sum)
		for (let i = 0; i < nAlternatives; i++) {
			normalized[i][j] = sqrt === 0 ? 0 : matrix2d[i][j] / sqrt
		}
	}

	const weighted: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			weighted[i][j] = normalized[i][j] * normalizedWeights[j]
		}
	}

	const idealPositive: number[] = []
	const idealNegative: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		if (criteria[j].type === "benefit") {
			idealPositive[j] = Math.max(...weighted.map((row) => row[j]))
			idealNegative[j] = Math.min(...weighted.map((row) => row[j]))
		} else {
			idealPositive[j] = Math.min(...weighted.map((row) => row[j]))
			idealNegative[j] = Math.max(...weighted.map((row) => row[j]))
		}
	}

	const distances: { plus: number[]; minus: number[] } = { plus: [], minus: [] }
	for (let i = 0; i < nAlternatives; i++) {
		let sumPlus = 0
		let sumMinus = 0
		for (let j = 0; j < nCriteria; j++) {
			sumPlus += (weighted[i][j] - idealPositive[j]) ** 2
			sumMinus += (weighted[i][j] - idealNegative[j]) ** 2
		}
		distances.plus.push(Math.sqrt(sumPlus))
		distances.minus.push(Math.sqrt(sumMinus))
	}

	const scores = alternatives.map((alt, i) => ({
		alternativeId: alt.id,
		alternativeName: alt.name,
		score:
			distances.plus[i] + distances.minus[i] === 0
				? 0
				: distances.minus[i] / (distances.plus[i] + distances.minus[i]),
		rank: 0,
	}))

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createTopsisStepDetails(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	inputWeights: number[],
): MethodStepDetails {
	const nCriteria = criteria.length
	const nAlternatives = alternatives.length
	const headers = criteria.map((c) => c.name)
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)
	const weights = normalizeWeights(inputWeights, nCriteria)

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let j = 0; j < nCriteria; j++) {
		let sum = 0
		for (let i = 0; i < nAlternatives; i++) {
			sum += matrix2d[i][j] ** 2
		}
		const divider = Math.sqrt(sum)
		for (let i = 0; i < nAlternatives; i++) {
			normalized[i][j] = divider === 0 ? 0 : matrix2d[i][j] / divider
		}
	}

	const weighted = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			weighted[i][j] = normalized[i][j] * weights[j]
		}
	}

	const idealPositive: number[] = []
	const idealNegative: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		if (criteria[j].type === "benefit") {
			idealPositive[j] = Math.max(...weighted.map((row) => row[j]))
			idealNegative[j] = Math.min(...weighted.map((row) => row[j]))
		} else {
			idealPositive[j] = Math.min(...weighted.map((row) => row[j]))
			idealNegative[j] = Math.max(...weighted.map((row) => row[j]))
		}
	}

	const distancePlus: number[] = []
	const distanceMinus: number[] = []
	const scoreRows: number[][] = []
	for (let i = 0; i < nAlternatives; i++) {
		let sumPlus = 0
		let sumMinus = 0
		for (let j = 0; j < nCriteria; j++) {
			sumPlus += (weighted[i][j] - idealPositive[j]) ** 2
			sumMinus += (weighted[i][j] - idealNegative[j]) ** 2
		}
		distancePlus[i] = Math.sqrt(sumPlus)
		distanceMinus[i] = Math.sqrt(sumMinus)
		const ci =
			distancePlus[i] + distanceMinus[i] === 0
				? 0
				: distanceMinus[i] / (distancePlus[i] + distanceMinus[i])
		scoreRows.push([distancePlus[i], distanceMinus[i], ci])
	}

	return {
		step4Title: "Normalisasi nilai setiap kriteria (Euclidean)",
		step4Formula: ["r_ij = x_ij / sqrt(sum_i x_ij^2)"],
		step4Tables: [
			{
				title: "Matriks normalisasi (R)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
		],
		step6Title: "Menghitung nilai alternatif (TOPSIS)",
		step6Formula: [
			"v_ij = w_j * r_ij",
			"A_j+ = max(v_ij) untuk benefit, min(v_ij) untuk cost",
			"A_j- = min(v_ij) untuk benefit, max(v_ij) untuk cost",
			"D_i+ = sqrt(sum_j (v_ij - A_j+)^2)",
			"D_i- = sqrt(sum_j (v_ij - A_j-)^2)",
			"C_i = D_i- / (D_i+ + D_i-)",
		],
		step6Notes: [
			`A+: ${criteria.map((c, j) => `${c.name}=${formatNumber(idealPositive[j])}`).join(", ")}`,
			`A-: ${criteria.map((c, j) => `${c.name}=${formatNumber(idealNegative[j])}`).join(", ")}`,
		],
		step6Table: {
			title: "Nilai kedekatan relatif (C_i)",
			headers: ["D+", "D-", "C_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
	}
}
