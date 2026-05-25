import { describe, it, expect } from "vitest"
import {
	buildMatrix2d,
	normalizeWeights,
	formatNumber,
	buildEqualWeights,
	buildStepRows,
	createZeroMatrix,
} from "./shared"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("shared utilities", () => {
	describe("formatNumber", () => {
		it("should format finite numbers with given digits", () => {
			expect(formatNumber(3.14159, 2)).toBe("3.14")
			expect(formatNumber(3.14159, 4)).toBe("3.1416")
			expect(formatNumber(0, 4)).toBe("0.0000")
		})

		it("should return dash for non-finite values", () => {
			expect(formatNumber(Infinity, 4)).toBe("-")
			expect(formatNumber(-Infinity, 4)).toBe("-")
			expect(formatNumber(NaN, 4)).toBe("-")
		})
	})

	describe("buildMatrix2d", () => {
		const criteria: Criteria[] = [
			{ id: "c1", name: "C1", type: "benefit", weight: 0.5 },
			{ id: "c2", name: "C2", type: "cost", weight: 0.5 },
		]
		const alternatives: Alternative[] = [
			{ id: "a1", name: "A1" },
			{ id: "a2", name: "A2" },
		]
		const matrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 1 },
			{ alternativeId: "a1", criteriaId: "c2", value: 2 },
			{ alternativeId: "a2", criteriaId: "c1", value: 3 },
			{ alternativeId: "a2", criteriaId: "c2", value: 4 },
		]

		it("should build correct 2d matrix", () => {
			const result = buildMatrix2d(criteria, alternatives, matrix)
			expect(result).toEqual([
				[1, 2],
				[3, 4],
			])
		})

		it("should fill missing values with 0", () => {
			const partial: MatrixValue[] = [
				{ alternativeId: "a1", criteriaId: "c1", value: 1 },
			]
			const result = buildMatrix2d(criteria, alternatives, partial)
			expect(result).toEqual([
				[1, 0],
				[0, 0],
			])
		})
	})

	describe("normalizeWeights", () => {
		it("should normalize positive weights to sum 1", () => {
			const result = normalizeWeights([1, 1, 2], 3)
			expect(result[0]).toBeCloseTo(0.25)
			expect(result[1]).toBeCloseTo(0.25)
			expect(result[2]).toBeCloseTo(0.5)
		})

		it("should return equal weights when total is 0", () => {
			const result = normalizeWeights([0, 0, 0], 3)
			expect(result).toEqual([1 / 3, 1 / 3, 1 / 3])
		})

		it("should return equal weights when fallbackCount is 0", () => {
			expect(normalizeWeights([1, 2], 0)).toEqual([])
		})

		it("should ignore non-finite weights", () => {
			const result = normalizeWeights([1, NaN, 1], 3)
			expect(result[0]).toBeCloseTo(0.5)
			expect(result[1]).toBeCloseTo(0)
			expect(result[2]).toBeCloseTo(0.5)
		})
	})

	describe("buildEqualWeights", () => {
		it("should build equal weights for n criteria", () => {
			expect(buildEqualWeights(3)).toEqual([1 / 3, 1 / 3, 1 / 3])
		})

		it("should return empty array for 0", () => {
			expect(buildEqualWeights(0)).toEqual([])
		})
	})

	describe("buildStepRows", () => {
		const alternatives: Alternative[] = [
			{ id: "a1", name: "A1" },
			{ id: "a2", name: "A2" },
		]
		const values = [
			[1, 2],
			[3, 4],
		]

		it("should build step rows with labels", () => {
			const result = buildStepRows(alternatives, values)
			expect(result).toEqual([
				{ label: "A1", values: [1, 2] },
				{ label: "A2", values: [3, 4] },
			])
		})
	})

	describe("createZeroMatrix", () => {
		it("should create zero-filled matrix", () => {
			const result = createZeroMatrix(2, 3)
			expect(result).toEqual([
				[0, 0, 0],
				[0, 0, 0],
			])
		})
	})
})
