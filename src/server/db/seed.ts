import { db } from "./client"
import { methods, defaultMethodsSeed } from "./schema"

async function seed() {
	console.log("Seeding default DSS methods...")

	for (const method of defaultMethodsSeed) {
		await db
			.insert(methods)
			.values(method)
			.onConflictDoNothing({ target: methods.code })
	}

	console.log("Seed complete.")
	process.exit(0)
}

seed().catch((err) => {
	console.error("Seed failed:", err)
	process.exit(1)
})
