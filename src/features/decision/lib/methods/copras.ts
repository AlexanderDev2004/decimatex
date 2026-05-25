import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

export function runCopras(
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

	const colSum: number[] = Array(nCriteria).fill(0)
	for (let j = 0; j < nCriteria; j++) {
		for (let i = 0; i < nAlternatives; i++) {
			colSum[j] += matrix2d[i][j]
		}
	}

	const normalized: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			normalized[i][j] = colSum[j] === 0 ? 0 : matrix2d[i][j] / colSum[j]
		}
	}

	const weighted: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			weighted[i][j] = normalized[i][j] * normalizedWeights[j]
		}
	}

	const sPlus: number[] = Array(nAlternatives).fill(0)
	const sMinus: number[] = Array(nAlternatives).fill(0)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			if (criteria[j].type === "benefit") {
				sPlus[i] += weighted[i][j]
			} else {
				sMinus[i] += weighted[i][j]
			}
		}
	}

	const hasCost = criteria.some((c) => c.type === "cost")
	const safeSMinus = sMinus.map((value) => (value <= 0 ? Number.EPSILON : value))
	const sumSMinus = safeSMinus.reduce((acc, value) => acc + value, 0)
	const sumInvSMinus = safeSMinus.reduce((acc, value) => acc + 1 / value, 0)

	const scores = alternatives.map((alt, i) => {
		const q =
			!hasCost || sumInvSMinus === 0
				? sPlus[i]
				: sPlus[i] + sumSMinus / (safeSMinus[i] * sumInvSMinus)
		return {
			alternativeId: alt.id,
			alternativeName: alt.name,
			score: q,
			rank: 0,
		}
	})

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createCoprasStepDetails(
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

	const colSum: number[] = Array(nCriteria).fill(0)
	for (let j = 0; j < nCriteria; j++) {
		for (let i = 0; i < nAlternatives; i++) {
			colSum[j] += matrix2d[i][j]
		}
	}

	const normalized = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			normalized[i][j] = colSum[j] === 0 ? 0 : matrix2d[i][j] / colSum[j]
		}
	}

	const weighted = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			weighted[i][j] = normalized[i][j] * weights[j]
		}
	}

	const sPlus: number[] = Array(nAlternatives).fill(0)
	const sMinus: number[] = Array(nAlternatives).fill(0)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			if (criteria[j].type === "benefit") {
				sPlus[i] += weighted[i][j]
			} else {
				sMinus[i] += weighted[i][j]
			}
		}
	}

	const hasCost = criteria.some((c) => c.type === "cost")
	const safeSMinus = sMinus.map((value) => (value <= 0 ? Number.EPSILON : value))
	const sumSMinus = safeSMinus.reduce((acc, value) => acc + value, 0)
	const sumInvSMinus = safeSMinus.reduce((acc, value) => acc + 1 / value, 0)

	const q: number[] = alternatives.map((_, i) => {
		if (!hasCost || sumInvSMinus === 0) {
			return sPlus[i]
		}
		return sPlus[i] + sumSMinus / (safeSMinus[i] * sumInvSMinus)
	})
	const qMax = Math.max(...q)

	const step6Rows = alternatives.map((_, i) => [
		sPlus[i],
		sMinus[i],
		q[i],
		qMax === 0 ? 0 : (q[i] / qMax) * 100,
	])

	return {
		step4Title: "Normalisasi nilai setiap kriteria (proposional COPRAS)",
		step4Formula: [
			"n_ij = x_ij / sum_i x_ij",
			"q_ij = w_j * n_ij",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (N)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
			{
				title: "Matriks terboboti (Q)",
				headers,
				rows: buildStepRows(alternatives, weighted),
			},
		],
		step6Title: "Menghitung nilai alternatif (COPRAS)",
		step6Formula: [
			"S_i+ = sum_j q_ij untuk kriteria benefit",
			"S_i- = sum_j q_ij untuk kriteria cost",
			"Q_i = S_i+ + (sum_i S_i-) / (S_i- * sum_i (1 / S_i-))",
			"U_i = (Q_i / Q_max) * 100%",
		],
		step6Notes: hasCost ? undefined : ["Tidak ada kriteria cost, sehingga Q_i = S_i+."],
		step6Table: {
			title: "Signifikansi relatif dan utility",
			headers: ["S+", "S-", "Q_i", "U_i (%)"],
			rows: buildStepRows(alternatives, step6Rows),
		},
	}
}
