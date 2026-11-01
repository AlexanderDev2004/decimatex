import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

/**
 * ARAS (Additive Ratio ASsessment) — Zavadskas & Turskis (2010).
 *
 * 1. Normalisasi: benefit r_ij = x_ij / sum_i(x_ij);
 *    cost r_ij = (1/x_ij) / sum_i(1/x_ij).
 * 2. Baris optimal x0 (nilai terbaik tiap kriteria) → r_0j = max_i(r_ij)
 *    karena normalisasi monotone terhadap "kebaikan".
 * 3. S_i = sum_j (w_j * r_ij), S_0 = sum_j (w_j * r_0j).
 * 4. Utilitas: U_i = S_i / S_0. Ranking: U terbesar terbaik.
 */
export function runAras(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	weights: number[],
): RankingResult[] {
	const nCriteria = criteria.length
	const nAlternatives = alternatives.length
	const normalizedWeights = normalizeWeights(weights, nCriteria)
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let j = 0; j < nCriteria; j++) {
		if (criteria[j].type === "benefit") {
			let sum = 0
			for (let i = 0; i < nAlternatives; i++) sum += matrix2d[i][j]
			for (let i = 0; i < nAlternatives; i++) {
				normalized[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
			}
		} else {
			let sumReciprocal = 0
			for (let i = 0; i < nAlternatives; i++) {
				sumReciprocal += matrix2d[i][j] > 0 ? 1 / matrix2d[i][j] : 1 / Number.EPSILON
			}
			for (let i = 0; i < nAlternatives; i++) {
				const reciprocal = matrix2d[i][j] > 0 ? 1 / matrix2d[i][j] : 1 / Number.EPSILON
				normalized[i][j] = sumReciprocal === 0 ? 0 : reciprocal / sumReciprocal
			}
		}
	}

	const optimal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		optimal[j] = Math.max(...normalized.map((row) => row[j]))
	}

	const s = alternatives.map((_, i) => {
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			score += normalizedWeights[j] * normalized[i][j]
		}
		return score
	})
	const s0 = normalizedWeights.reduce((acc, w, j) => acc + w * optimal[j], 0)

	const scores = alternatives.map((alt, i) => ({
		alternativeId: alt.id,
		alternativeName: alt.name,
		score: s0 === 0 ? 0 : s[i] / s0,
		rank: 0,
	}))

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s2, i) => (s2.rank = i + 1))

	return scores
}

export function createArasStepDetails(
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
		if (criteria[j].type === "benefit") {
			let sum = 0
			for (let i = 0; i < nAlternatives; i++) sum += matrix2d[i][j]
			for (let i = 0; i < nAlternatives; i++) {
				normalized[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
			}
		} else {
			let sumReciprocal = 0
			for (let i = 0; i < nAlternatives; i++) {
				sumReciprocal += matrix2d[i][j] > 0 ? 1 / matrix2d[i][j] : 1 / Number.EPSILON
			}
			for (let i = 0; i < nAlternatives; i++) {
				const reciprocal = matrix2d[i][j] > 0 ? 1 / matrix2d[i][j] : 1 / Number.EPSILON
				normalized[i][j] = sumReciprocal === 0 ? 0 : reciprocal / sumReciprocal
			}
		}
	}

	const optimal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		optimal[j] = Math.max(...normalized.map((row) => row[j]))
	}

	const s: number[] = alternatives.map((_, i) =>
		weights.reduce((acc, w, j) => acc + w * normalized[i][j], 0),
	)
	const s0 = weights.reduce((acc, w, j) => acc + w * optimal[j], 0)

	const scoreRows = alternatives.map((_, i) => [s[i], s0 === 0 ? 0 : s[i] / s0])

	return {
		step4Title: "Normalisasi nilai setiap kriteria (ARAS)",
		step4Formula: [
			"r_ij = x_ij / sum_i(x_ij) untuk benefit",
			"r_ij = (1/x_ij) / sum_i(1/x_ij) untuk cost",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (R)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
			{
				title: "Baris optimal (x0)",
				rowHeader: "Optimal",
				headers,
				rows: [{ label: "r_0j = max_i(r_ij)", values: optimal }],
			},
		],
		step6Title: "Menghitung nilai alternatif (ARAS)",
		step6Formula: [
			"S_i = sum_j (w_j * r_ij)",
			"S_0 = sum_j (w_j * r_0j)",
			"U_i = S_i / S_0",
		],
		step6Table: {
			title: "Nilai utilitas ARAS",
			headers: ["S_i", "U_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
	}
}
