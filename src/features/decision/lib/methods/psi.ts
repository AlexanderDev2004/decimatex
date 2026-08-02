import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, buildStepRows, createZeroMatrix } from "./shared"

/**
 * PSI (Preference Selection Index) — Maniya & Bhatt (2010).
 *
 * Urutan langkah sesuai literatur:
 * 1. Normalisasi matriks keputusan (benefit/cost, min-max)
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

	// 1. Normalisasi min-max dengan arah benefit/cost
	const minVal: number[] = []
	const maxVal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		minVal.push(Math.min(...matrix2d.map((row) => row[j])))
		maxVal.push(Math.max(...matrix2d.map((row) => row[j])))
	}

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const range = maxVal[j] - minVal[j]
			if (range === 0) {
				normalized[i][j] = 0
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (matrix2d[i][j] - minVal[j]) / range
			} else {
				normalized[i][j] = (maxVal[j] - matrix2d[i][j]) / range
			}
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
			"n_ij = (x_ij - min_j) / (max_j - min_j) untuk benefit",
			"n_ij = (max_j - x_ij) / (max_j - min_j) untuk cost",
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
