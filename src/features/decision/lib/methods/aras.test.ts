import { describe, it, expect } from "vitest"
import { runAras, createArasStepDetails } from "./aras"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("ARAS", () => {
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

	it("should compute utility U_i = S_i / S_0", () => {
		const results = runAras(criteria, alternatives, matrix, [0.5, 0.5])

		// Normalisasi: benefit sum=12 -> r = [0.6667, 0.3333]
		// cost reciprocal sum=0.5+0.25=0.75 -> r = [0.6667, 0.3333]
		// S1 = S2 = 0.5*0.6667*2 -> S1 = 0.6667, S2 = 0.3333
		// S0 = 0.6667; U1 = 1, U2 = 0.5
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1, 6)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].score).toBeCloseTo(0.5, 6)
	})

	it("should produce complete step details with optimal row", () => {
		const details = createArasStepDetails(criteria, alternatives, matrix, [0.5, 0.5])
		const optimalRow = details.step4Tables[1].rows[0].values
		expect(optimalRow[0]).toBeCloseTo(0.666667, 5)
		expect(optimalRow[1]).toBeCloseTo(0.666667, 5)
		expect(details.step6Table.headers).toEqual(["S_i", "U_i"])
		expect(details.step6Table.rows[0].values[1]).toBeCloseTo(1, 6)
	})
})
