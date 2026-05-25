import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

export function runPromethee(
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

	const pref: number[][][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0)))

	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i === k) continue
			for (let j = 0; j < nCriteria; j++) {
				const diff = matrix2d[i][j] - matrix2d[k][j]
				const range = maxVal[j] - minVal[j]
				if (range === 0) {
					pref[i][k][j] = 0
				} else if (diff > 0) {
					if (criteria[j].type === "benefit") {
						pref[i][k][j] = diff / range
					} else {
						pref[i][k][j] = 0
					}
				} else {
					if (criteria[j].type === "cost") {
						pref[i][k][j] = -diff / range
					} else {
						pref[i][k][j] = 0
					}
				}
			}
		}
	}

	const pi: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i === k) continue
			for (let j = 0; j < nCriteria; j++) {
				pi[i][k] += normalizedWeights[j] * pref[i][k][j]
			}
		}
	}

	const phiPlus: number[] = Array(nAlternatives).fill(0)
	const phiMinus: number[] = Array(nAlternatives).fill(0)

	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i !== k) {
				phiPlus[i] += pi[i][k]
				phiMinus[i] += pi[k][i]
			}
		}
		phiPlus[i] /= nAlternatives - 1
		phiMinus[i] /= nAlternatives - 1
	}

	const scores = alternatives.map((alt, i) => ({
		alternativeId: alt.id,
		alternativeName: alt.name,
		score: phiPlus[i] - phiMinus[i],
		rank: 0,
	}))

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createPrometheeStepDetails(
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

	const normalizedReference = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const range = maxVal[j] - minVal[j]
			if (range === 0) {
				normalizedReference[i][j] = 0
			} else if (criteria[j].type === "benefit") {
				normalizedReference[i][j] = (matrix2d[i][j] - minVal[j]) / range
			} else {
				normalizedReference[i][j] = (maxVal[j] - matrix2d[i][j]) / range
			}
		}
	}

	const pref: number[][][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(null).map(() => Array(nCriteria).fill(0)))
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i === k) {
				continue
			}
			for (let j = 0; j < nCriteria; j++) {
				const range = maxVal[j] - minVal[j]
				if (range === 0) {
					pref[i][k][j] = 0
					continue
				}
				const delta =
					criteria[j].type === "benefit"
						? matrix2d[i][j] - matrix2d[k][j]
						: matrix2d[k][j] - matrix2d[i][j]
				pref[i][k][j] = Math.max(0, delta / range)
			}
		}
	}

	const pi: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i === k) {
				continue
			}
			for (let j = 0; j < nCriteria; j++) {
				pi[i][k] += weights[j] * pref[i][k][j]
			}
		}
	}

	const phiPlus: number[] = Array(nAlternatives).fill(0)
	const phiMinus: number[] = Array(nAlternatives).fill(0)
	const divider = nAlternatives > 1 ? nAlternatives - 1 : 1
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i !== k) {
				phiPlus[i] += pi[i][k]
				phiMinus[i] += pi[k][i]
			}
		}
		phiPlus[i] /= divider
		phiMinus[i] /= divider
	}

	const step6Rows = alternatives.map((_, i) => [
		phiPlus[i],
		phiMinus[i],
		phiPlus[i] - phiMinus[i],
	])

	return {
		step4Title: "Normalisasi rentang untuk fungsi preferensi (PROMETHEE)",
		step4Formula: [
			"range_j = max_j - min_j",
			"d_j(a,b) = x_aj - x_bj untuk benefit, x_bj - x_aj untuk cost",
			"P_j(a,b) = max(0, d_j(a,b) / range_j)",
		],
		step4Tables: [
			{
				title: "Matriks referensi Min-Max (untuk melihat rentang)",
				headers,
				rows: buildStepRows(alternatives, normalizedReference),
			},
		],
		step6Title: "Menghitung nilai alternatif (PROMETHEE)",
		step6Formula: [
			"pi(a,b) = sum_j (w_j * P_j(a,b))",
			"phi+(a) = (1/(m-1)) * sum_{b!=a} pi(a,b)",
			"phi-(a) = (1/(m-1)) * sum_{b!=a} pi(b,a)",
			"phi(a) = phi+(a) - phi-(a)",
		],
		step6Table: {
			title: "Outranking flow",
			headers: ["phi+", "phi-", "phi"],
			rows: buildStepRows(alternatives, step6Rows),
		},
	}
}
