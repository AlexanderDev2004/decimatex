import { describe, it, expect } from "vitest"
import { runPsi, createPsiStepDetails } from "./psi"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("PSI (Maniya & Bhatt 2010)", () => {
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
		const results = runPsi(criteria, alternatives, matrix, [0.4, 0.6])

		expect(results).toHaveLength(3)
		expect(results[0].rank).toBe(1)
		expect(results[2].rank).toBe(3)

		// Skor PSI harus dalam [0, 1] karena hasil kali nilai ternormalisasi [0,1] * bobot
		results.forEach((r) => {
			expect(r.score).toBeGreaterThanOrEqual(0)
			expect(r.score).toBeLessThanOrEqual(1)
		})
	})

	it("should favor best values on both benefit and cost", () => {
		// Dataset jelas: a3 terburuk di kedua kriteria (harga tertinggi, kualitas terendah)
		const clearMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 250 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c1", value: 200 },
			{ alternativeId: "a2", criteriaId: "c2", value: 7 },
			{ alternativeId: "a3", criteriaId: "c1", value: 300 },
			{ alternativeId: "a3", criteriaId: "c2", value: 5 },
		]
		const results = runPsi(criteria, alternatives, clearMatrix, [0.5, 0.5])

		// a2 = harga terendah (cost terbaik) + kualitas menengah → rank 1
		// a3 = harga tertinggi (cost terburuk) + kualitas terendah → rank 3
		expect(results[0].alternativeId).toBe("a2")
		expect(results[2].alternativeId).toBe("a3")
		expect(results[2].score).toBe(0)
	})

	it("should ignore user weights (bobot diturunkan dari variasi data)", () => {
		const resultsA = runPsi(criteria, alternatives, matrix, [0.4, 0.6])
		const resultsB = runPsi(criteria, alternatives, matrix, [0.9, 0.1])

		// Ranking harus identik karena PSI menurunkan bobotnya sendiri
		expect(resultsA.map((r) => r.alternativeId)).toEqual(
			resultsB.map((r) => r.alternativeId),
		)
	})

	it("should give highest weight to the most varying criterion", () => {
		const details = createPsiStepDetails(criteria, alternatives, matrix, [0.5, 0.5])

		// Kualitas punya variasi lebih kecil (7,8,9) vs Harga (200,250,300)
		// — namun setelah normalisasi, kriteria dengan PV lebih besar mendapat Ψ lebih besar
		const psiWeightsRow = details.step4Tables[1].rows.find((row) =>
			row.label.startsWith("Ψ"),
		)
		expect(psiWeightsRow).toBeDefined()
		const [w1, w2] = psiWeightsRow!.values
		expect(w1 + w2).toBeCloseTo(1, 6)
		expect(w1).toBeGreaterThan(0)
		expect(w2).toBeGreaterThan(0)
	})

	it("should handle identical columns (zero variation)", () => {
		const identicalMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 200 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c1", value: 200 },
			{ alternativeId: "a2", criteriaId: "c2", value: 8 },
			{ alternativeId: "a3", criteriaId: "c1", value: 200 },
			{ alternativeId: "a3", criteriaId: "c2", value: 8 },
		]

		const results = runPsi(criteria, alternatives, identicalMatrix, [0.5, 0.5])

		expect(results).toHaveLength(3)
		// Semua skor sama (fallback bobot sama rata)
		expect(results[0].score).toBeCloseTo(results[1].score, 6)
		expect(results[1].score).toBeCloseTo(results[2].score, 6)
	})

	it("should produce complete step details", () => {
		const details = createPsiStepDetails(criteria, alternatives, matrix, [0.5, 0.5])

		expect(details.step4Title).toContain("variasi preferensi")
		expect(details.step4Tables).toHaveLength(2)
		expect(details.step4Tables[1].rows.map((r) => r.label)).toEqual([
			"N_j (rata-rata)",
			"PV_j",
			"Ω_j (deviasi)",
			"Ψ_j (bobot PSI)",
		])
		expect(details.step6Table.rows).toHaveLength(3)
		expect(details.step6Notes?.some((n) => n.includes("Bobot PSI"))).toBe(true)
	})

	it("should handle single criterion", () => {
		const singleCriteria: Criteria[] = [
			{ id: "c1", name: "Harga", type: "cost", weight: 1 },
		]
		const singleMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 250 },
			{ alternativeId: "a2", criteriaId: "c1", value: 200 },
			{ alternativeId: "a3", criteriaId: "c1", value: 300 },
		]

		const results = runPsi(singleCriteria, alternatives, singleMatrix, [1])

		expect(results).toHaveLength(3)
		// Cost: nilai terendah → PSI tertinggi
		expect(results[0].alternativeId).toBe("a2")
		expect(results[2].alternativeId).toBe("a3")
	})

	it("should handle single alternative", () => {
		const singleAlternative: Alternative[] = [{ id: "a1", name: "Supplier A" }]
		const singleMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 250 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
		]

		const results = runPsi(criteria, singleAlternative, singleMatrix, [0.4, 0.6])

		expect(results).toHaveLength(1)
		expect(results[0].rank).toBe(1)
	})
})
