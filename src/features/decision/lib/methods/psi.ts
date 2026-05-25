import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

export function runPsi(
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

	const minVal: number[] = []
	const maxVal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		minVal.push(Math.min(...matrix2d.map((row) => row[j])))
		maxVal.push(Math.max(...matrix2d.map((row) => row[j])))
	}

	const normalized: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const range = maxVal[j] - minVal[j]
			if (range === 0) {
				normalized[i][j] = 0
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
			} else {
				normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
			}
		}
	}

	const colSum: number[] = Array(nCriteria).fill(0)
	for (let j = 0; j < nCriteria; j++) {
		for (let i = 0; i < nAlternatives; i++) {
			colSum[j] += normalized[i][j]
		}
	}

	const relativePref: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			relativePref[i][j] = colSum[j] === 0 ? 0 : normalized[i][j] / colSum[j]
		}
	}

	const scores = alternatives.map((alt, i) => {
		let psi = 0
		for (let j = 0; j < nCriteria; j++) {
			psi += normalizedWeights[j] * relativePref[i][j]
		}
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score: psi,
			rank: 0,
		}
	})

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createPsiStepDetails(
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

	const minVal: number[] = []
	const maxVal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		minVal[j] = Math.min(...matrix2d.map((row) => row[j]))
		maxVal[j] = Math.max(...matrix2d.map((row) => row[j]))
	}

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const range = maxVal[j] - minVal[j]
			if (range === 0) {
				normalized[i][j] = 0
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
			} else {
				normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
			}
		}
	}

	const colSum: number[] = Array(nCriteria).fill(0)
	for (let j = 0; j < nCriteria; j++) {
		for (let i = 0; i < nAlternatives; i++) {
			colSum[j] += normalized[i][j]
		}
	}

	const relativePref = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			relativePref[i][j] = colSum[j] === 0 ? 0 : normalized[i][j] / colSum[j]
		}
	}

	const step6Rows = alternatives.map((_, i) => {
		const prefTotal = relativePref[i].reduce((acc, value) => acc + value, 0)
		const psiScore = relativePref[i].reduce((acc, value, j) => acc + weights[j] * value, 0)
		return [prefTotal, psiScore]
	})

	return {
		step4Title: "Normalisasi nilai setiap kriteria (Min-Max)",
		step4Formula: [
			"n_ij = (x_ij - min_j) / (max_j - min_j) untuk benefit",
			"n_ij = (max_j - x_ij) / (max_j - min_j) untuk cost",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (N)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
		],
		step6Title: "Menghitung nilai alternatif (PSI)",
		step6Formula: [
			"P_ij = n_ij / sum_i n_ij",
			"PSI_i = sum_j (w_j * P_ij)",
		],
		step6Table: {
			title: "Skor akhir PSI",
			headers: ["sum_j P_ij", "PSI_i"],
			rows: buildStepRows(alternatives, step6Rows),
		},
	}
}
