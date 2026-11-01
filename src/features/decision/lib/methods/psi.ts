import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, buildStepRows, createZeroMatrix } from "./shared"

/**
 * PSI (Preference Selection Index) — Maniya & Bhatt (2010).
 *
 * Urutan langkah sesuai literatur:
 * 1. Normalisasi vektor: n_ij = x_ij / sqrt(sum_i x_ij^2);
 *    kriteria cost memakai reciprocal 1/x_ij sebelum dinormalisasi
 * 2. Rata-rata tiap kriteria: N_j = (1/m) * sum_i n_ij
 * 3. Preference variation: PV_j = sum_i (n_ij - N_j)^2
 * 4. Deviasi: Ω_j = sqrt(PV_j)
 * 5. Overall preference (bobot diturunkan dari data): Ψ_j = Ω_j / sum_j Ω_j
 * 6. PSI_i = sum_j (n_ij * Ψ_j)
 * 7. Ranking: semakin besar PSI semakin baik.
 *
 * Catatan: bobot kriteria pada PSI DITURUNKAN dari variasi data (Ψ),
 * bukan dari bobot input user — ini ciri khas metode PSI.
 */
function runPsiInternal(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
): {
	normalized: number[][]
	mean: number[]
	pv: number[]
	omega: number[]
	psiWeights: number[]
	psi: number[]
} {
	const nCriteria = criteria.length
	const nAlternatives = alternatives.length
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)

	// 1. Normalisasi vektor sesuai Maniya & Bhatt (2010):
	//    n_ij = x_ij / sqrt(sum_i x_ij^2).
	//    Kriteria cost dikonversi dulu ke reciprocal (1/x_ij) supaya
	//    nilai ternormalisasi yang lebih besar selalu lebih baik.
	const base = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const value = matrix2d[i][j]
			if (criteria[j].type === "cost") {
				// Guard pembagian nol: cost <= 0 diperlakukan "gratis" (ideal).
				base[i][j] = value > 0 ? 1 / value : 1 / Number.EPSILON
			} else {
				base[i][j] = value
			}
		}
	}

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let j = 0; j < nCriteria; j++) {
		let sumSquares = 0
		for (let i = 0; i < nAlternatives; i++) {
			sumSquares += base[i][j] ** 2
		}
		const denom = Math.sqrt(sumSquares)
		for (let i = 0; i < nAlternatives; i++) {
			normalized[i][j] = denom === 0 ? 0 : base[i][j] / denom
		}
	}

	// 2. Rata-rata tiap kriteria: N_j
	const mean: number[] = Array(nCriteria).fill(0)
	for (let j = 0; j < nCriteria; j++) {
		for (let i = 0; i < nAlternatives; i++) {
			mean[j] += normalized[i][j]
		}
		mean[j] /= nAlternatives
	}

	// 3. Preference variation: PV_j = sum_i (n_ij - N_j)^2
	const pv: number[] = Array(nCriteria).fill(0)
	for (let j = 0; j < nCriteria; j++) {
		for (let i = 0; i < nAlternatives; i++) {
			const diff = normalized[i][j] - mean[j]
			pv[j] += diff * diff
		}
	}

	// 4. Deviasi: Ω_j = sqrt(PV_j)
	const omega = pv.map((value) => Math.sqrt(value))

	// 5. Overall preference: Ψ_j = Ω_j / sum_j Ω_j
	const totalOmega = omega.reduce((acc, value) => acc + value, 0)
	let psiWeights: number[]
	if (totalOmega <= 0) {
		// Semua kolom identik → tidak ada variasi → bobot sama rata
		psiWeights = nCriteria === 0 ? [] : Array(nCriteria).fill(1 / nCriteria)
	} else {
		psiWeights = omega.map((value) => value / totalOmega)
	}

	// 6. PSI_i = sum_j (n_ij * Ψ_j)
	const psi: number[] = Array(nAlternatives).fill(0)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			psi[i] += normalized[i][j] * psiWeights[j]
		}
	}

	return { normalized, mean, pv, omega, psiWeights, psi }
}

export function runPsi(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	_weights: number[],
): RankingResult[] {
	const { psi } = runPsiInternal(criteria, alternatives, matrix)

	const scores = alternatives.map((alt, i) => ({
		alternativeId: alt.id,
		alternativeName: alt.name,
		score: psi[i],
		rank: 0,
	}))

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createPsiStepDetails(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	_inputWeights: number[],
): MethodStepDetails {
	const { normalized, mean, pv, omega, psiWeights, psi } = runPsiInternal(
		criteria,
		alternatives,
		matrix,
	)
	const headers = criteria.map((c) => c.name)

	const step6Rows = alternatives.map((_, i) => [psi[i]])

	return {
		step4Title: "Normalisasi dan perhitungan variasi preferensi (PSI)",
		step4Formula: [
			"x'_ij = x_ij untuk benefit, 1/x_ij untuk cost",
			"n_ij = x'_ij / sqrt(sum_i x'_ij^2)",
			"N_j = (1/m) * sum_i n_ij",
			"PV_j = sum_i (n_ij - N_j)^2",
			"Ω_j = sqrt(PV_j)",
			"Ψ_j = Ω_j / sum_j Ω_j",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (N)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
			{
				title: "Statistik variasi per kriteria",
				rowHeader: "Statistik",
				headers,
				rows: [
					{ label: "N_j (rata-rata)", values: mean },
					{ label: "PV_j", values: pv },
					{ label: "Ω_j (deviasi)", values: omega },
					{ label: "Ψ_j (bobot PSI)", values: psiWeights },
				],
			},
		],
		step4Notes: [
			"PSI menurunkan bobot kriteria dari variasi data (Ψ_j), bukan dari bobot input.",
			"Semakin besar variasi nilai pada suatu kriteria, semakin besar pengaruhnya pada ranking.",
		],
		step6Title: "Menghitung Preference Selection Index (PSI)",
		step6Formula: ["PSI_i = sum_j (n_ij * Ψ_j)"],
		step6Table: {
			title: "Preference Selection Index",
			headers: ["PSI_i"],
			rows: buildStepRows(alternatives, step6Rows),
		},
		step6Notes: [
			`Bobot PSI (Ψ): [${psiWeights.map((w) => w.toFixed(4)).join(", ")}]`,
			"Ranking diurutkan dari PSI terbesar ke terkecil.",
		],
	}
}
