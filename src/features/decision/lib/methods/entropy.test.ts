import { describe, it, expect } from "vitest"
import { runEntropyWeights } from "./entropy"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("Entropy weights", () => {
	const alternatives: Alternative[] = [
		{ id: "a1", name: "A" },
		{ id: "a2", name: "B" },
		{ id: "a3", name: "C" },
	]

	it("should give larger weight to the criterion with more variation", () => {
		const criteria: Criteria[] = [
			{ id: "c1", name: "C1", type: "benefit", weight: 0.5 },
			{ id: "c2", name: "C2", type: "benefit", weight: 0.5 },
		]
		const matrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 8 },
			{ alternativeId: "a2", criteriaId: "c1", value: 4 },
			{ alternativeId: "a3", criteriaId: "c1", value: 2 },
			{ alternativeId: "a1", criteriaId: "c2", value: 6 },
			{ alternativeId: "a2", criteriaId: "c2", value: 5 },
			{ alternativeId: "a3", criteriaId: "c2", value: 1 },
		]

		const result = runEntropyWeights(criteria, alternatives, matrix)

		// c1: p = [4/7, 2/7, 1/7], e1 = 0.869890, d1 = 0.130110
		// c2: p = [0.5, 5/12, 1/12], e2 = 0.835986, d2 = 0.164014
		// w = [0.4424, 0.5576]
		expect(result.entropy[0]).toBeCloseTo(0.86989, 4)
		expect(result.entropy[1]).toBeCloseTo(0.835986, 4)
		expect(result.weights[0]).toBeCloseTo(0.44236, 4)
		expect(result.weights[1]).toBeCloseTo(0.55764, 4)
		expect(result.weights[0] + result.weights[1]).toBeCloseTo(1, 10)
	})

	it("should give zero weight to an identical column", () => {
		const criteria: Criteria[] = [
			{ id: "c1", name: "Sama", type: "benefit", weight: 0.5 },
			{ id: "c2", name: "Variasi", type: "benefit", weight: 0.5 },
		]
		const matrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 5 },
			{ alternativeId: "a2", criteriaId: "c1", value: 5 },
			{ alternativeId: "a3", criteriaId: "c1", value: 5 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c2", value: 4 },
			{ alternativeId: "a3", criteriaId: "c2", value: 2 },
		]

		const result = runEntropyWeights(criteria, alternatives, matrix)

		// Kolom identik: p seragam, e = 1, d = 0 -> bobot 0.
		expect(result.entropy[0]).toBeCloseTo(1, 10)
		expect(result.divergence[0]).toBeCloseTo(0, 10)
		expect(result.weights[0]).toBeCloseTo(0, 10)
		expect(result.weights[1]).toBeCloseTo(1, 10)
	})

	it("should fall back to equal weights when all columns are identical", () => {
		const criteria: Criteria[] = [
			{ id: "c1", name: "C1", type: "benefit", weight: 0.5 },
			{ id: "c2", name: "C2", type: "benefit", weight: 0.5 },
		]
		const matrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 5 },
			{ alternativeId: "a2", criteriaId: "c1", value: 5 },
			{ alternativeId: "a3", criteriaId: "c1", value: 5 },
			{ alternativeId: "a1", criteriaId: "c2", value: 7 },
			{ alternativeId: "a2", criteriaId: "c2", value: 7 },
			{ alternativeId: "a3", criteriaId: "c2", value: 7 },
		]

		const result = runEntropyWeights(criteria, alternatives, matrix)
		expect(result.weights[0]).toBeCloseTo(0.5, 10)
		expect(result.weights[1]).toBeCloseTo(0.5, 10)
	})

	it("should handle cost criteria via reciprocal", () => {
		const criteria: Criteria[] = [
			{ id: "c1", name: "Harga", type: "cost", weight: 0.5 },
			{ id: "c2", name: "Kualitas", type: "benefit", weight: 0.5 },
		]
		const matrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 2 },
			{ alternativeId: "a2", criteriaId: "c1", value: 4 },
			{ alternativeId: "a3", criteriaId: "c1", value: 8 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c2", value: 4 },
			{ alternativeId: "a3", criteriaId: "c2", value: 2 },
		]

		const result = runEntropyWeights(criteria, alternatives, matrix)

		// Simetri sempurna antara cost (2,4,8) dan benefit (8,4,2)
		// -> p identik, entropi identik, bobot sama rata.
		expect(result.entropy[0]).toBeCloseTo(result.entropy[1], 10)
		expect(result.weights[0]).toBeCloseTo(0.5, 10)
		expect(result.weights[1]).toBeCloseTo(0.5, 10)
	})
})
