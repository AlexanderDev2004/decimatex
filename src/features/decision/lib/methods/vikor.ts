import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, formatNumber, buildStepRows, createZeroMatrix } from "./shared"

export function runVikor(
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

	const fMax: number[] = []
	const fMin: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		fMax.push(Math.max(...matrix2d.map((row) => row[j])))
		fMin.push(Math.min(...matrix2d.map((row) => row[j])))
	}

	const normalized: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const range = fMax[j] - fMin[j]
			if (range === 0) {
				normalized[i][j] = 0
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (fMax[j] - matrix2d[i][j]) / range
			} else {
				normalized[i][j] = (matrix2d[i][j] - fMin[j]) / range
			}
		}
	}

	const s: number[] = Array(nAlternatives).fill(0)
	const r: number[] = Array(nAlternatives).fill(0)

	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			s[i] += normalizedWeights[j] * normalized[i][j]
			r[i] = Math.max(r[i], normalizedWeights[j] * normalized[i][j])
		}
	}

	const sMax = Math.max(...s)
	const sMin = Math.min(...s)
	const rMax = Math.max(...r)
	const rMin = Math.min(...r)

	const v = 0.5

	const scores = alternatives.map((alt, i) => {
		const q =
			v * (sMax === sMin ? 0 : (s[i] - sMin) / (sMax - sMin)) +
			(1 - v) * (rMax === rMin ? 0 : (r[i] - rMin) / (rMax - rMin))
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score: q,
			rank: 0,
		}
	})

	scores.sort((a, b) => a.score - b.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createVikorStepDetails(
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

	const fStar: number[] = []
	const fMinus: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		const column = matrix2d.map((row) => row[j])
		const max = Math.max(...column)
		const min = Math.min(...column)
		if (criteria[j].type === "benefit") {
			fStar[j] = max
			fMinus[j] = min
		} else {
			fStar[j] = min
			fMinus[j] = max
		}
	}

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const divider = fStar[j] - fMinus[j]
			if (divider === 0) {
				normalized[i][j] = 0
			} else if (criteria[j].type === "benefit") {
				normalized[i][j] = (fStar[j] - matrix2d[i][j]) / divider
			} else {
				normalized[i][j] = (matrix2d[i][j] - fStar[j]) / (fMinus[j] - fStar[j])
			}
		}
	}

	const s: number[] = Array(nAlternatives).fill(0)
	const r: number[] = Array(nAlternatives).fill(0)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			const value = weights[j] * normalized[i][j]
			s[i] += value
			r[i] = Math.max(r[i], value)
		}
	}

	const sBest = Math.min(...s)
	const sWorst = Math.max(...s)
	const rBest = Math.min(...r)
	const rWorst = Math.max(...r)
	const v = 0.5

	const step6Rows = alternatives.map((_, i) => {
		const q =
			v * (sWorst === sBest ? 0 : (s[i] - sBest) / (sWorst - sBest)) +
			(1 - v) * (rWorst === rBest ? 0 : (r[i] - rBest) / (rWorst - rBest))
		return [s[i], r[i], q]
	})

	return {
		step4Title: "Normalisasi terhadap solusi terbaik-terburuk (VIKOR)",
		step4Formula: [
			"f_j* = nilai terbaik, f_j- = nilai terburuk per kriteria",
			"r_ij = (f_j* - x_ij) / (f_j* - f_j-) untuk benefit",
			"r_ij = (x_ij - f_j*) / (f_j- - f_j*) untuk cost",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi VIKOR (r_ij)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
		],
		step4Notes: [
			`f*: ${criteria.map((c, j) => `${c.name}=${formatNumber(fStar[j])}`).join(", ")}`,
			`f-: ${criteria.map((c, j) => `${c.name}=${formatNumber(fMinus[j])}`).join(", ")}`,
		],
		step6Title: "Menghitung nilai alternatif (VIKOR)",
		step6Formula: [
			"S_i = sum_j (w_j * r_ij)",
			"R_i = max_j (w_j * r_ij)",
			"Q_i = v * (S_i - S*)/(S- - S*) + (1-v) * (R_i - R*)/(R- - R*)",
			"v = 0.5 pada implementasi ini",
		],
		step6Table: {
			title: "Indeks kompromi VIKOR (Q_i)",
			headers: ["S_i", "R_i", "Q_i"],
			rows: buildStepRows(alternatives, step6Rows),
		},
	}
}
