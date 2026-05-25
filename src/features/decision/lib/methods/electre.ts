import type { Criteria, Alternative, MatrixValue, RankingResult, MethodStepDetails } from "./shared"
import { buildMatrix2d, normalizeWeights, formatNumber, buildStepRows, createZeroMatrix } from "./shared"

export function runElectre(
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

	const minVal: number[] = []
	const maxVal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		minVal.push(Math.min(...matrix2d.map((row) => row[j])))
		maxVal.push(Math.max(...matrix2d.map((row) => row[j])))
	}

	const normalized: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
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

	const weighted: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nCriteria).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			weighted[i][j] = normalized[i][j] * normalizedWeights[j]
		}
	}

	const concordance: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(0))
	const discordance: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(0))

	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i === k) continue

			let concordanceValue = 0
			let maxDiffAll = 0
			let maxDiffDisadvantage = 0

			for (let j = 0; j < nCriteria; j++) {
				const diff = Math.abs(weighted[i][j] - weighted[k][j])
				maxDiffAll = Math.max(maxDiffAll, diff)

				if (weighted[i][j] >= weighted[k][j]) {
					concordanceValue += normalizedWeights[j]
				} else {
					maxDiffDisadvantage = Math.max(maxDiffDisadvantage, diff)
				}
			}

			concordance[i][k] = concordanceValue
			discordance[i][k] = maxDiffAll === 0 ? 0 : maxDiffDisadvantage / maxDiffAll
		}
	}

	let pairCount = 0
	let concordanceTotal = 0
	let discordanceTotal = 0
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i !== k) {
				pairCount += 1
				concordanceTotal += concordance[i][k]
				discordanceTotal += discordance[i][k]
			}
		}
	}

	const thresholdConc = pairCount === 0 ? 0 : concordanceTotal / pairCount
	const thresholdDisc = pairCount === 0 ? 0 : discordanceTotal / pairCount

	const outrank: boolean[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(false))
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i !== k && concordance[i][k] >= thresholdConc && discordance[i][k] <= thresholdDisc) {
				outrank[i][k] = true
			}
		}
	}

	const scores = alternatives.map((alt, i) => {
		let score = 0
		for (let k = 0; k < nAlternatives; k++) {
			if (outrank[i][k]) score += 1
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

export function createElectreStepDetails(
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

	const minVal: number[] = []
	const maxVal: number[] = []
	for (let j = 0; j < nCriteria; j++) {
		minVal[j] = Math.min(...matrix2d.map((row) => row[j]))
		maxVal[j] = Math.max(...matrix2d.map((row) => row[j]))
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

	const weighted = createZeroMatrix(nAlternatives, nCriteria)
	for (let i = 0; i < nAlternatives; i++) {
		for (let j = 0; j < nCriteria; j++) {
			weighted[i][j] = normalized[i][j] * weights[j]
		}
	}

	const concordance: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(0))
	const discordance: number[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(0))
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i === k) {
				continue
			}
			let concordanceValue = 0
			let maxDiffAll = 0
			let maxDiffDisadvantage = 0
			for (let j = 0; j < nCriteria; j++) {
				const diff = Math.abs(weighted[i][j] - weighted[k][j])
				maxDiffAll = Math.max(maxDiffAll, diff)
				if (weighted[i][j] >= weighted[k][j]) {
					concordanceValue += weights[j]
				} else {
					maxDiffDisadvantage = Math.max(maxDiffDisadvantage, diff)
				}
			}
			concordance[i][k] = concordanceValue
			discordance[i][k] = maxDiffAll === 0 ? 0 : maxDiffDisadvantage / maxDiffAll
		}
	}

	let pairCount = 0
	let concTotal = 0
	let discTotal = 0
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i !== k) {
				pairCount += 1
				concTotal += concordance[i][k]
				discTotal += discordance[i][k]
			}
		}
	}
	const thresholdConc = pairCount === 0 ? 0 : concTotal / pairCount
	const thresholdDisc = pairCount === 0 ? 0 : discTotal / pairCount

	const outrank: boolean[][] = Array(nAlternatives)
		.fill(null)
		.map(() => Array(nAlternatives).fill(false))
	for (let i = 0; i < nAlternatives; i++) {
		for (let k = 0; k < nAlternatives; k++) {
			if (i !== k && concordance[i][k] >= thresholdConc && discordance[i][k] <= thresholdDisc) {
				outrank[i][k] = true
			}
		}
	}

	const divider = nAlternatives > 1 ? nAlternatives - 1 : 1
	const step6Rows = alternatives.map((_, i) => {
		const avgConc = concordance[i].reduce((acc, value, k) => (i === k ? acc : acc + value), 0) / divider
		const avgDisc = discordance[i].reduce((acc, value, k) => (i === k ? acc : acc + value), 0) / divider
		const outrankCount = outrank[i].filter(Boolean).length
		return [avgConc, avgDisc, outrankCount]
	})

	return {
		step4Title: "Normalisasi nilai setiap kriteria (Min-Max ELECTRE)",
		step4Formula: [
			"r_ij = (x_ij - min_j)/(max_j - min_j) untuk benefit",
			"r_ij = (max_j - x_ij)/(max_j - min_j) untuk cost",
			"v_ij = w_j * r_ij",
		],
		step4Tables: [
			{
				title: "Matriks normalisasi (R)",
				headers,
				rows: buildStepRows(alternatives, normalized),
			},
			{
				title: "Matriks terboboti (V)",
				headers,
				rows: buildStepRows(alternatives, weighted),
			},
		],
		step6Title: "Menghitung nilai alternatif (ELECTRE)",
		step6Formula: [
			"C_ik = sum_j w_j untuk semua j dengan v_ij >= v_kj",
			"D_ik = max_{j:v_ij<v_kj}|v_ij-v_kj| / max_j|v_ij-v_kj|",
			"c* = rata-rata C_ik, d* = rata-rata D_ik",
			"i outrank k jika C_ik >= c* dan D_ik <= d*",
		],
		step6Notes: [
			`Ambang concordance (c*): ${formatNumber(thresholdConc)}`,
			`Ambang discordance (d*): ${formatNumber(thresholdDisc)}`,
		],
		step6Table: {
			title: "Ringkasan outranking per alternatif",
			headers: ["C_out", "D_out", "Outranking"],
			rows: buildStepRows(alternatives, step6Rows),
			digits: 4,
		},
	}
}
