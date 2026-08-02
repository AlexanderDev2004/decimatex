import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix, formatNumber } from "./shared"

/**
 * Random Index (RI) values for consistency check.
 * Based on Saaty's table for n = 1..15.
 */
const RANDOM_INDEX: Record<number, number> = {
	1: 0,
	2: 0,
	3: 0.58,
	4: 0.90,
	5: 1.12,
	6: 1.24,
	7: 1.32,
	8: 1.41,
	9: 1.45,
	10: 1.49,
	11: 1.51,
	12: 1.48,
	13: 1.56,
	14: 1.57,
	15: 1.59,
}

/**
 * Calculate Consistency Ratio (CR) from a pairwise comparison matrix.
 * 
 * @param matrix - Square pairwise comparison matrix (n x n)
 * @returns { lambdaMax, ci, cr, isConsistent } - Consistency metrics
 */
function calculateConsistency(matrix: number[][]): {
	lambdaMax: number
	ci: number
	cr: number
	isConsistent: boolean
} {
	const n = matrix.length
	if (n <= 2) {
		return { lambdaMax: n, ci: 0, cr: 0, isConsistent: true }
	}

	// Step 1: Normalize columns
	const normalized: number[][] = createZeroMatrix(n, n)
	const colSums: number[] = Array(n).fill(0)

	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			colSums[j] += matrix[i][j]
		}
	}

	for (let j = 0; j < n; j++) {
		for (let i = 0; i < n; i++) {
			normalized[i][j] = colSums[j] === 0 ? 0 : matrix[i][j] / colSums[j]
		}
	}

	// Step 2: Calculate priority vector (row averages)
	const priorityVector: number[] = Array(n).fill(0)
	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			priorityVector[i] += normalized[i][j]
		}
		priorityVector[i] /= n
	}

	// Step 3: Calculate lambda_max
	// λ_max = (1/n) * Σ(w_j * colSum_j) where w_j is the priority vector
	let lambdaMax = 0
	for (let j = 0; j < n; j++) {
		lambdaMax += priorityVector[j] * colSums[j]
	}
	lambdaMax /= n

	// Step 4: Calculate Consistency Index (CI)
	const ci = (lambdaMax - n) / (n - 1)

	// Step 5: Calculate Consistency Ratio (CR)
	const ri = RANDOM_INDEX[n] ?? 1.59
	const cr = ri === 0 ? 0 : ci / ri

	return {
		lambdaMax,
		ci,
		cr,
		isConsistent: cr < 0.1,
	}
}

/**
 * Build pairwise comparison matrix from absolute values.
 * For benefit criteria: a_ij = x_i / x_j (higher is better)
 * For cost criteria: a_ij = x_j / x_i (lower is better)
 */
function buildPairwiseFromValues(
	values: number[],
	type: "benefit" | "cost",
): number[][] {
	const n = values.length
	const matrix = createZeroMatrix(n, n)

	for (let i = 0; i < n; i++) {
		for (let j = 0; j < n; j++) {
			if (i === j) {
				matrix[i][j] = 1
			} else if (values[j] === 0) {
				// Avoid division by zero - use large value
				matrix[i][j] = type === "benefit" ? 9 : 1 / 9
			} else {
				const ratio = values[i] / values[j]
				// Clamp to Saaty's 1-9 scale
				matrix[i][j] = type === "benefit"
					? Math.min(Math.max(ratio, 1 / 9), 9)
					: Math.min(Math.max(1 / ratio, 1 / 9), 9)
			}
		}
	}

	return matrix
}

/**
 * Full AHP (Analytic Hierarchy Process) implementation.
 * 
 * This implementation:
 * 1. Uses input weights as the criteria priority vector
 * 2. For each criterion, builds pairwise comparison matrix from alternative values
 * 3. Calculates consistency ratio for each pairwise comparison
 * 4. Derives alternative scores using eigenvector method
 */
