CREATE TYPE "public"."analysis_run_status" AS ENUM('pending', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."criteria_type" AS ENUM('benefit', 'cost');--> statement-breakpoint
CREATE TABLE "alternatives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"run_id" uuid NOT NULL,
	"decision_id" uuid NOT NULL,
	"alternative_id" uuid NOT NULL,
	"score" numeric(20, 8) NOT NULL,
	"rank" integer NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "analysis_results_pk" PRIMARY KEY("run_id","alternative_id"),
	CONSTRAINT "analysis_results_rank_positive_ck" CHECK ("analysis_results"."rank" > 0)
);
--> statement-breakpoint
CREATE TABLE "analysis_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"method_code" varchar(32) NOT NULL,
	"parameters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"matrix_snapshot" jsonb NOT NULL,
	"status" "analysis_run_status" DEFAULT 'pending' NOT NULL,
	"created_by" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"weight" numeric(14, 6) NOT NULL,
	"type" "criteria_type" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "criteria_weight_positive_ck" CHECK ("criteria"."weight" > 0)
);
--> statement-breakpoint
CREATE TABLE "decision_matrix_values" (
	"decision_id" uuid NOT NULL,
	"alternative_id" uuid NOT NULL,
	"criteria_id" uuid NOT NULL,
	"value" numeric(20, 8) NOT NULL,
	CONSTRAINT "decision_matrix_values_pk" PRIMARY KEY("decision_id","alternative_id","criteria_id")
);
--> statement-breakpoint
CREATE TABLE "decision_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "methods" (
	"code" varchar(32) PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text
);
--> statement-breakpoint
INSERT INTO "methods" ("code", "name", "description") VALUES
	('AHP', 'Analytic Hierarchy Process', 'Pairwise comparison with priority vectors.'),
	('TOPSIS', 'Technique for Order Preference by Similarity', 'Distance to ideal and anti-ideal solutions.'),
	('EDAS', 'Evaluation based on Distance from Average Solution', 'Compares alternatives against average solution.'),
	('PSI', 'Preference Selection Index', 'Ranks options using preference variation.'),
	('VIKOR', 'VlseKriterijumska Optimizacija I Kompromisno Resenje', 'Compromise ranking based on group utility and regret.'),
	('MOORA', 'Multi-Objective Optimization on the basis of Ratio Analysis', 'Ratio system for benefit and cost criteria.'),
	('ELECTRE', 'Elimination and Choice Translating Reality', 'Outranking method using concordance and discordance.'),
	('PROMETHEE', 'Preference Ranking Organization Method for Enrichment Evaluation', 'Outranking with preference functions.'),
	('COPRAS', 'Complex Proportional Assessment', 'Proportional utility ranking for alternatives.')
ON CONFLICT ("code") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "alternatives" ADD CONSTRAINT "alternatives_decision_id_decision_problems_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decision_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_decision_id_decision_problems_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decision_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_runs" ADD CONSTRAINT "analysis_runs_method_code_methods_code_fk" FOREIGN KEY ("method_code") REFERENCES "public"."methods"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "criteria" ADD CONSTRAINT "criteria_decision_id_decision_problems_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decision_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_matrix_values" ADD CONSTRAINT "decision_matrix_values_decision_id_decision_problems_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decision_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alternatives_decision_id_uq" ON "alternatives" USING btree ("decision_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "criteria_decision_id_uq" ON "criteria" USING btree ("decision_id","id");--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_runs_id_decision_uq" ON "analysis_runs" USING btree ("id","decision_id");--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_alternative_fk" FOREIGN KEY ("decision_id","alternative_id") REFERENCES "public"."alternatives"("decision_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_run_fk" FOREIGN KEY ("run_id","decision_id") REFERENCES "public"."analysis_runs"("id","decision_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_matrix_values" ADD CONSTRAINT "matrix_values_alternative_fk" FOREIGN KEY ("decision_id","alternative_id") REFERENCES "public"."alternatives"("decision_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_matrix_values" ADD CONSTRAINT "matrix_values_criteria_fk" FOREIGN KEY ("decision_id","criteria_id") REFERENCES "public"."criteria"("decision_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alternatives_decision_name_uq" ON "alternatives" USING btree ("decision_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "analysis_results_run_rank_uq" ON "analysis_results" USING btree ("run_id","rank");--> statement-breakpoint
CREATE UNIQUE INDEX "criteria_decision_name_uq" ON "criteria" USING btree ("decision_id","name");
