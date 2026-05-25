import { Hono } from "hono"
import { Effect } from "effect"
import {
	runAnalysis,
	getAnalysisHistory,
	AnalysisRunError,
} from "../services/analysis-service"

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
		if (error instanceof AnalysisRunError) {
			return c.json({ error: error.message }, 400)
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
