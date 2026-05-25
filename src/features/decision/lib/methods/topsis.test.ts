import { describe, it, expect } from "vitest"
import { runTopsis } from "./topsis"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("TOPSIS", () => {
	const criteria: Criteria[] = [
		{ id: "c1", name: "Harga", type: "cost", weight: 0.4 },
		{ id: "c2", name: "Kualitas", type: "benefit", weight: 0.6 },
	]
	const alternatives: Alternative[] = [
		{ id: "a1", name: "Supplier A" },
		{ id: "a2", name: "Supplier B" },
		{ id: "a3", name: "Supplier C" },
	]
	const matrix: MatrixValue[] = [
		{ alternativeId: "a1", criteriaId: "c1", value: 250 },
		{ alternativeId: "a1", criteriaId: "c2", value: 8 },
		{ alternativeId: "a2", criteriaId: "c1", value: 200 },
		{ alternativeId: "a2", criteriaId: "c2", value: 7 },
		{ alternativeId: "a3", criteriaId: "c1", value: 300 },
		{ alternativeId: "a3", criteriaId: "c2", value: 9 },
	]

	it("should rank alternatives correctly", () => {
		const weights = [0.4, 0.6]
		const results = runTopsis(criteria, alternatives, matrix, weights)

		expect(results).toHaveLength(3)
		expect(results[0].rank).toBe(1)
		expect(results[2].rank).toBe(3)

		// Skor harus antara 0 dan 1
		results.forEach((r) => {
			expect(r.score).toBeGreaterThanOrEqual(0)
			expect(r.score).toBeLessThanOrEqual(1)
		})
	})

	it("should give higher rank to alternative with better balance", () => {
		const weights = [0.5, 0.5]
		const results = runTopsis(criteria, alternatives, matrix, weights)

		// Supplier B seharusnya rank 1 karena paling seimbang
		// (cost terendah, benefit sedang)
		expect(results[0].alternativeId).toBe("a2")
		expect(results[0].rank).toBe(1)
	})
})
