import { Data, Effect } from "effect"
import { eq, and } from "drizzle-orm"
import { db } from "../db/client"
import { alternatives } from "../db/schema"
import type { NewAlternative } from "../db/schema"

export class AlternativeNotFoundError extends Data.TaggedError(
	"AlternativeNotFoundError",
)<{ readonly alternativeId: string }> {}

export const createAlternative = Effect.fn("createAlternative")(
	(data: NewAlternative) =>
		Effect.gen(function* () {
			const [item] = yield* Effect.promise(() =>
				db.insert(alternatives).values(data).returning(),
			)
			return item
		}),
)

export const getAlternativesByDecision = Effect.fn(
	"getAlternativesByDecision",
)((decisionId: string) =>
	Effect.gen(function* () {
		return yield* Effect.promise(() =>
			db.query.alternatives.findMany({
				where: eq(alternatives.decisionId, decisionId),
				orderBy: (a, { asc }) => [asc(a.position)],
			}),
		)
	}),
)

export const updateAlternative = Effect.fn("updateAlternative")(
	(id: string, data: Partial<NewAlternative>) =>
		Effect.gen(function* () {
			const [item] = yield* Effect.promise(() =>
				db
					.update(alternatives)
					.set(data)
					.where(eq(alternatives.id, id))
					.returning(),
			)
			if (!item) {
				return yield* Effect.fail(
					new AlternativeNotFoundError({ alternativeId: id }),
				)
			}
			return item
		}),
)

export const deleteAlternative = Effect.fn("deleteAlternative")(
	(decisionId: string, id: string) =>
		Effect.gen(function* () {
			yield* Effect.promise(() =>
				db
					.delete(alternatives)
					.where(
						and(
							eq(alternatives.decisionId, decisionId),
							eq(alternatives.id, id),
						),
					),
			)
			return { id }
		}),
)
