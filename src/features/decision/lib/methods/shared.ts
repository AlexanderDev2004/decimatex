export interface Criteria {
	id: string
	name: string
	type: "benefit" | "cost"
	weight: number
}

export interface Alternative {
	id: string
	name: string
}

export interface MatrixValue {
	alternativeId: string
	criteriaId: string
	value: number
}

export interface RankingResult {
	alternativeId: string
	alternativeName: string
	score: number
	rank: number
}

export interface StepTable {
	title: string
	headers: string[]
	rows: Array<{
		label: string
		values: number[]
	}>
	rowHeader?: string
	digits?: number
}

export interface MethodStepDetails {
	step3Title?: string
	step3Formula?: string[]
	step3Tables?: StepTable[]
	step3Notes?: string[]
	step4Title: string
	step4Formula: string[]
	step4Tables: StepTable[]
	step4Notes?: string[]
	step5Title?: string
	step5Formula?: string[]
	step5Table?: StepTable
	step5Notes?: string[]
	step6Title: string
	step6Formula: string[]
	step6Table: StepTable
	step6Notes?: string[]
}

export function formatNumber(value: number, digits = 4): string {
	if (!Number.isFinite(value)) {
		return "-"
	}
	return value.toFixed(digits)
}

export function buildMatrix2d(
	criteria: Criteria[],
	alternatives: Alternative[],
	matrix: MatrixValue[],
): number[][] {
	const matrix2d: number[][] = Array(alternatives.length)
		.fill(null)
		.map(() => Array(criteria.length).fill(0))
	matrix.forEach((m) => {
		const altIdx = alternatives.findIndex((a) => a.id === m.alternativeId)
		const critIdx = criteria.findIndex((c) => c.id === m.criteriaId)
		if (altIdx !== -1 && critIdx !== -1) {
			matrix2d[altIdx][critIdx] = m.value
		}
	})
	return matrix2d
}

export function buildEqualWeights(nCriteria: number): number[] {
	if (nCriteria === 0) {
		return []
	}
	return Array(nCriteria).fill(1 / nCriteria)
}

export function normalizeWeights(weights: number[], fallbackCount: number): number[] {
	if (fallbackCount === 0) {
		return []
	}

	const sanitized = weights.map((weight) => {
		if (!Number.isFinite(weight)) {
			return 0
		}
		return Math.max(0, weight)
	})

	const total = sanitized.reduce((acc, weight) => acc + weight, 0)
	if (total <= 0) {
		return buildEqualWeights(fallbackCount)
	}

	return sanitized.map((weight) => weight / total)
}

export function buildStepRows(alternatives: Alternative[], values: number[][]): StepTable["rows"] {
	return alternatives.map((alt, i) => ({
		label: alt.name,
		values: values[i] ?? [],
	}))
}

export function createZeroMatrix(nRows: number, nCols: number): number[][] {
	return Array(nRows).fill(null).map(() => Array(nCols).fill(0))
}
