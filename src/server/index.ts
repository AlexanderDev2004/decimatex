import { Hono } from "hono"
import { cors } from "hono/cors"
import decisions from "./routes/decisions"
import criteria from "./routes/criteria"
import alternatives from "./routes/alternatives"
import matrix from "./routes/matrix"
import analysis from "./routes/analysis"

const app = new Hono()

app.use("/api/*", cors({ origin: "*" }))

app.get("/api/health", (c) => c.json({ status: "ok" }))

app.route("/api/decisions", decisions)
app.route("/api/decisions/:id/criteria", criteria)
app.route("/api/decisions/:id/alternatives", alternatives)
app.route("/api/decisions/:id/matrix", matrix)
app.route("/api/analysis", analysis)

export default app
