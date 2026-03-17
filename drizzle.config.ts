import { defineConfig } from "drizzle-kit"

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/decimatex"

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/server/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		url: databaseUrl,
	},
	strict: true,
	verbose: true,
})
