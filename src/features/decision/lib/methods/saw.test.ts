import { describe, it, expect } from "vitest"
import { runSaw, createSawStepDetails } from "./saw"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("SAW", () => {
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

	it("should compute S = sum(w * r) with benefit/max and cost/min-over-x", () => {
		const results = runSaw(criteria, alternatives, matrix, [0.5, 0.5])

		// Normalisasi: a1 = [8/8, 2/2] = [1, 1]; a2 = [4/8, 2/4] = [0.5, 0.5]
		// S1 = 1.0; S2 = 0.5
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1, 10)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].score).toBeCloseTo(0.5, 10)
	})

	it("should treat zero cost as ideal", () => {
		const zeroCost: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 8 },
			{ alternativeId: "a1", criteriaId: "c2", value: 0 },
			{ alternativeId: "a2", criteriaId: "c1", value: 4 },
			{ alternativeId: "a2", criteriaId: "c2", value: 4 },
		]
		const results = runSaw(criteria, alternatives, zeroCost, [0.5, 0.5])

		// cost a1 = 0 dianggap ideal (r = 1): S1 = 0.5*1 + 0.5*1 = 1
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1, 10)
	})

	it("should produce complete step details", () => {
		const details = createSawStepDetails(criteria, alternatives, matrix, [0.5, 0.5])
		expect(details.step4Tables[0].rows).toHaveLength(2)
		expect(details.step6Table.headers).toEqual(["S_i"])
		expect(details.step6Table.rows[0].values[0]).toBeCloseTo(1, 10)
	})
})
