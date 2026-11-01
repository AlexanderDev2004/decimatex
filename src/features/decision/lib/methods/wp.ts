import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows } from "./shared"

/**
 * WP (Weighted Product Model) — Yoon (1980).
 *
 * 1. Bobot dinormalisasi sehingga sum w_j = 1.
 * 2. Skor: S_i = prod_j x_ij^(w_j) untuk benefit, x_ij^(-w_j) untuk cost.
 *    Dihitung lewat domain log agar numerik stabil:
 *    ln S_i = sum_j (s_j * w_j * ln x_ij), s_j = +1 (benefit) / -1 (cost).
 * 3. Ranking: S terbesar terbaik.
 *
 * Catatan: seluruh nilai matrix harus positif (> 0).
 */
export function runWp(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	weights: number[],
): RankingResult[] {
	const nCriteria = criteria.length
	const normalizedWeights = normalizeWeights(weights, nCriteria)
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)

	const scores = alternatives.map((alt, i) => {
		let logSum = 0
		for (let j = 0; j < nCriteria; j++) {
			const value = matrix2d[i][j]
			if (value <= 0) {
				// Nilai non-positif membuat WP tidak terdefinisi; perlakukan sebagai
				// nilai terburuk (ekspresi jadi mendekati 0).
				logSum = criteria[j].type === "benefit" ? -Number.MAX_VALUE / 2 : logSum
			} else {
				const sign = criteria[j].type === "benefit" ? 1 : -1
				logSum += sign * normalizedWeights[j] * Math.log(value)
			}
		}
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score: Math.exp(logSum),
			rank: 0,
		}
	})

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createWpStepDetails(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	inputWeights: number[],
): MethodStepDetails {
	const nCriteria = criteria.length
	const headers = criteria.map((c) => c.name)
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)
	const weights = normalizeWeights(inputWeights, nCriteria)

	const scoreRows = alternatives.map((_, i) => {
		let logSum = 0
		for (let j = 0; j < nCriteria; j++) {
			const value = matrix2d[i][j]
			if (value <= 0) {
				if (criteria[j].type === "benefit") {
					logSum = -Number.MAX_VALUE / 2
				}
				continue
			}
			const sign = criteria[j].type === "benefit" ? 1 : -1
			logSum += sign * weights[j] * Math.log(value)
		}
		return [Math.exp(logSum)]
	})

	return {
		step4Title: "Penyiapan pangkat bobot (WP)",
		step4Formula: [
			"w'_j = w_j / sum_j w_j (bobot dinormalisasi, sum = 1)",
			"pangkat benefit = +w'_j, pangkat cost = -w'_j",
		],
		step4Tables: [
			{
				title: "Pangkat per kriteria",
				rowHeader: "Pangkat",
				headers,
				rows: [
					{
						label: "w'_j (benefit +, cost -)",
						values: criteria.map((c, j) => (c.type === "benefit" ? weights[j] : -weights[j])),
					},
				],
			},
		],
		step6Title: "Menghitung nilai alternatif (WP)",
		step6Formula: [
			"S_i = prod_j (x_ij ^ w'_j)",
			"dihitung sebagai exp(sum_j w'_j * ln x_ij)",
		],
		step6Table: {
			title: "Vektor S (Weighted Product)",
			headers: ["S_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
		step6Notes: [
			"Ranking diurutkan dari S terbesar ke terkecil.",
			"Seluruh nilai matrix harus lebih besar dari 0.",
		],
	}
}
