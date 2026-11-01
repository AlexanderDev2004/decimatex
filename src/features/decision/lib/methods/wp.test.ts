import { describe, it, expect } from "vitest"
import { runWp, createWpStepDetails } from "./wp"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("WP", () => {
	const criteria: Criteria[] = [
		{ id: "c1", name: "Kualitas", type: "benefit", weight: 0.5 },
		{ id: "c2", name: "Harga", type: "cost", weight: 0.5 },
	]
	const alternatives: Alternative[] = [
		{ id: "a1", name: "A" },
		{ id: "a2", name: "B" },
	]
	const matrix: MatrixValue[] = [
		{ alternativeId: "a1", criteriaId: "c1", value: 8 },
		{ alternativeId: "a1", criteriaId: "c2", value: 2 },
		{ alternativeId: "a2", criteriaId: "c1", value: 4 },
		{ alternativeId: "a2", criteriaId: "c2", value: 4 },
	]

	it("should compute S = prod(x ^ +-w)", () => {
		const results = runWp(criteria, alternatives, matrix, [0.5, 0.5])

		// S1 = 8^0.5 * 2^-0.5 = sqrt(8/2) = 2
		// S2 = 4^0.5 * 4^-0.5 = 1
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(2, 10)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].score).toBeCloseTo(1, 10)
	})

	it("should ignore input weight scale (renormalized to sum 1)", () => {
		const resultsA = runWp(criteria, alternatives, matrix, [0.5, 0.5])
		const resultsB = runWp(criteria, alternatives, matrix, [5, 5])
		expect(resultsA.map((r) => r.score)).toEqual(resultsB.map((r) => r.score))
	})

	it("should produce complete step details", () => {
		const details = createWpStepDetails(criteria, alternatives, matrix, [0.5, 0.5])
		const exponents = details.step4Tables[0].rows[0].values
		expect(exponents[0]).toBeCloseTo(0.5, 10)
		expect(exponents[1]).toBeCloseTo(-0.5, 10)
		expect(details.step6Table.rows[0].values[0]).toBeCloseTo(2, 10)
	})
})
