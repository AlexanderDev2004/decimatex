import { Hono } from "hono"
import { Effect } from "effect"
import {
	createProblem,
	getProblems,
	getProblemById,
	updateProblem,
	deleteProblem,
} from "../services/decision-service"
import { unwrapEffectError } from "./effect-error"

const decisions = new Hono()

const run = <A>(effect: Effect.Effect<A, unknown>) =>
	Effect.runPromise(effect)

decisions.get("/", async (c) => {
	try {
		const problems = await run(getProblems())
		return c.json(problems)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

decisions.post("/", async (c) => {
	try {
		const body = await c.req.json()
		const problem = await run(createProblem(body))
		return c.json(problem, 201)
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

decisions.get("/:id", async (c) => {
	const id = c.req.param("id")
	if (!id) return c.json({ error: "Invalid ID" }, 400)
	try {
		const problem = await run(getProblemById(id))
		return c.json(problem)
	} catch (error) {
		const err = unwrapEffectError(error) as { _tag?: string } | undefined
		if (err?._tag === "DecisionNotFoundError") {
			return c.json({ error: "Decision not found" }, 404)
		}
		return c.json({ error: "Internal server error" }, 500)
	}
})

decisions.patch("/:id", async (c) => {
	const id = c.req.param("id")
	if (!id) return c.json({ error: "Invalid ID" }, 400)
	try {
		const body = await c.req.json()
		const problem = await run(updateProblem(id, body))
		return c.json(problem)
	} catch (error) {
		const err = unwrapEffectError(error) as { _tag?: string } | undefined
		if (err?._tag === "DecisionNotFoundError") {
			return c.json({ error: "Decision not found" }, 404)
		}
		return c.json({ error: "Internal server error" }, 500)
	}
})

decisions.delete("/:id", async (c) => {
	const id = c.req.param("id")
	if (!id) return c.json({ error: "Invalid ID" }, 400)
	try {
		await run(deleteProblem(id))
		return c.json({ success: true })
	} catch {
		return c.json({ error: "Internal server error" }, 500)
	}
})

export default decisions
