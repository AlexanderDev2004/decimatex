import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, buildStepRows, createZeroMatrix } from "./shared"

export function runEdas(
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

	const avg: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		let sum = 0
		for (let i = 0; i < nAlternatives; i++) {
			sum += matrix2d[i][j]
		}
		avg.push(sum / nAlternatives)
	}

	const pda: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	const nda: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))

	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			if (criteria[j].type === "benefit") {
				pda[i][j] = avg[j] === 0 ? 0 : (matrix2d[i][j] - avg[j]) / avg[j]
				nda[i][j] = avg[j] === 0 ? 0 : (avg[j] - matrix2d[i][j]) / avg[j]
			} else {
				pda[i][j] = avg[j] === 0 ? 0 : (avg[j] - matrix2d[i][j]) / avg[j]
				nda[i][j] = avg[j] === 0 ? 0 : (matrix2d[i][j] - avg[j]) / avg[j]
			}
		}
	}

	const sp: number[] = Array(nAlternatives).fill(0)
	const sn: number[] = Array(nAlternatives).fill(0)

	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			sp[i] += normalizedWeights[j] * Math.max(0, pda[i][j])
			sn[i] += normalizedWeights[j] * Math.max(0, nda[i][j])
		}
	}

	const maxSp = Math.max(...sp)
	const maxSn = Math.max(...sn)

	const nsp = maxSp === 0 ? sp.map(() => 0) : sp.map((s) => s / maxSp)
	const nsn = maxSn === 0 ? sn.map(() => 1) : sn.map((s) => 1 - s / maxSn)

	const scores = alternatives.map((alt, i) => ({
		alternativeId: alt.id,
		alternativeName: alt.name,
		score: (nsp[i] + nsn[i]) / 2,
		rank: 0,
	}))

	scores.sort((a, b) => b.score - a.score)
	scores.forEach((s, i) => (s.rank = i + 1))

	return scores
}

export function createEdasStepDetails(
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

	const avg: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		let total = 0
		for (let i = 0; i < nAlternatives; i++) {
			total += matrix2d[i][j]
		}
		avg[j] = total / nAlternatives
	}

	const pda = createZeroMatrix(nAlternatives, nCriteria)
	const nda = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			if (avg[j] === 0) {
				pda[i][j] = 0
				nda[i][j] = 0
				continue
			}
			if (criteria[j].type === "benefit") {
				pda[i][j] = Math.max(0, (matrix2d[i][j] - avg[j]) / avg[j])
				nda[i][j] = Math.max(0, (avg[j] - matrix2d[i][j]) / avg[j])
			} else {
				pda[i][j] = Math.max(0, (avg[j] - matrix2d[i][j]) / avg[j])
				nda[i][j] = Math.max(0, (matrix2d[i][j] - avg[j]) / avg[j])
			}
		}
	}

	const sp: number[] = Array(nAlternatives).fill(0)
	const sn: number[] = Array(nAlternatives).fill(0)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			sp[i] += weights[j] * pda[i][j]
			sn[i] += weights[j] * nda[i][j]
		}
	}

	const maxSp = Math.max(...sp)
	const maxSn = Math.max(...sn)
	const scoreRows = alternatives.map((_, i) => {
		const nsp = maxSp === 0 ? 0 : sp[i] / maxSp
		const nsn = maxSn === 0 ? 1 : 1 - sn[i] / maxSn
		const as = (nsp + nsn) / 2
		return [sp[i], sn[i], nsp, nsn, as]
	})

	return {
		step4Title: "Normalisasi/deviasi terhadap rata-rata (EDAS)",
		step4Formula: [
			"AV_j = (1/m) * sum_i x_ij",
			"PDA_ij = max(0, (x_ij - AV_j)/AV_j) untuk benefit",
			"PDA_ij = max(0, (AV_j - x_ij)/AV_j) untuk cost",
			"NDA_ij = max(0, (AV_j - x_ij)/AV_j) untuk benefit",
			"NDA_ij = max(0, (x_ij - AV_j)/AV_j) untuk cost",
		],
		step4Tables: [
			{
				title: "Rata-rata tiap kriteria (AV)",
				rowHeader: "Statistik",
				headers,
				rows: [
					{
						label: "AV",
						values: avg,
					},
				],
			},
			{
				title: "Positive Distance from Average (PDA)",
				headers,
				rows: buildStepRows(alternatives, pda),
			},
			{
				title: "Negative Distance from Average (NDA)",
				headers,
				rows: buildStepRows(alternatives, nda),
			},
		],
		step6Title: "Menghitung nilai alternatif (EDAS)",
		step6Formula: [
			"SP_i = sum_j (w_j * PDA_ij)",
			"SN_i = sum_j (w_j * NDA_ij)",
			"NSP_i = SP_i / max(SP)",
			"NSN_i = 1 - (SN_i / max(SN))",
			"AS_i = (NSP_i + NSN_i) / 2",
		],
		step6Table: {
			title: "Skor akhir EDAS",
			headers: ["SP", "SN", "NSP", "NSN", "AS_i"],
			rows: buildStepRows(alternatives, scoreRows),
		},
	}
}
