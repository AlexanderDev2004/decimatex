import { Hono } from "hono"
import { Effect } from "effect"
import {
	createCriteria,
	getCriteriaByDecision,
	updateCriteriaWeight,
	deleteCriteria,
	normalizeCriteriaWeights,
	CriteriaNotFoundError,
} from "../services/criteria-service"

const criteria = new Hono()

const run = <A>(effect: Effect.Effect<A, unknown>) =>
	Effect.runPromise(effect)

criteria.get("/", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const items = await run(getCriteriaByDecision(decisionId))
		return c.json(items)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

criteria.post("/", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const body = await c.req.json()
		const item = await run(createCriteria({ ...body, decisionId }))
		return c.json(item, 201)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

criteria.patch("/:criteriaId", async (c) => {
	const id = c.req.param("criteriaId")
	if (!id) return c.json({ error: "Invalid ID" }, 400)
	try {
		const body = await c.req.json()
		const item = await run(updateCriteriaWeight(id, body.weight))
		return c.json(item)
	} catch (error) {
		if (error instanceof CriteriaNotFoundError) {
			return c.json({ error: "Criteria not found" }, 404)
		}
		return c.json({ error: "Internal server error" }, 500)
	}
})

criteria.delete("/:criteriaId", async (c) => {
	const decisionId = c.req.param("id")
	const criteriaId = c.req.param("criteriaId")
	if (!decisionId || !criteriaId) return c.json({ error: "Invalid ID" }, 400)
	try {
		await run(deleteCriteria(decisionId, criteriaId))
		return c.json({ success: true })
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

criteria.post("/normalize", async (c) => {
	const decisionId = c.req.param("id")
	if (!decisionId) return c.json({ error: "Invalid ID" }, 400)
	try {
		const items = await run(normalizeCriteriaWeights(decisionId))
		return c.json(items)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

export default criteria
