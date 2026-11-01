import { describe, it, expect } from "vitest"
import { runWaspas, createWaspasStepDetails } from "./waspas"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("WASPAS", () => {
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

	it("should compute Q = 0.5*Q1 + 0.5*Q2", () => {
		const results = runWaspas(criteria, alternatives, matrix, [0.5, 0.5])

		// Normalisasi SAW: a1 = [1, 1]; a2 = [0.5, 0.5]
		// a1: Q1 = 1, Q2 = 1^0.5 * 1^0.5 = 1, Q = 1
		// a2: Q1 = 0.5, Q2 = 0.5^0.5 * 0.5^0.5 = 0.5, Q = 0.5
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1, 10)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].score).toBeCloseTo(0.5, 10)
	})

	it("should differ from WSM when normalized values are asymmetric", () => {
		// a1: [1, 0.25] -> Q1 = 0.625, Q2 = 1^0.5 * 0.25^0.5 = 0.5, Q = 0.5625
		// a2: [0.5, 1]  -> Q1 = 0.75,  Q2 = 0.5^0.5 * 1^0.5 ≈ 0.7071, Q ≈ 0.72855
		const asym: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 8 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c1", value: 4 },
			{ alternativeId: "a2", criteriaId: "c2", value: 2 },
		]
		const results = runWaspas(criteria, alternatives, asym, [0.5, 0.5])

		expect(results[0].alternativeId).toBe("a2")
		expect(results[0].score).toBeCloseTo(0.728553, 5)
		expect(results[1].score).toBeCloseTo(0.5625, 5)
	})

	it("should produce complete step details", () => {
		const details = createWaspasStepDetails(criteria, alternatives, matrix, [0.5, 0.5])
		expect(details.step6Table.headers).toEqual(["Q1 (WSM)", "Q2 (WPM)", "Q_i"])
		expect(details.step6Table.rows[0].values[0]).toBeCloseTo(1, 10)
		expect(details.step6Table.rows[0].values[2]).toBeCloseTo(1, 10)
	})
})
