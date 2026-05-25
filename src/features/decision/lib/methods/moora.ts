import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

export function runMoora(
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

	const scores = alternatives.map((alt, i) => {
		let sum = 0
		for (let j = 0; j < nCriteria; j++) {
			if (criteria[j].type === "benefit") {
				sum += weighted[i][j]
			} else {
				sum -= weighted[i][j]
			}
		}
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score: sum,
			rank: 0,
		}
	})

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createMooraStepDetails(
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

	const step6Rows = alternatives.map((_, i) => {
		let benefit = 0
		let cost = 0
		for (let j = 0; j < nCriteria; j++) {
			if (criteria[j].type === "benefit") {
				benefit += weighted[i][j]
			} else {
				cost += weighted[i][j]
			}
		}
		return [benefit, cost, benefit - cost]
	})

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
		step6Title: "Menghitung nilai alternatif (MOORA)",
		step6Formula: [
			"v_ij = w_j * r_ij",
			"Y_i = sum(v_ij) untuk benefit - sum(v_ij) untuk cost",
		],
		step6Table: {
			title: "Indeks MOORA (Y_i)",
			headers: ["sum Benefit", "sum Cost", "Y_i"],
			rows: buildStepRows(alternatives, step6Rows),
		},
	}
}
