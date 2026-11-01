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

	it("should penalize below-average alternatives without clamping (paper 2015)", () => {
		// Satu kriteria benefit, nilai 10 / 9 / 5, rata-rata 8.
		// PDA tanpa clamp: 0.25 / 0.125 / -0.375 (negatif diperbolehkan).
		// SP = PDA, maxSP = 0.25 → NSP = 1 / 0.5 / -1.5
		// SN = -PDA, maxSN = 0.375 → NSN = 1.6667 / 1.3333 / 0
		// AS = 1.3333 / 0.9167 / -0.75
		// Versi clamp lama memberi AS = 1 / 0.75 / 0.
		const benefitOnly: Criteria[] = [
			{ id: "c1", name: "Kualitas", type: "benefit", weight: 1 },
		]
		const matrixBenefit: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 10 },
			{ alternativeId: "a2", criteriaId: "c1", value: 9 },
			{ alternativeId: "a3", criteriaId: "c1", value: 5 },
		]
		const results = runEdas(benefitOnly, alternatives, matrixBenefit, [1])

		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(1.3333, 3)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].score).toBeCloseTo(0.9167, 3)
		expect(results[2].alternativeId).toBe("a3")
		expect(results[2].score).toBeCloseTo(-0.75, 3)
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
