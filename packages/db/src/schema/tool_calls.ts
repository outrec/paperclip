import { pgTable, uuid, text, timestamp, integer, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { heartbeatRuns } from "./heartbeat_runs.js";
import { agents } from "./agents.js";

export const toolCalls = pgTable(
  "tool_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    runId: uuid("run_id").notNull().references(() => heartbeatRuns.id),
    agentId: uuid("agent_id").references(() => agents.id),
    toolName: text("tool_name").notNull(),
    outcome: text("outcome").notNull(), // 'success' | 'error' | 'timeout'
    durationMs: integer("duration_ms"),
    errorMessage: text("error_message"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyOccurredIdx: index("tool_calls_company_occurred_idx").on(table.companyId, table.occurredAt),
    runIdx: index("tool_calls_run_idx").on(table.runId),
  }),
);
