import { Data, Effect } from "effect"
import { eq } from "drizzle-orm"
import { db } from "../db/client"
import { decisionProblems } from "../db/schema"
import type { NewDecisionProblem } from "../db/schema"

export class DecisionNotFoundError extends Data.TaggedError("DecisionNotFoundError")<{
	readonly decisionId: string
}> {}

export const createProblem = Effect.fn("createProblem")(
	(data: NewDecisionProblem) =>
		Effect.gen(function* () {
			const [problem] = yield* Effect.promise(() =>
				db.insert(decisionProblems).values(data).returning(),
			)
			return problem
		}),
)

export const getProblems = Effect.fn("getProblems")(() =>
	Effect.gen(function* () {
		return yield* Effect.promise(() =>
			db.query.decisionProblems.findMany({
				orderBy: (problems, { desc }) => [desc(problems.createdAt)],
			}),
		)
	}),
)

export const getProblemById = Effect.fn("getProblemById")((id: string) =>
	Effect.gen(function* () {
		const problem = yield* Effect.promise(() =>
			db.query.decisionProblems.findFirst({
				where: eq(decisionProblems.id, id),
			}),
		)
		if (!problem) {
			return yield* Effect.fail(
				new DecisionNotFoundError({ decisionId: id }),
			)
		}
		return problem
	}),
)

export const updateProblem = Effect.fn("updateProblem")(
	(id: string, data: Partial<NewDecisionProblem>) =>
		Effect.gen(function* () {
			const [problem] = yield* Effect.promise(() =>
				db
					.update(decisionProblems)
					.set(data)
					.where(eq(decisionProblems.id, id))
					.returning(),
			)
			if (!problem) {
				return yield* Effect.fail(
					new DecisionNotFoundError({ decisionId: id }),
				)
			}
			return problem
		}),
)

export const deleteProblem = Effect.fn("deleteProblem")((id: string) =>
	Effect.gen(function* () {
		yield* Effect.promise(() =>
			db.delete(decisionProblems).where(eq(decisionProblems.id, id)),
		)
		return { id }
	}),
)
