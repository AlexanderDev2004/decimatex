import { relations, sql } from "drizzle-orm"
import {
	check,
	foreignKey,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core"

export const criteriaTypeEnum = pgEnum("criteria_type", ["benefit", "cost"])

export const analysisRunStatusEnum = pgEnum("analysis_run_status", ["pending", "running", "completed", "failed"])

export const decisionProblems = pgTable("decision_problems", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: varchar("name", { length: 200 }).notNull(),
	description: text("description"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const methods = pgTable("methods", {
	code: varchar("code", { length: 32 }).primaryKey(),
	name: varchar("name", { length: 120 }).notNull(),
	description: text("description"),
})

export const criteria = pgTable(
	"criteria",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		decisionId: uuid("decision_id")
			.notNull()
			.references(() => decisionProblems.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 120 }).notNull(),
		weight: numeric("weight", { precision: 14, scale: 6 }).notNull(),
		type: criteriaTypeEnum("type").notNull(),
		position: integer("position").default(0).notNull(),
	},
	(table) => [
		uniqueIndex("criteria_decision_name_uq").on(table.decisionId, table.name),
		uniqueIndex("criteria_decision_id_uq").on(table.decisionId, table.id),
		check("criteria_weight_positive_ck", sql`${table.weight} > 0`),
	],
)

export const alternatives = pgTable(
	"alternatives",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		decisionId: uuid("decision_id")
			.notNull()
			.references(() => decisionProblems.id, { onDelete: "cascade" }),
		name: varchar("name", { length: 120 }).notNull(),
		description: text("description"),
		position: integer("position").default(0).notNull(),
	},
	(table) => [
		uniqueIndex("alternatives_decision_name_uq").on(table.decisionId, table.name),
		uniqueIndex("alternatives_decision_id_uq").on(table.decisionId, table.id),
	],
)

export const analysisRuns = pgTable(
	"analysis_runs",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		decisionId: uuid("decision_id")
			.notNull()
			.references(() => decisionProblems.id, { onDelete: "cascade" }),
		methodCode: varchar("method_code", { length: 32 })
			.notNull()
			.references(() => methods.code),
		parameters: jsonb("parameters").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
		matrixSnapshot: jsonb("matrix_snapshot").$type<Record<string, unknown>>().notNull(),
		status: analysisRunStatusEnum("status").default("pending").notNull(),
		createdBy: varchar("created_by", { length: 120 }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex("analysis_runs_id_decision_uq").on(table.id, table.decisionId)],
)

export const decisionMatrixValues = pgTable(
	"decision_matrix_values",
	{
		decisionId: uuid("decision_id")
			.notNull()
			.references(() => decisionProblems.id, { onDelete: "cascade" }),
		alternativeId: uuid("alternative_id").notNull(),
		criteriaId: uuid("criteria_id").notNull(),
		value: numeric("value", { precision: 20, scale: 8 }).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.decisionId, table.alternativeId, table.criteriaId],
			name: "decision_matrix_values_pk",
		}),
		foreignKey({
			name: "matrix_values_alternative_fk",
			columns: [table.decisionId, table.alternativeId],
			foreignColumns: [alternatives.decisionId, alternatives.id],
		}).onDelete("cascade"),
		foreignKey({
			name: "matrix_values_criteria_fk",
			columns: [table.decisionId, table.criteriaId],
			foreignColumns: [criteria.decisionId, criteria.id],
		}).onDelete("cascade"),
	],
)

export const analysisResults = pgTable(
	"analysis_results",
	{
		runId: uuid("run_id").notNull(),
		decisionId: uuid("decision_id").notNull(),
		alternativeId: uuid("alternative_id").notNull(),
		score: numeric("score", { precision: 20, scale: 8 }).notNull(),
		rank: integer("rank").notNull(),
		details: jsonb("details").$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull(),
	},
	(table) => [
		primaryKey({ columns: [table.runId, table.alternativeId], name: "analysis_results_pk" }),
		uniqueIndex("analysis_results_run_rank_uq").on(table.runId, table.rank),
		check("analysis_results_rank_positive_ck", sql`${table.rank} > 0`),
		foreignKey({
			name: "analysis_results_alternative_fk",
			columns: [table.decisionId, table.alternativeId],
			foreignColumns: [alternatives.decisionId, alternatives.id],
		}).onDelete("cascade"),
		foreignKey({
			name: "analysis_results_run_fk",
			columns: [table.runId, table.decisionId],
			foreignColumns: [analysisRuns.id, analysisRuns.decisionId],
		}).onDelete("cascade"),
	],
)

