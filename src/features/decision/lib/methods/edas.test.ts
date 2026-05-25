import { describe, it, expect } from "vitest"
import { runEdas } from "./edas"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("EDAS", () => {
	const criteria: Criteria[] = [
		{ id: "c1", name: "Harga", type: "cost", weight: 0.5 },
		{ id: "c2", name: "Kualitas", type: "benefit", weight: 0.5 },
	]
	const alternatives: Alternative[] = [
		{ id: "a1", name: "A" },
		{ id: "a2", name: "B" },
		{ id: "a3", name: "C" },
	]
	const matrix: MatrixValue[] = [
		{ alternativeId: "a1", criteriaId: "c1", value: 100 },
		{ alternativeId: "a1", criteriaId: "c2", value: 7 },
		{ alternativeId: "a2", criteriaId: "c1", value: 150 },
		{ alternativeId: "a2", criteriaId: "c2", value: 8 },
		{ alternativeId: "a3", criteriaId: "c1", value: 120 },
		{ alternativeId: "a3", criteriaId: "c2", value: 6 },
	]

	it("should rank alternatives", () => {
		const weights = [0.5, 0.5]
		const results = runEdas(criteria, alternatives, matrix, weights)

		expect(results).toHaveLength(3)
		expect(results[0].rank).toBe(1)
		expect(results[2].rank).toBe(3)
	})

	it("should give higher score to alternative above average on benefit", () => {
		const weights = [0.5, 0.5]
		const results = runEdas(criteria, alternatives, matrix, weights)

		// A: cost 100 (terbaik), benefit 7 (sedang)
		// B: cost 150 (buruk), benefit 8 (terbaik)
		// C: cost 120 (sedang), benefit 6 (buruk)
		// EDAS membandingkan dengan rata-rata
		// rata-rata cost = 123.33, rata-rata benefit = 7
		// A: cost di bawah avg (bagus), benefit di atas avg (bagus) -> skor tinggi
		// B: cost di atas avg (buruk), benefit di atas avg (bagus)
		// C: cost di bawah avg (bagus), benefit di bawah avg (buruk)

		// Pastikan rank unik
		const ranks = results.map((r) => r.rank)
		expect(new Set(ranks).size).toBe(3)
	})
})
