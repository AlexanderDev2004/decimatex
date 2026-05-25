import { Effect } from "effect"
import { eq, and } from "drizzle-orm"
import { db } from "../db/client"
import { decisionMatrixValues } from "../db/schema"
import type { NewDecisionMatrixValue } from "../db/schema"

export const saveMatrixValue = Effect.fn("saveMatrixValue")(
	(data: NewDecisionMatrixValue) =>
		Effect.gen(function* () {
			const [item] = yield* Effect.promise(() =>
				db
					.insert(decisionMatrixValues)
					.values(data)
					.onConflictDoUpdate({
						target: [
							decisionMatrixValues.decisionId,
							decisionMatrixValues.alternativeId,
							decisionMatrixValues.criteriaId,
						],
						set: { value: data.value },
					})
					.returning(),
			)
			return item
		}),
)

export const getMatrixByDecision = Effect.fn("getMatrixByDecision")(
	(decisionId: string) =>
		Effect.gen(function* () {
			return yield* Effect.promise(() =>
				db.query.decisionMatrixValues.findMany({
					where: eq(decisionMatrixValues.decisionId, decisionId),
				}),
			)
		}),
)

export const deleteMatrixValue = Effect.fn("deleteMatrixValue")(
	(decisionId: string, alternativeId: string, criteriaId: string) =>
		Effect.gen(function* () {
			yield* Effect.promise(() =>
				db
					.delete(decisionMatrixValues)
					.where(
						and(
							eq(decisionMatrixValues.decisionId, decisionId),
							eq(decisionMatrixValues.alternativeId, alternativeId),
							eq(decisionMatrixValues.criteriaId, criteriaId),
						),
					),
			)
			return { decisionId, alternativeId, criteriaId }
		}),
)
