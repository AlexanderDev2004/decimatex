/// <reference types="bun" />
import app from "./index"

const port = process.env.PORT ? Number.parseInt(process.env.PORT) : 3000

console.log(`Decimatex API server starting on port ${port}...`)

Bun.serve({
	fetch: app.fetch,
	port,
})

console.log(`Server ready on http://localhost:${port}`)
