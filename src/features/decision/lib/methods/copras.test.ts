import { describe, it, expect } from "vitest"
import { runCopras } from "./copras"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("COPRAS", () => {
	const criteria: Criteria[] = [
		{ id: "c1", name: "Kualitas", type: "benefit", weight: 0.5 },
		{ id: "c2", name: "Harga", type: "cost", weight: 0.5 },
	]
	const alternatives: Alternative[] = [
		{ id: "a1", name: "Alternatif A" },
		{ id: "a2", name: "Alternatif B" },
	]
	const matrix: MatrixValue[] = [
		{ alternativeId: "a1", criteriaId: "c1", value: 6 },
		{ alternativeId: "a1", criteriaId: "c2", value: 2 },
		{ alternativeId: "a2", criteriaId: "c1", value: 4 },
		{ alternativeId: "a2", criteriaId: "c2", value: 4 },
	]

	it("should use canonical formula Q_i = S+ + S-_min / S-", () => {
		const results = runCopras(criteria, alternatives, matrix, [0.5, 0.5])

		// Normalisasi: a1 = [0.6, 1/3], a2 = [0.4, 2/3]
		// Terboboti (w=0.5): a1 = [0.3, 1/6], a2 = [0.2, 1/3]
		// S+ = [0.3, 0.2], S- = [1/6, 1/3], S-_min = 1/6
		// Q1 = 0.3 + (1/6)/(1/6) = 1.3
		// Q2 = 0.2 + (1/6)/(1/3) = 0.7
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].rank).toBe(1)
		expect(results[0].score).toBeCloseTo(1.3, 10)
		expect(results[1].alternativeId).toBe("a2")
		expect(results[1].rank).toBe(2)
		expect(results[1].score).toBeCloseTo(0.7, 10)
	})

	it("should return S+ as score when there is no cost criterion", () => {
		const benefitOnly: Criteria[] = [
			{ id: "c1", name: "Kualitas", type: "benefit", weight: 1 },
		]
		const matrixBenefit: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 6 },
			{ alternativeId: "a2", criteriaId: "c1", value: 4 },
		]
		const results = runCopras(benefitOnly, alternatives, matrixBenefit, [1])

		// S+ = [6/10 * 1, 4/10 * 1] = [0.6, 0.4]
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].score).toBeCloseTo(0.6, 10)
		expect(results[1].score).toBeCloseTo(0.4, 10)
	})
})
