import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

/**
 * Normalisasi SAW: benefit = x/max, cost = min/x (nilai cost <= 0 dianggap ideal).
 * Diekspor juga untuk WASPAS yang memakai normalisasi yang sama.
 */
export function computeSawNormalized(
	criteria: Criteria[],
	matrix2d: number[][],
): number[][] {
	const nCriteria = criteria.length
	const nAlternatives = matrix2d.length

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let j = 0; j < nCriteria; j++) {
		const column = matrix2d.map((row) => row[j])
		const max = Math.max(...column)
		const min = Math.min(...column)
		for (let i = 0; i < nAlternatives; i++) {
			const value = matrix2d[i][j]
			if (criteria[j].type === "benefit") {
				normalized[i][j] = max === 0 ? 0 : value / max
			} else {
				// Guard: cost <= 0 dengan min < 0 bisa menghasilkan rasio negatif;
				// nilai cost <= 0 diperlakukan ideal (rasio 1).
				normalized[i][j] = value <= 0 ? 1 : min / value
			}
		}
	}
	return normalized
}

/**
 * SAW (Simple Additive Weighting) — Hwang & Yoon (1981).
 *
 * 1. Normalisasi: r_ij = x_ij / max_i(x_ij) untuk benefit,
 *    r_ij = min_i(x_ij) / x_ij untuk cost.
 * 2. Skor akhir: S_i = sum_j (w_j * r_ij).
 * 3. Ranking: skor terbesar terbaik.
 */
export function runSaw(
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
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			score += normalizedWeights[j] * normalized[i][j]
		}
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score,
			rank: 0,
		}
	})

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createSawStepDetails(
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

	const maxVal: number[] = []
	const minVal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		const column = matrix2d.map((row) => row[j])
		maxVal.push(Math.max(...column))
		minVal.push(Math.min(...column))
	}

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const value = matrix2d[i][j]
			if (criteria[j].type === "benefit") {
				normalized[i][j] = maxVal[j] === 0 ? 0 : value / maxVal[j]
			} else {
				normalized[i][j] = value <= 0 ? 1 : minVal[j] / value
			}
		}
	}

	const scoreRows = alternatives.map((_, i) => {
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			score += weights[j] * normalized[i][j]
		}
		return [score]
	})

	return {
		step4Title: "Normalisasi nilai setiap kriteria (SAW)",
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
		step4Notes: [
			`max per kriteria: ${criteria.map((c, j) => `${c.name}=${maxVal[j]}`).join(", ")}`,
			`min per kriteria: ${criteria.map((c, j) => `${c.name}=${minVal[j]}`).join(", ")}`,
		],
		step6Title: "Menghitung nilai alternatif (SAW)",
		step6Formula: ["S_i = sum_j (w_j * r_ij)"],
		step6Table: {
			title: "Nilai preferensi (S_i)",
			headers: ["S_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
	}
}
