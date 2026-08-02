import { Hono } from "hono"
import { Effect } from "effect"
import {
	runAnalysis,
	getAnalysisHistory,
} from "../services/analysis-service"
import { unwrapEffectError } from "./effect-error"

const analysis = new Hono()

const run = <A>(effect: Effect.Effect<A, unknown>) =>
	Effect.runPromise(effect)

analysis.post("/run", async (c) => {
	try {
		const body = await c.req.json()
		const { decisionId, methodCode } = body
		if (!decisionId || !methodCode) {
			return c.json({ error: "Missing decisionId or methodCode" }, 400)
		}
		const result = await run(runAnalysis(decisionId, methodCode))
		return c.json(result)
	} catch (error) {
		const err = unwrapEffectError(error) as { _tag?: string; message?: string } | undefined
		if (err?._tag === "AnalysisRunError") {
			return c.json({ error: err.message ?? "Analysis failed" }, 400)
		}
		return c.json({ error: "Internal server error" }, 500)
	}
})

analysis.get("/history/:decisionId", async (c) => {
	const decisionId = c.req.param("decisionId")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const items = await run(getAnalysisHistory(decisionId))
		return c.json(items)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

export default analysis
