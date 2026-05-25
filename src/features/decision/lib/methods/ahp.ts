import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

export function runAhp(
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
			sum += matrix2d[i][j]
		}
		for (let i = 0; i < nAlternatives; i++) {
			normalized[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
		}
	}

	const scores = alternatives.map((alt, i) => {
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			score += normalized[i][j] * normalizedWeights[j]
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

export function createAhpStepDetails(
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
			sum += matrix2d[i][j]
		}
		for (let i = 0; i < nAlternatives; i++) {
			normalized[i][j] = sum === 0 ? 0 : matrix2d[i][j] / sum
		}
	}

	const step6Rows = alternatives.map((_, i) => {
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			score += normalized[i][j] * weights[j]
		}
		return [score]
	})

	return {
		step4Title: "Normalisasi nilai setiap kriteria (AHP sederhana)",
		step4Formula: ["n_ij = x_ij / sum_i x_ij"],
		step4Tables: [
			{
				title: "Matriks normalisasi (N)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
		],
		step4Notes: [
			"Catatan: AHP penuh membutuhkan matriks perbandingan berpasangan. Implementasi halaman ini memakai pendekatan normalisasi matriks keputusan.",
		],
		step6Title: "Menghitung nilai alternatif (AHP sederhana)",
		step6Formula: ["A_i = sum_j (w_j * n_ij)"],
		step6Table: {
			title: "Skor alternatif",
			headers: ["A_i"],
			rows: buildStepRows(alternatives, step6Rows),
		},
	}
}
