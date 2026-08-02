import { Data, Effect } from "effect"
import { eq, sql } from "drizzle-orm"
import { db } from "../db/client"
import {
	analysisRuns,
	analysisResults,
	alternatives,
	criteria,
	decisionMatrixValues,
	methods,
} from "../db/schema"
import { runMethod } from "../../features/decision/lib/methods"

export class AnalysisRunError extends Data.TaggedError("AnalysisRunError")<{
	readonly message: string
}> {}

export const runAnalysis = Effect.fn("runAnalysis")(
	(decisionId: string, methodCode: string) =>
		Effect.gen(function* () {
			// Resolve kode metode case-insensitive (frontend mengirim lowercase,
			// sedangkan methods.code tersimpan uppercase, mis. "ahp" → "AHP").
			const methodRow = yield* Effect.promise(() =>
				db.query.methods.findFirst({
					where: sql`lower(${methods.code}) = ${methodCode.toLowerCase()}`,
				}),
			)
			if (!methodRow) {
				return yield* Effect.fail(
					new AnalysisRunError({ message: `Unknown method: ${methodCode}` }),
				)
			}
			const canonicalMethodCode = methodRow.code

			const criteriaItems = yield* Effect.promise(() =>
				db.query.criteria.findMany({
					where: eq(criteria.decisionId, decisionId),
				}),
			)
			const alternativeItems = yield* Effect.promise(() =>
				db.query.alternatives.findMany({
					where: eq(alternatives.decisionId, decisionId),
				}),
			)
			const matrixItems = yield* Effect.promise(() =>
				db.query.decisionMatrixValues.findMany({
					where: eq(decisionMatrixValues.decisionId, decisionId),
				}),
			)

			if (criteriaItems.length < 2 || alternativeItems.length < 2) {
				return yield* Effect.fail(
					new AnalysisRunError({
						message:
							"Decision must have at least 2 criteria and 2 alternatives",
					}),
				)
			}

			const mappedCriteria = criteriaItems.map((c) => ({
				id: c.id,
				name: c.name,
				type: c.type as "benefit" | "cost",
				weight: Number.parseFloat(c.weight),
			}))

			const mappedAlternatives = alternativeItems.map((a) => ({
				id: a.id,
				name: a.name,
			}))

			const mappedMatrix = matrixItems.map((m) => ({
				alternativeId: m.alternativeId,
				criteriaId: m.criteriaId,
				value: Number.parseFloat(m.value),
			}))

			const weights = mappedCriteria.map((c) => c.weight)
			const ranking = runMethod(
				methodCode.toLowerCase(),
				mappedCriteria,
				mappedAlternatives,
				mappedMatrix,
				weights,
			)

			const matrixSnapshot = {
				criteria: mappedCriteria,
				alternatives: mappedAlternatives,
				matrix: mappedMatrix,
			}

			const [run] = yield* Effect.promise(() =>
				db
					.insert(analysisRuns)
					.values({
						decisionId,
						methodCode: canonicalMethodCode,
						parameters: {},
						matrixSnapshot,
						status: "completed",
					})
					.returning(),
			)

			for (const result of ranking) {
				yield* Effect.promise(() =>
					db.insert(analysisResults).values({
						runId: run.id,
						decisionId,
						alternativeId: result.alternativeId,
						score: String(result.score),
						rank: result.rank,
						details: {},
					}),
				)
			}

			return { run, ranking }
		}),
)

export const getAnalysisHistory = Effect.fn("getAnalysisHistory")(
	(decisionId: string) =>
		Effect.gen(function* () {
			return yield* Effect.promise(() =>
				db.query.analysisRuns.findMany({
					where: eq(analysisRuns.decisionId, decisionId),
					orderBy: (runs, { desc }) => [desc(runs.createdAt)],
					with: {
						results: {
							with: {
								alternative: true,
							},
						},
						method: true,
					},
				}),
			)
		}),
)
