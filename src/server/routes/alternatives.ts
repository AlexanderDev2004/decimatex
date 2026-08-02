import { Hono } from "hono"
import { Effect } from "effect"
import {
	createAlternative,
	getAlternativesByDecision,
	updateAlternative,
	deleteAlternative,
} from "../services/alternative-service"
import { unwrapEffectError } from "./effect-error"

const alternatives = new Hono()

const run = <A>(effect: Effect.Effect<A, unknown>) =>
	Effect.runPromise(effect)

alternatives.get("/", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const items = await run(getAlternativesByDecision(decisionId))
		return c.json(items)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

alternatives.post("/", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const body = await c.req.json()
		const item = await run(createAlternative({ ...body, decisionId }))
		return c.json(item, 201)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

alternatives.patch("/:alternativeId", async (c) => {
	const id = c.req.param("alternativeId")
	if (!id) return c.json({ error: "Invalid ID" }, 400)
	try {
		const body = await c.req.json()
		const item = await run(updateAlternative(id, body))
		return c.json(item)
	} catch (error) {
		const err = unwrapEffectError(error) as { _tag?: string } | undefined
		if (err?._tag === "AlternativeNotFoundError") {
			return c.json({ error: "Alternative not found" }, 404)
		}
		return c.json({ error: "Internal server error" }, 500)
	}
})

alternatives.delete("/:alternativeId", async (c) => {
	const decisionId = c.req.param("id")
	const alternativeId = c.req.param("alternativeId")
	if (!decisionId || !alternativeId)
		return c.json({ error: "Invalid ID" }, 400)
	try {
		await run(deleteAlternative(decisionId, alternativeId))
		return c.json({ success: true })
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

export default alternatives
