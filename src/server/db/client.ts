import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import * as schema from "./schema"

const databaseUrl = process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/decimatex"

const client = postgres(databaseUrl, { max: 1 })

export const db = drizzle(client, { schema })

export type Database = typeof db
