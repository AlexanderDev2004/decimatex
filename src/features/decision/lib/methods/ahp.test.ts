import { describe, it, expect } from "vitest"
import { runAhp, createAhpStepDetails } from "./ahp"
import type { Criteria, Alternative, MatrixValue } from "./shared"

describe("AHP", () => {
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
		const results = runAhp(criteria, alternatives, matrix, weights)

		expect(results).toHaveLength(3)
		expect(results[0].rank).toBe(1)
		expect(results[2].rank).toBe(3)

		// Scores should sum to approximately 1
		const totalScore = results.reduce((sum, r) => sum + r.score, 0)
		expect(totalScore).toBeCloseTo(1, 2)
	})

	it("should give higher rank to alternative with better balance", () => {
		const weights = [0.5, 0.5]
		const results = runAhp(criteria, alternatives, matrix, weights)

		// Supplier B should be rank 1 (lowest cost, decent quality)
		expect(results[0].alternativeId).toBe("a2")
		expect(results[0].rank).toBe(1)
	})

	it("should handle equal weights", () => {
		const weights = [0.5, 0.5]
		const results = runAhp(criteria, alternatives, matrix, weights)

		expect(results).toHaveLength(3)
		results.forEach((r) => {
			expect(r.score).toBeGreaterThanOrEqual(0)
			expect(r.score).toBeLessThanOrEqual(1)
		})
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

		const results = runAhp(singleCriteria, alternatives, singleMatrix, [1])

		expect(results).toHaveLength(3)
		// For cost, lower value should rank higher
		expect(results[0].alternativeId).toBe("a2")
		expect(results[0].rank).toBe(1)
	})

	it("should handle single alternative", () => {
		const singleAlternative: Alternative[] = [
			{ id: "a1", name: "Supplier A" },
		]
		const singleMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 250 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
		]

		const results = runAhp(criteria, singleAlternative, singleMatrix, [0.4, 0.6])

		expect(results).toHaveLength(1)
		expect(results[0].rank).toBe(1)
		expect(results[0].score).toBeCloseTo(1, 2)
	})

	it("should create step details with consistency check", () => {
		const weights = [0.4, 0.6]
		const details = createAhpStepDetails(criteria, alternatives, matrix, weights)

		expect(details.step4Title).toContain("Normalisasi")
		expect(details.step4Formula.length).toBeGreaterThan(0)
		expect(details.step4Tables.length).toBe(1)
		expect(details.step4Notes).toBeDefined()
		expect(details.step4Notes!.some((n) => n.includes("Konsisten"))).toBe(true)

		expect(details.step6Title).toContain("Skor")
		expect(details.step6Formula.length).toBeGreaterThan(0)
		expect(details.step6Table.rows).toHaveLength(3)
	})

	it("should handle zero values in matrix", () => {
		const matrixWithZero: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 0 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c1", value: 200 },
			{ alternativeId: "a2", criteriaId: "c2", value: 7 },
			{ alternativeId: "a3", criteriaId: "c1", value: 300 },
			{ alternativeId: "a3", criteriaId: "c2", value: 9 },
		]

		const results = runAhp(criteria, alternatives, matrixWithZero, [0.4, 0.6])

		expect(results).toHaveLength(3)
		// Should not crash, scores should be valid
		results.forEach((r) => {
			expect(Number.isFinite(r.score)).toBe(true)
		})
	})

	it("should handle identical alternatives", () => {
		const identicalMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 200 },
			{ alternativeId: "a1", criteriaId: "c2", value: 8 },
			{ alternativeId: "a2", criteriaId: "c1", value: 200 },
			{ alternativeId: "a2", criteriaId: "c2", value: 8 },
			{ alternativeId: "a3", criteriaId: "c1", value: 200 },
			{ alternativeId: "a3", criteriaId: "c2", value: 8 },
		]

		const results = runAhp(criteria, alternatives, identicalMatrix, [0.4, 0.6])

		expect(results).toHaveLength(3)
		// All should have same score
		expect(results[0].score).toBeCloseTo(results[1].score, 4)
		expect(results[1].score).toBeCloseTo(results[2].score, 4)
	})

	it("should normalize weights", () => {
		const unnormalizedWeights = [2, 3] // Should become [0.4, 0.6]
		const results = runAhp(criteria, alternatives, matrix, unnormalizedWeights)

		expect(results).toHaveLength(3)
		const totalScore = results.reduce((sum, r) => sum + r.score, 0)
		expect(totalScore).toBeCloseTo(1, 2)
	})

	it("should handle many alternatives", () => {
		const manyAlternatives: Alternative[] = Array.from({ length: 10 }, (_, i) => ({
			id: `a${i + 1}`,
			name: `Alt ${i + 1}`,
		}))

		const manyMatrix: MatrixValue[] = manyAlternatives.flatMap((alt, i) => [
			{ alternativeId: alt.id, criteriaId: "c1", value: 100 + i * 10 },
			{ alternativeId: alt.id, criteriaId: "c2", value: 5 + i },
		])

		const results = runAhp(criteria, manyAlternatives, manyMatrix, [0.4, 0.6])

		expect(results).toHaveLength(10)
		// All ranks should be unique
		const ranks = results.map((r) => r.rank)
		expect(new Set(ranks).size).toBe(10)
	})

	it("should handle benefit and cost criteria correctly", () => {
		const mixedCriteria: Criteria[] = [
			{ id: "c1", name: "Harga", type: "cost", weight: 0.5 },
			{ id: "c2", name: "Kualitas", type: "benefit", weight: 0.5 },
		]

		const mixedMatrix: MatrixValue[] = [
			{ alternativeId: "a1", criteriaId: "c1", value: 100 }, // Low cost = good
			{ alternativeId: "a1", criteriaId: "c2", value: 9 },  // High quality = good
			{ alternativeId: "a2", criteriaId: "c1", value: 300 }, // High cost = bad
			{ alternativeId: "a2", criteriaId: "c2", value: 5 },  // Low quality = bad
		]

		const twoAlts: Alternative[] = [
			{ id: "a1", name: "Good" },
			{ id: "a2", name: "Bad" },
		]

		const results = runAhp(mixedCriteria, twoAlts, mixedMatrix, [0.5, 0.5])

		expect(results).toHaveLength(2)
		expect(results[0].alternativeId).toBe("a1")
		expect(results[0].rank).toBe(1)
	})
})
