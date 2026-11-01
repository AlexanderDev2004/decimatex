import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows } from "./shared"
import { computeSawNormalized } from "./saw"

/**
 * WASPAS (Weighted Aggregated Sum Product ASsessment) — Zavadskas dkk. (2012).
 *
 * Menggabungkan WSM (Weighted Sum Model) dan WPM (Weighted Product Model)
 * atas normalisasi SAW yang sama:
 *   Q1_i = sum_j (w_j * r_ij)        (WSM)
 *   Q2_i = prod_j (r_ij ^ w_j)       (WPM; r_ij dinormalisasi, cost sudah dibalik)
 *   Q_i  = lambda * Q1_i + (1 - lambda) * Q2_i,  lambda = 0.5
 *
 * Ranking: Q terbesar terbaik.
 */
const LAMBDA = 0.5

export function runWaspas(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	weights: number[],
): RankingResult[] {
	const nCriteria = criteria.length
	const normalizedWeights = normalizeWeights(weights, nCriteria)
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)
	const normalized = computeSawNormalized(criteria, matrix2d)

	const scores = alternatives.map((alt, i) => {
		let q1 = 0
		let q2 = 1
		for (let j = 0; j < nCriteria; j++) {
			const r = normalized[i][j]
			q1 += normalizedWeights[j] * r
			q2 *= r ** normalizedWeights[j]
		}
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score: LAMBDA * q1 + (1 - LAMBDA) * q2,
			rank: 0,
		}
	})

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createWaspasStepDetails(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	inputWeights: number[],
): MethodStepDetails {
	const nCriteria = criteria.length
	const headers = criteria.map((c) => c.name)
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)
	const weights = normalizeWeights(inputWeights, nCriteria)
	const normalized = computeSawNormalized(criteria, matrix2d)

	const scoreRows = alternatives.map((_, i) => {
		let q1 = 0
		let q2 = 1
		for (let j = 0; j < nCriteria; j++) {
			const r = normalized[i][j]
			q1 += weights[j] * r
			q2 *= r ** weights[j]
		}
		return [q1, q2, LAMBDA * q1 + (1 - LAMBDA) * q2]
	})

	return {
		step4Title: "Normalisasi nilai setiap kriteria (SAW, dipakai WSM & WPM)",
		step4Formula: [
			"r_ij = x_ij / max_i(x_ij) untuk benefit",
			"r_ij = min_i(x_ij) / x_ij untuk cost",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (R)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
		],
		step6Title: "Menghitung nilai alternatif (WASPAS)",
		step6Formula: [
			"Q1_i = sum_j (w_j * r_ij)  (WSM)",
			"Q2_i = prod_j (r_ij ^ w_j)  (WPM)",
			"Q_i = 0.5 * Q1_i + 0.5 * Q2_i",
		],
		step6Table: {
			title: "Skor gabungan WASPAS",
			headers: ["Q1 (WSM)", "Q2 (WPM)", "Q_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
	}
}