export function runAhp(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
	weights: number[],
): RankingResult[] {
	const nCriteria = criteria.length
	const nAlternatives = alternatives.length
	const normalizedWeights = normalizeWeights(weights, nCriteria)

	// Build the decision matrix
	const matrix2d = buildMatrix2d(criteria, alternatives, matrix)

	// For each criterion, calculate alternative priority vectors
	const alternativeScores: number[] = Array(nAlternatives).fill(0)

	for (let j = 0; j < nCriteria; j++) {
		// Extract values for this criterion
		const values = matrix2d.map((row) => row[j])

		// Build pairwise comparison matrix
		const pairwise = buildPairwiseFromValues(values, criteria[j].type)

		// Calculate priority vector from pairwise comparison
		const n = pairwise.length
		const normalized = createZeroMatrix(n, n)
		const colSums: number[] = Array(n).fill(0)

		for (let jj = 0; jj < n; jj++) {
			for (let ii = 0; ii < n; ii++) {
				colSums[jj] += pairwise[ii][jj]
			}
		}

		for (let jj = 0; jj < n; jj++) {
			for (let ii = 0; ii < n; ii++) {
				normalized[ii][jj] = colSums[jj] === 0 ? 0 : pairwise[ii][jj] / colSums[jj]
			}
		}

		// Row averages = priority vector for alternatives on this criterion
		const priorityVector: number[] = Array(n).fill(0)
		for (let ii = 0; ii < n; ii++) {
			for (let jj = 0; jj < n; jj++) {
				priorityVector[ii] += normalized[ii][jj]
			}
			priorityVector[ii] /= n
		}

		// Add weighted contribution to final scores
		for (let i = 0; i < nAlternatives; i++) {
			alternativeScores[i] += priorityVector[i] * normalizedWeights[j]
		}
	}

	// Create ranking results
	const scores = alternatives.map((alt, i) => ({
		alternativeId: alt.id,
		alternativeName: alt.name,
		score: alternativeScores[i],
		rank: 0,
	}))

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

/**
 * Create detailed step-by-step explanation for AHP calculation.
 */
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

	// Step 4: Normalization and consistency check
	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	const pairwiseMatrices: number[][][] = []
	const consistencyResults: Array<{
		criteriaName: string
		lambdaMax: number
		ci: number
		cr: number
		isConsistent: boolean
	}> = []

	for (let j = 0; j < nCriteria; j++) {
		const values = matrix2d.map((row) => row[j])
		const pairwise = buildPairwiseFromValues(values, criteria[j].type)
		pairwiseMatrices.push(pairwise)

		// Calculate consistency for this criterion
		const consistency = calculateConsistency(pairwise)
		consistencyResults.push({
			criteriaName: criteria[j].name,
			lambdaMax: consistency.lambdaMax,
			ci: consistency.ci,
			cr: consistency.cr,
			isConsistent: consistency.isConsistent,
		})

		// Normalize pairwise matrix
		const n = pairwise.length
		const colSums: number[] = Array(n).fill(0)
		for (let jj = 0; jj < n; jj++) {
			for (let ii = 0; ii < n; ii++) {
				colSums[jj] += pairwise[ii][jj]
			}
		}

		const pairwiseNormalized = createZeroMatrix(n, n)
		for (let jj = 0; jj < n; jj++) {
			for (let ii = 0; ii < n; ii++) {
				pairwiseNormalized[ii][jj] = colSums[jj] === 0 ? 0 : pairwise[ii][jj] / colSums[jj]
			}
		}

		// Calculate priority vector
		const priorityVector: number[] = Array(n).fill(0)
		for (let ii = 0; ii < n; ii++) {
			for (let jj = 0; jj < n; jj++) {
				priorityVector[ii] += pairwiseNormalized[ii][jj]
			}
			priorityVector[ii] /= n
		}

		// Store normalized decision matrix (using priority vectors)
		for (let i = 0; i < nAlternatives; i++) {
			normalized[i][j] = priorityVector[i]
		}
	}

	// Step 6: Weighted scores
	const step6Rows = alternatives.map((_, i) => {
		let score = 0
		for (let j = 0; j < nCriteria; j++) {
			score += normalized[i][j] * weights[j]
		}
		return [score]
	})

	// Build consistency notes
	const consistencyNotes: string[] = [
		"Rumus AHP:",
		"1. Matriks Perbandingan Berpasangan: a_ij = x_i / x_j (benefit) atau x_j / x_i (cost)",
		"2. Normalisasi: n_ij = a_ij / Σ_i(a_ij)",
		"3. Vektor Prioritas: w_i = (1/n) * Σ_j(n_ij)",
		"4. λ_max = (1/n) * Σ_j(w_j * Σ_i(a_ij))",
		"5. CI = (λ_max - n) / (n - 1)",
		"6. CR = CI / RI (konsisten jika CR < 0.1)",
		"",
		"Catatan: Bobot kriteria diinput langsung. Vektor prioritas alternatif dihitung dari matriks perbandingan berpasangan.",
		"",
		"Hasil Pemeriksaan Konsistensi:",
	]

	for (const result of consistencyResults) {
		const status = result.isConsistent ? "✅ Konsisten" : "⚠️ Tidak Konsisten"
		consistencyNotes.push(
			`- ${result.criteriaName}: λ_max=${formatNumber(result.lambdaMax)}, CI=${formatNumber(result.ci)}, CR=${formatNumber(result.cr)} → ${status}`
		)
	}

	return {
		step4Title: "Normalisasi Matriks Perbandingan & Pemeriksaan Konsistensi",
		step4Formula: [
			"a_ij = x_i / x_j (benefit) atau x_j / x_i (cost)",
			"n_ij = a_ij / Σ_i(a_ij)",
			"w_i = (1/n) * Σ_j(n_ij)",
			"λ_max = (1/n) * Σ_j(w_j * Σ_i(a_ij))",
			"CI = (λ_max - n) / (n - 1)",
			"CR = CI / RI",
		],
		step4Tables: [
			{
				title: "Matriks Normalisasi Keputusan (Vektor Prioritas Alternatif)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
		],
		step4Notes: consistencyNotes,
		step6Title: "Perhitungan Skor Akhir dengan Vektor Prioritas",
		step6Formula: [
			"A_i = Σ_j(w_j * v_ij)",
			"dimana w_j = bobot kriteria, v_ij = vektor prioritas alternatif",
		],
		step6Table: {
			title: "Skor Akhir dan Ranking",
			headers: ["Skor AHP"],
			rows: buildStepRows(alternatives, step6Rows),
		},
		step6Notes: [
			`Vektor Prioritas Kriteria: [${weights.map((w) => formatNumber(w)).join(", ")}]`,
			"Ranking diurutkan dari skor tertinggi ke terendah.",
		],
	}
}
