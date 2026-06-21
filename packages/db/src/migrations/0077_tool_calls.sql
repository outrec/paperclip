CREATE TABLE IF NOT EXISTS "tool_calls" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_id" uuid NOT NULL REFERENCES "companies"("id"),
  "run_id" uuid NOT NULL REFERENCES "heartbeat_runs"("id"),
  "agent_id" uuid REFERENCES "agents"("id"),
  "tool_name" text NOT NULL,
  "outcome" text NOT NULL,
  "duration_ms" integer,
  "error_message" text,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_calls_company_occurred_idx" ON "tool_calls" USING btree ("company_id","occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tool_calls_run_idx" ON "tool_calls" USING btree ("run_id");
