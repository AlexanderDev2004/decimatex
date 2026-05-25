import { Hono } from "hono"
import { Effect } from "effect"
import {
	saveMatrixValue,
	getMatrixByDecision,
	deleteMatrixValue,
} from "../services/matrix-service"

const matrix = new Hono()

const run = <A>(effect: Effect.Effect<A, unknown>) =>
	Effect.runPromise(effect)

matrix.get("/", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const items = await run(getMatrixByDecision(decisionId))
		return c.json(items)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

matrix.post("/", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const body = await c.req.json()
		const item = await run(saveMatrixValue({ ...body, decisionId }))
		return c.json(item, 201)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

matrix.delete("/:alternativeId/:criteriaId", async (c) => {
	const decisionId = c.req.param("id")
	const alternativeId = c.req.param("alternativeId")
	const criteriaId = c.req.param("criteriaId")
	if (!decisionId || !alternativeId || !criteriaId)
		return c.json({ error: "Invalid ID" }, 400)
	try {
		await run(deleteMatrixValue(decisionId, alternativeId, criteriaId))
		return c.json({ success: true })
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

export default matrix