export const decisionProblemsRelations = relations(decisionProblems, ({ many }) => ({
	criteria: many(criteria),
	alternatives: many(alternatives),
	decisionMatrixValues: many(decisionMatrixValues),
	analysisRuns: many(analysisRuns),
}))

export const methodsRelations = relations(methods, ({ many }) => ({
	analysisRuns: many(analysisRuns),
}))

export const criteriaRelations = relations(criteria, ({ one, many }) => ({
	decisionProblem: one(decisionProblems, {
		fields: [criteria.decisionId],
		references: [decisionProblems.id],
	}),
	decisionMatrixValues: many(decisionMatrixValues),
}))

export const alternativesRelations = relations(alternatives, ({ one, many }) => ({
	decisionProblem: one(decisionProblems, {
		fields: [alternatives.decisionId],
		references: [decisionProblems.id],
	}),
	decisionMatrixValues: many(decisionMatrixValues),
	analysisResults: many(analysisResults),
}))

export const analysisRunsRelations = relations(analysisRuns, ({ one, many }) => ({
	decisionProblem: one(decisionProblems, {
		fields: [analysisRuns.decisionId],
		references: [decisionProblems.id],
	}),
	method: one(methods, {
		fields: [analysisRuns.methodCode],
		references: [methods.code],
	}),
	results: many(analysisResults),
}))

export const decisionMatrixValuesRelations = relations(decisionMatrixValues, ({ one }) => ({
	decisionProblem: one(decisionProblems, {
		fields: [decisionMatrixValues.decisionId],
		references: [decisionProblems.id],
	}),
	alternative: one(alternatives, {
		fields: [decisionMatrixValues.alternativeId],
		references: [alternatives.id],
	}),
	criteria: one(criteria, {
		fields: [decisionMatrixValues.criteriaId],
		references: [criteria.id],
	}),
}))

export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
	run: one(analysisRuns, {
		fields: [analysisResults.runId],
		references: [analysisRuns.id],
	}),
	decisionProblem: one(decisionProblems, {
		fields: [analysisResults.decisionId],
		references: [decisionProblems.id],
	}),
	alternative: one(alternatives, {
		fields: [analysisResults.alternativeId],
		references: [alternatives.id],
	}),
}))

export const defaultMethodsSeed: Array<typeof methods.$inferInsert> = [
	{ code: "AHP", name: "Analytic Hierarchy Process", description: "Pairwise comparison with priority vectors." },
	{ code: "TOPSIS", name: "Technique for Order Preference by Similarity", description: "Distance to ideal and anti-ideal solutions." },
	{ code: "EDAS", name: "Evaluation based on Distance from Average Solution", description: "Compares alternatives against average solution." },
	{ code: "PSI", name: "Preference Selection Index", description: "Ranks options using preference variation." },
	{ code: "VIKOR", name: "VlseKriterijumska Optimizacija I Kompromisno Resenje", description: "Compromise ranking based on group utility and regret." },
	{ code: "MOORA", name: "Multi-Objective Optimization on the basis of Ratio Analysis", description: "Ratio system for benefit and cost criteria." },
	{ code: "ELECTRE", name: "Elimination and Choice Translating Reality", description: "Outranking method using concordance and discordance." },
	{ code: "PROMETHEE", name: "Preference Ranking Organization Method for Enrichment Evaluation", description: "Outranking with preference functions." },
	{ code: "COPRAS", name: "Complex Proportional Assessment", description: "Proportional utility ranking for alternatives." },
]

export type DecisionProblem = typeof decisionProblems.$inferSelect
export type NewDecisionProblem = typeof decisionProblems.$inferInsert

export type Criteria = typeof criteria.$inferSelect
export type NewCriteria = typeof criteria.$inferInsert

export type Alternative = typeof alternatives.$inferSelect
export type NewAlternative = typeof alternatives.$inferInsert

export type DecisionMatrixValue = typeof decisionMatrixValues.$inferSelect
export type NewDecisionMatrixValue = typeof decisionMatrixValues.$inferInsert

export type Method = typeof methods.$inferSelect
export type NewMethod = typeof methods.$inferInsert

export type AnalysisRun = typeof analysisRuns.$inferSelect
export type NewAnalysisRun = typeof analysisRuns.$inferInsert

export type AnalysisResult = typeof analysisResults.$inferSelect
export type NewAnalysisResult = typeof analysisResults.$inferInsert
