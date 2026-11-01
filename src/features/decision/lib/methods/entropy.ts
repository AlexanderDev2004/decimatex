import type { Criteria, Alternative, MatrixValue } from "./shared"
import { buildMatrix2d, normalizeWeights, createZeroMatrix } from "./shared"

/**
 * Entropy weight method (Shannon entropy) — penentu bobot objektif dari data.
 *
 * 1. Normalisasi ke proporsi: p_ij = x_ij / sum_i(x_ij) untuk benefit,
 *    p_ij = (1/x_ij) / sum_i(1/x_ij) untuk cost (nilai x_ij <= 0 dianggap ideal).
 * 2. Entropi tiap kriteria: e_j = -k * sum_i (p_ij * ln p_ij), k = 1/ln(m),
 *    dengan konvensi p * ln(p) = 0 saat p = 0.
 * 3. Divergensi: d_j = 1 - e_j.
 * 4. Bobot: w_j = d_j / sum_j(d_j).
 *    Fallback bobot sama rata saat semua kolom identik (sum d_j = 0).
 *
 * Bukan metode ranking: hasilnya saran bobot kriteria yang bisa dipakai
 * metode ranking mana pun (SAW, TOPSIS, WASPAS, dst).
 */
export interface EntropyWeightsResult {
	normalized: number[][]
	entropy: number[]
	divergence: number[]
	weights: number[]
}

export function runEntropyWeights(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
): EntropyWeightsResult {
	const nCriteria = criteria.length
	const nAlternatives = alternatives.length
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)

	const k = nAlternatives > 1 ? 1 / Math.log(nAlternatives) : 0

	const pi = createZeroMatrix(nAlternatives, nCriteria)
	const entropy: number[] = []
	const divergence: number[] = []

	for (let j = 0; j < nCriteria; j++) {
		if (criteria[j].type === "benefit") {
			let sum = 0
			for (let i = 0; i < nAlternatives; i++) sum += matrix2d[i][j]
			for (let i = 0; i < nAlternatives; i++) {
				pi[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
			}
		} else {
			let sumReciprocal = 0
			for (let i = 0; i < nAlternatives; i++) {
				sumReciprocal += matrix2d[i][j] > 0 ? 1 / matrix2d[i][j] : 1 / Number.EPSILON
			}
			for (let i = 0; i < nAlternatives; i++) {
				const reciprocal = matrix2d[i][j] > 0 ? 1 / matrix2d[i][j] : 1 / Number.EPSILON
				pi[i][j] = sumReciprocal === 0 ? 0 : reciprocal / sumReciprocal
			}
		}

		let sumPLogP = 0
		for (let i = 0; i < nAlternatives; i++) {
			if (pi[i][j] > 0) {
				sumPLogP += pi[i][j] * Math.log(pi[i][j])
			}
		}
		entropy[j] = nAlternatives <= 1 ? 1 : -k * sumPLogP
		divergence[j] = 1 - entropy[j]
	}

	const totalDivergence = divergence.reduce((acc, d) => acc + d, 0)
	const weights =
		totalDivergence <= 0
			? normalizeWeights([], nCriteria)
			: divergence.map((d) => d / totalDivergence)

	return { normalized: pi, entropy, divergence, weights }
}
