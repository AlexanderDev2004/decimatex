import { Data, Effect } from "effect"
import { eq, and } from "drizzle-orm"
import { db } from "../db/client"
import { criteria } from "../db/schema"
import type { NewCriteria } from "../db/schema"

export class CriteriaNotFoundError extends Data.TaggedError("CriteriaNotFoundError")<{
	readonly criteriaId: string
}> {}

export const createCriteria = Effect.fn("createCriteria")(
	(data: NewCriteria) =>
		Effect.gen(function* () {
			const [item] = yield* Effect.promise(() =>
				db.insert(criteria).values(data).returning(),
			)
			return item
		}),
)

export const getCriteriaByDecision = Effect.fn("getCriteriaByDecision")(
	(decisionId: string) =>
		Effect.gen(function* () {
			return yield* Effect.promise(() =>
				db.query.criteria.findMany({
					where: eq(criteria.decisionId, decisionId),
					orderBy: (c, { asc }) => [asc(c.position)],
				}),
			)
		}),
)

export const updateCriteriaWeight = Effect.fn("updateCriteriaWeight")(
	(id: string, weight: number) =>
		Effect.gen(function* () {
			const [item] = yield* Effect.promise(() =>
				db
					.update(criteria)
					.set({ weight: String(weight) })
					.where(eq(criteria.id, id))
					.returning(),
			)
			if (!item) {
				return yield* Effect.fail(
					new CriteriaNotFoundError({ criteriaId: id }),
				)
			}
			return item
		}),
)

export const deleteCriteria = Effect.fn("deleteCriteria")(
	(decisionId: string, id: string) =>
		Effect.gen(function* () {
			yield* Effect.promise(() =>
				db
					.delete(criteria)
					.where(
						and(eq(criteria.decisionId, decisionId), eq(criteria.id, id)),
					),
			)
			return { id }
		}),
)

export const normalizeCriteriaWeights = Effect.fn("normalizeCriteriaWeights")(
	(decisionId: string) =>
		Effect.gen(function* () {
			const items = yield* Effect.promise(() =>
				db.query.criteria.findMany({
					where: eq(criteria.decisionId, decisionId),
				}),
			)
			const total = items.reduce(
				(sum, item) => sum + Number.parseFloat(item.weight),
				0,
			)
			if (total <= 0) return items
			for (const item of items) {
				const normalized = Number.parseFloat(item.weight) / total
				yield* Effect.promise(() =>
					db
						.update(criteria)
						.set({ weight: String(normalized) })
						.where(eq(criteria.id, item.id)),
				)
			}
			return items.map((item) => ({
				...item,
				weight: String(
					Number.parseFloat(item.weight) /
						items.reduce(
							(sum, i) => sum + Number.parseFloat(i.weight),
							0,
						),
				),
			}))
		}),
)
