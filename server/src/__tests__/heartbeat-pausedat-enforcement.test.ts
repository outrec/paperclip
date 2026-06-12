/**
 * Regression test: tickTimers() must not enqueue a heartbeat run for an agent
 * whose pausedAt timestamp is set, even when status is not "paused".
 *
 * Root cause was OUT-45785: the scheduler only checked agent.status, so an agent
 * with status="running" but pausedAt set still had runs scheduled.
 */
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  activityLog,
  agents,
  agentRuntimeState,
  agentWakeupRequests,
  companies,
  companySkills,
  createDb,
  heartbeatRunEvents,
  heartbeatRuns,
} from "@paperclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import { heartbeatService } from "../services/heartbeat.ts";
import { runningProcesses } from "../adapters/index.ts";

vi.mock("../adapters/index.ts", async () => {
  const actual = await vi.importActual<typeof import("../adapters/index.ts")>("../adapters/index.ts");
  return {
    ...actual,
    getServerAdapter: vi.fn(() => ({
      supportsLocalAgentJwt: false,
      execute: vi.fn(async () => ({
        exitCode: 0,
        signal: null,
        timedOut: false,
        errorMessage: null,
        summary: "pausedAt enforcement test run.",
        provider: "test",
        model: "test-model",
      })),
    })),
  };
});

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping pausedAt enforcement tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
  );
}

describeEmbeddedPostgres("tickTimers — pausedAt enforcement", () => {
  let db!: ReturnType<typeof createDb>;
  let heartbeat!: ReturnType<typeof heartbeatService>;
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;

  const TWO_MINUTES_AGO = new Date(Date.now() - 2 * 60 * 1000);

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-heartbeat-pausedat-");
    db = createDb(tempDb.connectionString);
    heartbeat = heartbeatService(db);
  }, 20_000);

  afterEach(async () => {
    runningProcesses.clear();
    // Wait for any in-flight runs to settle
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const runs = await db.select({ status: heartbeatRuns.status }).from(heartbeatRuns);
      const hasActive = runs.some((r) => r.status === "queued" || r.status === "running");
      if (!hasActive) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    await db.delete(heartbeatRunEvents);
    await db.delete(activityLog);
    await db.delete(heartbeatRuns);
    await db.delete(agentWakeupRequests);
    await db.delete(agentRuntimeState);
    await db.delete(companySkills);
    await db.delete(agents);
    await db.delete(companies);
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  async function seedAgent(opts: {
    status?: string;
    pausedAt?: Date | null;
    lastHeartbeatAt?: Date;
  } = {}) {
    const companyId = randomUUID();
    const agentId = randomUUID();
    await db.insert(companies).values({
      id: companyId,
      name: "Test Co",
      issuePrefix: `TC${companyId.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
      requireBoardApprovalForNewAgents: false,
    });
    await db.insert(agents).values({
      id: agentId,
      companyId,
      name: "TestAgent",
      role: "engineer",
      status: (opts.status ?? "active") as typeof agents.$inferInsert["status"],
      pausedAt: opts.pausedAt ?? null,
      adapterType: "codex_local",
      adapterConfig: {},
      runtimeConfig: {
        heartbeat: {
          enabled: true,
          intervalSec: 30,
          wakeOnDemand: true,
          maxConcurrentRuns: 1,
        },
      },
      lastHeartbeatAt: opts.lastHeartbeatAt ?? TWO_MINUTES_AGO,
      permissions: {},
    });
    return { companyId, agentId };
  }

  it("enqueues a timer run for an active agent whose interval has elapsed", async () => {
    const { agentId } = await seedAgent({ status: "active", pausedAt: null });

    const result = await heartbeat.tickTimers();

    expect(result.enqueued).toBe(1);
    const requests = await db
      .select({ agentId: agentWakeupRequests.agentId, reason: agentWakeupRequests.reason })
      .from(agentWakeupRequests);
    expect(requests).toHaveLength(1);
    expect(requests[0].agentId).toBe(agentId);
    expect(requests[0].reason).toBe("heartbeat_timer");
  });

  it("does NOT enqueue a run when pausedAt is set, even if status is active", async () => {
    await seedAgent({ status: "active", pausedAt: TWO_MINUTES_AGO });

    const result = await heartbeat.tickTimers();

    expect(result.enqueued).toBe(0);
    const requests = await db.select().from(agentWakeupRequests);
    expect(requests).toHaveLength(0);
  });

  it("does NOT enqueue a run when pausedAt is set and status is running", async () => {
    await seedAgent({ status: "running", pausedAt: TWO_MINUTES_AGO });

    const result = await heartbeat.tickTimers();

    expect(result.enqueued).toBe(0);
    const requests = await db.select().from(agentWakeupRequests);
    expect(requests).toHaveLength(0);
  });

  it("enqueues a run after pausedAt is cleared (pausedAt=null)", async () => {
    const { agentId } = await seedAgent({ status: "active", pausedAt: null });

    const result = await heartbeat.tickTimers();

    expect(result.enqueued).toBe(1);
    const requests = await db
      .select({ agentId: agentWakeupRequests.agentId })
      .from(agentWakeupRequests);
    expect(requests[0].agentId).toBe(agentId);
  });

  it("skips agents with status=paused regardless of pausedAt value", async () => {
    await seedAgent({ status: "paused", pausedAt: null });

    const result = await heartbeat.tickTimers();

    expect(result.enqueued).toBe(0);
  });

  it("skips agents with status=terminated regardless of pausedAt value", async () => {
    await seedAgent({ status: "terminated", pausedAt: null });

    const result = await heartbeat.tickTimers();

    expect(result.enqueued).toBe(0);
  });
});
