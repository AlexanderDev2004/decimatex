import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

/**
 * GRA (Grey Relational Analysis) — Deng Julong (1982), varian MCDM berbobot.
 *
 * 1. Normalisasi min-max dengan arah benefit/cost.
 * 2. Sekuens referensi x0_j = 1 (nilai ternormalisasi terbaik).
 * 3. Delta: Δ_ij = |x0_j - r_ij|.
 * 4. Koefisien relasi abu-abu: ξ_ij = (Δmin + ζ*Δmax) / (Δ_ij + ζ*Δmax),
 *    dengan ζ (distinguishing coefficient) = 0.5.
 * 5. Nilai GRA: GC_i = sum_j (w_j * ξ_ij). Ranking: GC terbesar terbaik.
 */
const ZETA = 0.5

export function runGra(
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
		const column = matrix2d.map((row) => row[j])
		const max = Math.max(...column)
		const min = Math.min(...column)
		const range = max - min
		for (let i = 0; i < nAlternatives; i++) {
			if (range === 0) {
				// Kolom identik: semua alternatif setara pada kriteria ini.
				normalized[i][j] = 1
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (matrix2d[i][j] - min) / range
			} else {
				normalized[i][j] = (max - matrix2d[i][j]) / range
			}
		}
	}

	// Sekuens referensi adalah 1, jadi delta = 1 - r_ij.
	const deltas = createZeroMatrix(nAlternatives, nCriteria)
	let deltaMin = Number.POSITIVE_INFINITY
	let deltaMax = 0
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const delta = Math.abs(1 - normalized[i][j])
			deltas[i][j] = delta
			deltaMin = Math.min(deltaMin, delta)
			deltaMax = Math.max(deltaMax, delta)
		}
	}

	const scores = alternatives.map((alt, i) => {
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			const coefficient =
				deltaMax === 0 ? 1 : (deltaMin + ZETA * deltaMax) / (deltas[i][j] + ZETA * deltaMax)
			score += normalizedWeights[j] * coefficient
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

export function createGraStepDetails(
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
		const column = matrix2d.map((row) => row[j])
		const max = Math.max(...column)
		const min = Math.min(...column)
		const range = max - min
		for (let i = 0; i < nAlternatives; i++) {
			if (range === 0) {
				normalized[i][j] = 1
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (matrix2d[i][j] - min) / range
			} else {
				normalized[i][j] = (max - matrix2d[i][j]) / range
			}
		}
	}

	const deltas = createZeroMatrix(nAlternatives, nCriteria)
	let deltaMin = Number.POSITIVE_INFINITY
	let deltaMax = 0
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const delta = Math.abs(1 - normalized[i][j])
			deltas[i][j] = delta
			deltaMin = Math.min(deltaMin, delta)
			deltaMax = Math.max(deltaMax, delta)
		}
	}

	const coefficientRows = alternatives.map((_, i) =>
		deltas[i].map((delta) => (deltaMax === 0 ? 1 : (deltaMin + ZETA * deltaMax) / (delta + ZETA * deltaMax))),
	)

	const scoreRows = alternatives.map((_, i) => [
		weights.reduce((acc, w, j) => acc + w * coefficientRows[i][j], 0),
	])

	return {
		step4Title: "Normalisasi min-max dan delta terhadap sekuens referensi (GRA)",
		step4Formula: [
			"r_ij = (x_ij - min_j)/(max_j - min_j) untuk benefit",
			"r_ij = (max_j - x_ij)/(max_j - min_j) untuk cost",
			"x0_j = 1 (sekuens referensi)",
			"Δ_ij = |x0_j - r_ij|",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (R)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
			{
				title: "Delta terhadap sekuens referensi (Δ)",
				headers,
				rows: buildStepRows(alternatives, deltas),
			},
			{
				title: "Koefisien relasi abu-abu (ξ)",
				headers,
				rows: buildStepRows(alternatives, coefficientRows),
			},
		],
		step4Notes: [
			`Δmin = ${deltaMin.toFixed(6)}, Δmax = ${deltaMax.toFixed(6)}, ζ = ${ZETA}`,
		],
		step6Title: "Menghitung nilai alternatif (GRA)",
		step6Formula: [
			"ξ_ij = (Δmin + 0.5*Δmax) / (Δ_ij + 0.5*Δmax)",
			"GC_i = sum_j (w_j * ξ_ij)",
		],
		step6Table: {
			title: "Grey relational grade (GC)",
			headers: ["GC_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
	}
}
