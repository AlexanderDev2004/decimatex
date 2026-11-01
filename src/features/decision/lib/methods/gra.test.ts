import { describe, it, expect } from "vitest"
import { runGra, createGraStepDetails } from "./gra"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("GRA", () => {
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

	it("should compute grey relational grade with zeta = 0.5", () => {
		const results = runGra(criteria, alternatives, matrix, [0.5, 0.5])

		// Normalisasi min-max: a1 = [1, 1], a2 = [0, 0]
		// Delta: a1 = [0, 0], a2 = [1, 1]; Dmin = 0, Dmax = 1
		// xi a1 = (0 + 0.5) / (0 + 0.5) = 1 -> GC1 = 1
		// xi a2 = (0 + 0.5) / (1 + 0.5) = 0.3333 -> GC2 = 0.3333
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1, 6)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].score).toBeCloseTo(1 / 3, 6)
	})

	it("should give equal scores when a column is identical (range zero)", () => {
		// c1 identik (8, 8): range 0 -> dinormalisasi jadi 1 untuk semua.
		const identical: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 8 },
			{ alternativeId: "a1", criteriaId: "c2", value: 2 },
			{ alternativeId: "a2", criteriaId: "c1", value: 8 },
			{ alternativeId: "a2", criteriaId: "c2", value: 4 },
		]
		const results = runGra(criteria, alternatives, identical, [0.5, 0.5])

		// c2: a1 = 1, a2 = 0 -> GC1 = 0.5*1 + 0.5*1 = 1; GC2 = 0.5*1 + 0.5*(1/3) = 0.6667
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1, 6)
		expect(results[1].score).toBeCloseTo(2 / 3, 6)
	})

	it("should produce complete step details", () => {
		const details = createGraStepDetails(criteria, alternatives, matrix, [0.5, 0.5])
		// Tabel langkah 4: normalisasi, delta, koefisien xi
		expect(details.step4Tables).toHaveLength(3)
		const xiTable = details.step4Tables[2]
		expect(xiTable.rows[0].values).toEqual([1, 1])
		expect(details.step6Table.headers).toEqual(["GC_i"])
	})
})
