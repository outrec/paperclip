import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  agents,
  approvals,
  companies,
  createDb,
  heartbeatRunWatchdogDecisions,
  heartbeatRuns,
  issueRelations,
  issues,
} from "@paperclipai/db";
import {
  getEmbeddedPostgresTestSupport,
  startEmbeddedPostgresTestDatabase,
} from "./helpers/embedded-postgres.js";
import {
  ACTIVE_RUN_OUTPUT_ANTIDEDUP_COOLDOWN_MS,
  ACTIVE_RUN_OUTPUT_CONTINUE_REARM_MS,
  ACTIVE_RUN_OUTPUT_CRITICAL_THRESHOLD_MS,
  ACTIVE_RUN_OUTPUT_MAX_EVALUATIONS,
  ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS,
  ACTIVE_RUN_OUTPUT_TERMINAL_SNOOZE_MS,
  buildPaperclipWakePayload,
  heartbeatService,
} from "../services/heartbeat.ts";
import { recoveryService } from "../services/recovery/service.ts";
import { getRunLogStore } from "../services/run-log-store.ts";

const mockAdapterExecute = vi.hoisted(() =>
  vi.fn(async () => ({
    exitCode: 0,
    signal: null,
    timedOut: false,
    errorMessage: null,
    summary: "Acknowledged stale-run evaluation.",
    provider: "test",
    model: "test-model",
  })),
);

vi.mock("../telemetry.ts", () => ({
  getTelemetryClient: () => ({ track: vi.fn() }),
}));

vi.mock("@paperclipai/shared/telemetry", async () => {
  const actual = await vi.importActual<typeof import("@paperclipai/shared/telemetry")>(
    "@paperclipai/shared/telemetry",
  );
  return {
    ...actual,
    trackAgentFirstHeartbeat: vi.fn(),
  };
});

vi.mock("../adapters/index.ts", async () => {
  const actual = await vi.importActual<typeof import("../adapters/index.ts")>("../adapters/index.ts");
  return {
    ...actual,
    getServerAdapter: vi.fn(() => ({
      supportsLocalAgentJwt: false,
      execute: mockAdapterExecute,
    })),
  };
});

const embeddedPostgresSupport = await getEmbeddedPostgresTestSupport();
const describeEmbeddedPostgres = embeddedPostgresSupport.supported ? describe : describe.skip;

if (!embeddedPostgresSupport.supported) {
  console.warn(
    `Skipping embedded Postgres active-run output watchdog tests on this host: ${embeddedPostgresSupport.reason ?? "unsupported environment"}`,
  );
}

describeEmbeddedPostgres("active-run output watchdog", () => {
  let tempDb: Awaited<ReturnType<typeof startEmbeddedPostgresTestDatabase>> | null = null;
  let db: ReturnType<typeof createDb>;

  beforeAll(async () => {
    tempDb = await startEmbeddedPostgresTestDatabase("paperclip-active-run-output-watchdog-");
    db = createDb(tempDb.connectionString);
  }, 30_000);

  afterEach(async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const activeRuns = await db
        .select({ id: heartbeatRuns.id })
        .from(heartbeatRuns)
        .where(sql`${heartbeatRuns.status} in ('queued', 'running')`);
      if (activeRuns.length === 0) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    await db.execute(sql.raw(`TRUNCATE TABLE "companies" CASCADE`));
  });

  afterAll(async () => {
    await tempDb?.cleanup();
  });

  async function seedRunningRun(opts: {
    now: Date;
    ageMs: number;
    withOutput?: boolean;
    lastOutputAgeMs?: number;
    finishedAt?: Date | null;
    logChunk?: string;
    processPid?: number | null;
    processGroupId?: number | null;
  }) {
    const companyId = randomUUID();
    const managerId = randomUUID();
    const infraId = randomUUID();
    const coderId = randomUUID();
    const issueId = randomUUID();
    const runId = randomUUID();
    const issuePrefix = `W${companyId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
    const startedAt = new Date(opts.now.getTime() - opts.ageMs);
    const lastOutputAt = opts.withOutput || opts.lastOutputAgeMs !== undefined
      ? new Date(opts.now.getTime() - (opts.lastOutputAgeMs ?? 5 * 60 * 1000))
      : null;

    await db.insert(companies).values({
      id: companyId,
      name: "Watchdog Co",
      issuePrefix,
      requireBoardApprovalForNewAgents: false,
    });
    await db.insert(agents).values([
      {
        id: managerId,
        companyId,
        name: "CTO",
        role: "cto",
        status: "idle",
        adapterType: "codex_local",
        adapterConfig: {},
        runtimeConfig: {},
        permissions: {},
      },
      {
        id: coderId,
        companyId,
        name: "Coder",
        role: "engineer",
        status: "running",
        reportsTo: managerId,
        adapterType: "codex_local",
        adapterConfig: {},
        runtimeConfig: {},
        permissions: {},
      },
      {
        id: infraId,
        companyId,
        name: "Infrastructure Engineer",
        role: "engineer",
        title: "Infrastructure & Release Engineer",
        status: "idle",
        adapterType: "codex_local",
        adapterConfig: {},
        runtimeConfig: {},
        permissions: {},
      },
    ]);
    await db.insert(issues).values({
      id: issueId,
      companyId,
      title: "Long running implementation",
      status: "in_progress",
      priority: "medium",
      assigneeAgentId: coderId,
      issueNumber: 1,
      identifier: `${issuePrefix}-1`,
      updatedAt: startedAt,
      createdAt: startedAt,
    });
    await db.insert(heartbeatRuns).values({
      id: runId,
      companyId,
      agentId: coderId,
      status: "running",
      invocationSource: "assignment",
      triggerDetail: "system",
      startedAt,
      finishedAt: opts.finishedAt ?? null,
      processStartedAt: startedAt,
      processPid: opts.processPid ?? null,
      processGroupId: opts.processGroupId ?? null,
      lastOutputAt,
      lastOutputSeq: lastOutputAt ? 3 : 0,
      lastOutputStream: lastOutputAt ? "stdout" : null,
      contextSnapshot: { issueId },
      stdoutExcerpt: "OPENAI_API_KEY=sk-test-secret-value should not leak",
      logBytes: 0,
    });
    if (opts.logChunk) {
      const store = getRunLogStore();
      const handle = await store.begin({ companyId, agentId: coderId, runId });
      const logBytes = await store.append(handle, {
        stream: "stdout",
        chunk: opts.logChunk,
        ts: startedAt.toISOString(),
      });
      await db
        .update(heartbeatRuns)
        .set({
          logStore: handle.store,
          logRef: handle.logRef,
          logBytes,
        })
        .where(eq(heartbeatRuns.id, runId));
    }
    await db.update(issues).set({ executionRunId: runId }).where(eq(issues.id, issueId));
    return { companyId, managerId, infraId, coderId, issueId, runId, issuePrefix };
  }

  it("creates one medium-priority evaluation issue for a suspicious silent run", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, managerId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);

    const first = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const second = await heartbeat.scanSilentActiveRuns({ now, companyId });

    expect(first.created).toBe(1);
    expect(second.created).toBe(0);
    expect(second.existing).toBe(1);

    const evaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluations).toHaveLength(1);
    expect(["todo", "in_progress"]).toContain(evaluations[0]?.status);
    expect(evaluations[0]).toMatchObject({
      priority: "medium",
      assigneeAgentId: managerId,
      originId: runId,
      originFingerprint: `stale_active_run:${companyId}:${runId}`,
    });
    expect(evaluations[0]?.description).toContain("Decision Checklist");
    expect(evaluations[0]?.description).not.toContain("sk-test-secret-value");
  });

  it("embeds a redacted stale-run log tail in the wake payload", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, issueId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
      logChunk: [
        "starting bounded command",
        "PAPERCLIP_API_KEY=sk-test-secret-value",
        "find / -type f -name results.jsonl -path *expert*",
      ].join("\n"),
    });

    const payload = await buildPaperclipWakePayload({
      db,
      companyId,
      contextSnapshot: {
        issueId,
        wakeReason: "issue_assigned",
        staleRunId: runId,
      },
    });

    expect(payload).toMatchObject({
      reason: "issue_assigned",
      staleRunEvidence: {
        runId,
        logRoute: `/api/heartbeat-runs/${runId}/log`,
        logTailAvailable: true,
        process: {
          inMemoryHandle: false,
          recoveryOwner: "watchdog-review-assignee",
        },
      },
    });
    const evidence = payload?.staleRunEvidence as { logTail?: string } | null | undefined;
    expect(evidence?.logTail).toContain("find / -type f -name results.jsonl");
    expect(evidence?.logTail).not.toContain("sk-test-secret-value");
  });

  it("includes host process snapshot and recovery semantics in stale-run review issues", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
      processPid: process.pid,
    });
    const heartbeat = heartbeatService(db);

    await heartbeat.scanSilentActiveRuns({ now, companyId });

    const evaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluations).toHaveLength(1);
    expect(evaluations[0]?.description).toContain("## Host Process Snapshot");
    expect(evaluations[0]?.description).toContain(String(process.pid));
    expect(evaluations[0]?.description).toContain("## Recovery Semantics");
    expect(evaluations[0]?.description).toContain("watchdog assignee owns the review");
  });

  it("does not recreate a recently closed false-positive stale-run alert", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);

    const first = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = first.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();

    const closedAt = new Date(now.getTime() + 60_000);
    await db
      .update(issues)
      .set({ status: "done", updatedAt: closedAt })
      .where(eq(issues.id, evaluationIssueId));

    const second = await heartbeat.scanSilentActiveRuns({
      now: new Date(closedAt.getTime() + 60_000),
      companyId,
    });

    expect(second).toMatchObject({ created: 0, existing: 1 });
    expect(second.evaluationIssueIds).toEqual([evaluationIssueId]);

    const evaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluations).toHaveLength(1);
  });

  it("reopens a recently closed stale-run alert when severity becomes critical", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, issueId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_CRITICAL_THRESHOLD_MS - 10 * 60_000,
    });
    const heartbeat = heartbeatService(db);

    const first = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = first.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();

    const closedAt = new Date(now.getTime() + 60_000);
    await db
      .update(issues)
      .set({ status: "done", updatedAt: closedAt })
      .where(eq(issues.id, evaluationIssueId));

    const criticalAt = new Date(now.getTime() + 11 * 60_000);
    const scan = await heartbeat.scanSilentActiveRuns({ now: criticalAt, companyId });

    expect(scan).toMatchObject({ created: 0, escalated: 1 });
    expect(scan.evaluationIssueIds).toEqual([evaluationIssueId]);

    const [evaluation] = await db.select().from(issues).where(eq(issues.id, evaluationIssueId));
    expect(evaluation).toMatchObject({ status: "todo", priority: "high" });

    const [blocker] = await db
      .select()
      .from(issueRelations)
      .where(and(eq(issueRelations.companyId, companyId), eq(issueRelations.relatedIssueId, issueId)));
    expect(blocker?.issueId).toBe(evaluationIssueId);

    const evaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluations).toHaveLength(1);
  });

  it("redacts sensitive values from actual run-log evidence", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const leakedJwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const leakedGithubToken = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";
    const { companyId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
      logChunk: [
        "Authorization: Bearer live-bearer-token-value",
        `POST payload {"apiKey":"json-secret-value","token":"${leakedJwt}"}`,
        `GITHUB_TOKEN=${leakedGithubToken}`,
      ].join("\n"),
    });
    const heartbeat = heartbeatService(db);

    await heartbeat.scanSilentActiveRuns({ now, companyId });

    const [evaluation] = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluation?.description).toContain("***REDACTED***");
    expect(evaluation?.description).not.toContain("live-bearer-token-value");
    expect(evaluation?.description).not.toContain("json-secret-value");
    expect(evaluation?.description).not.toContain(leakedJwt);
    expect(evaluation?.description).not.toContain(leakedGithubToken);
  });

  it("raises critical stale-run evaluations and blocks the source issue", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, issueId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_CRITICAL_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);

    const result = await heartbeat.scanSilentActiveRuns({ now, companyId });

    expect(result.created).toBe(1);
    const [evaluation] = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluation?.priority).toBe("high");

    const [blocker] = await db
      .select()
      .from(issueRelations)
      .where(and(eq(issueRelations.companyId, companyId), eq(issueRelations.relatedIssueId, issueId)));
    expect(blocker?.issueId).toBe(evaluation?.id);

    const [source] = await db.select().from(issues).where(eq(issues.id, issueId));
    expect(source?.status).toBe("blocked");
  });

  it("skips snoozed runs and healthy noisy runs", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const stale = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_CRITICAL_THRESHOLD_MS + 60_000,
    });
    const noisy = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_CRITICAL_THRESHOLD_MS + 60_000,
      withOutput: true,
    });
    await db.insert(heartbeatRunWatchdogDecisions).values({
      companyId: stale.companyId,
      runId: stale.runId,
      decision: "snooze",
      snoozedUntil: new Date(now.getTime() + 60 * 60 * 1000),
      reason: "Intentional quiet run",
    });
    const heartbeat = heartbeatService(db);

    const staleResult = await heartbeat.scanSilentActiveRuns({ now, companyId: stale.companyId });
    const noisyResult = await heartbeat.scanSilentActiveRuns({ now, companyId: noisy.companyId });

    expect(staleResult).toMatchObject({ created: 0, snoozed: 1 });
    expect(noisyResult).toMatchObject({ scanned: 0, created: 0 });
  });

  it("creates one hourly infra alert for agents with stale heartbeat runs", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, infraId, coderId } = await seedRunningRun({
      now,
      ageMs: 35 * 60_000,
    });
    await db
      .update(agents)
      .set({ lastHeartbeatAt: new Date(now.getTime() - 35 * 60_000) })
      .where(eq(agents.id, coderId));
    const heartbeat = heartbeatService(db);

    const first = await heartbeat.scanStaleHeartbeatRunAgents({
      now,
      companyId,
      thresholdMs: 30 * 60_000,
    });
    const second = await heartbeat.scanStaleHeartbeatRunAgents({
      now: new Date(now.getTime() + 10 * 60_000),
      companyId,
      thresholdMs: 30 * 60_000,
    });

    expect(first).toMatchObject({
      scannedAgents: 1,
      created: 1,
      existing: 0,
      thresholdMs: 30 * 60_000,
    });
    expect(second).toMatchObject({
      created: 0,
      existing: 1,
    });
    expect(first.staleAgents[0]).toMatchObject({
      agentId: coderId,
      staleRunCount: 1,
    });

    const alerts = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_heartbeat_run_agent")));
    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      priority: "high",
      assigneeAgentId: infraId,
      originId: coderId,
    });
    expect(alerts[0]?.originFingerprint).toContain(`stale_heartbeat_run_agent:${companyId}:${coderId}:`);
    expect(alerts[0]?.description).toContain("Stale active run count: 1");
  });

  it("does not alert when a newly active run is fresher than the stale heartbeat threshold", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, coderId } = await seedRunningRun({
      now,
      ageMs: 60_000,
    });
    await db
      .update(agents)
      .set({ lastHeartbeatAt: new Date(now.getTime() - 35 * 60_000) })
      .where(eq(agents.id, coderId));
    const heartbeat = heartbeatService(db);

    const result = await heartbeat.scanStaleHeartbeatRunAgents({
      now,
      companyId,
      thresholdMs: 30 * 60_000,
    });

    expect(result).toMatchObject({
      scannedAgents: 0,
      created: 0,
      existing: 0,
    });

    const alerts = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_heartbeat_run_agent")));
    expect(alerts).toHaveLength(0);
  });

  it("does not alert when an older active run has recent output within the stale heartbeat threshold", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, coderId } = await seedRunningRun({
      now,
      ageMs: 35 * 60_000,
      lastOutputAgeMs: 5 * 60_000,
    });
    await db
      .update(agents)
      .set({ lastHeartbeatAt: new Date(now.getTime() - 35 * 60_000) })
      .where(eq(agents.id, coderId));
    const heartbeat = heartbeatService(db);

    const result = await heartbeat.scanStaleHeartbeatRunAgents({
      now,
      companyId,
      thresholdMs: 30 * 60_000,
    });

    expect(result).toMatchObject({
      scannedAgents: 0,
      created: 0,
      existing: 0,
    });
  });

  it("does not alert when an active run already has finishedAt set", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, coderId } = await seedRunningRun({
      now,
      ageMs: 35 * 60_000,
      finishedAt: new Date(now.getTime() - 60_000),
    });
    await db
      .update(agents)
      .set({ lastHeartbeatAt: new Date(now.getTime() - 35 * 60_000) })
      .where(eq(agents.id, coderId));
    const heartbeat = heartbeatService(db);

    const result = await heartbeat.scanStaleHeartbeatRunAgents({
      now,
      companyId,
      thresholdMs: 30 * 60_000,
    });

    expect(result).toMatchObject({
      scannedAgents: 0,
      created: 0,
      existing: 0,
    });
  });

  it("still alerts when an older active run has stale output and no finishedAt", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, coderId } = await seedRunningRun({
      now,
      ageMs: 35 * 60_000,
      lastOutputAgeMs: 31 * 60_000,
    });
    await db
      .update(agents)
      .set({ lastHeartbeatAt: new Date(now.getTime() - 35 * 60_000) })
      .where(eq(agents.id, coderId));
    const heartbeat = heartbeatService(db);

    const result = await heartbeat.scanStaleHeartbeatRunAgents({
      now,
      companyId,
      thresholdMs: 30 * 60_000,
    });

    expect(result).toMatchObject({
      scannedAgents: 1,
      created: 1,
      existing: 0,
    });
  });

  it("records watchdog decisions through recovery owner authorization", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, managerId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);
    const recovery = recoveryService(db, { enqueueWakeup: vi.fn() });

    const scan = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = scan.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();

    await expect(
      recovery.recordWatchdogDecision({
        runId,
        actor: { type: "agent", agentId: randomUUID() },
        decision: "continue",
        evaluationIssueId,
        reason: "not my recovery issue",
      }),
    ).rejects.toMatchObject({ status: 403 });

    const snoozedUntil = new Date(now.getTime() + 60 * 60 * 1000);
    const decision = await recovery.recordWatchdogDecision({
      runId,
      actor: { type: "agent", agentId: managerId },
      decision: "snooze",
      evaluationIssueId,
      reason: "Long compile with no output",
      snoozedUntil,
    });

    expect(decision).toMatchObject({
      runId,
      evaluationIssueId,
      decision: "snooze",
      createdByAgentId: managerId,
    });
    await expect(recovery.buildRunOutputSilence({
      id: runId,
      companyId,
      status: "running",
      lastOutputAt: null,
      lastOutputSeq: 0,
      lastOutputStream: null,
      processStartedAt: new Date(now.getTime() - ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS - 60_000),
      startedAt: new Date(now.getTime() - ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS - 60_000),
      createdAt: new Date(now.getTime() - ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS - 60_000),
    }, now)).resolves.toMatchObject({
      level: "snoozed",
      snoozedUntil,
      evaluationIssueId,
    });
  });

  it("re-arms continue decisions after the default quiet window", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, managerId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);
    const recovery = recoveryService(db, { enqueueWakeup: vi.fn() });

    const scan = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = scan.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();

    const decision = await recovery.recordWatchdogDecision({
      runId,
      actor: { type: "agent", agentId: managerId },
      decision: "continue",
      evaluationIssueId,
      reason: "Current evidence is acceptable; keep watching.",
      now,
    });
    const rearmAt = new Date(now.getTime() + ACTIVE_RUN_OUTPUT_CONTINUE_REARM_MS);
    expect(decision).toMatchObject({
      runId,
      evaluationIssueId,
      decision: "continue",
      createdByAgentId: managerId,
    });
    expect(decision.snoozedUntil?.toISOString()).toBe(rearmAt.toISOString());

    await db.update(issues).set({ status: "done" }).where(eq(issues.id, evaluationIssueId));

    const beforeRearm = await heartbeat.scanSilentActiveRuns({
      now: new Date(rearmAt.getTime() - 60_000),
      companyId,
    });
    expect(beforeRearm).toMatchObject({ created: 0, snoozed: 1 });

    const afterRearm = await heartbeat.scanSilentActiveRuns({
      now: new Date(rearmAt.getTime() + 60_000),
      companyId,
    });
    expect(afterRearm.created).toBe(1);
    expect(afterRearm.evaluationIssueIds[0]).not.toBe(evaluationIssueId);

    const evaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluations.filter((issue) => !["done", "cancelled"].includes(issue.status))).toHaveLength(1);
  });

  it("rejects agent watchdog decisions using issues not bound to the target run", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, managerId, coderId, runId, issuePrefix } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);
    const recovery = recoveryService(db, { enqueueWakeup: vi.fn() });

    const scan = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = scan.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();

    const unrelatedIssueId = randomUUID();
    await db.insert(issues).values({
      id: unrelatedIssueId,
      companyId,
      title: "Assigned but unrelated",
      status: "todo",
      priority: "medium",
      assigneeAgentId: managerId,
      issueNumber: 20,
      identifier: `${issuePrefix}-20`,
    });

    const otherRunId = randomUUID();
    const otherEvaluationIssueId = randomUUID();
    await db.insert(heartbeatRuns).values({
      id: otherRunId,
      companyId,
      agentId: coderId,
      status: "running",
      invocationSource: "assignment",
      triggerDetail: "system",
      startedAt: new Date(now.getTime() - ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS - 120_000),
      processStartedAt: new Date(now.getTime() - ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS - 120_000),
      lastOutputAt: null,
      lastOutputSeq: 0,
      lastOutputStream: null,
      contextSnapshot: {},
      logBytes: 0,
    });
    await db.insert(issues).values({
      id: otherEvaluationIssueId,
      companyId,
      title: "Other run evaluation",
      status: "todo",
      priority: "medium",
      assigneeAgentId: managerId,
      issueNumber: 21,
      identifier: `${issuePrefix}-21`,
      originKind: "stale_active_run_evaluation",
      originId: otherRunId,
      originFingerprint: `stale_active_run:${companyId}:${otherRunId}`,
    });

    const attempts = [
      { decision: "continue" as const, evaluationIssueId: unrelatedIssueId },
      { decision: "dismissed_false_positive" as const, evaluationIssueId: unrelatedIssueId },
      {
        decision: "snooze" as const,
        evaluationIssueId: unrelatedIssueId,
        snoozedUntil: new Date(now.getTime() + 60 * 60 * 1000),
      },
      { decision: "continue" as const, evaluationIssueId: otherEvaluationIssueId },
    ];

    for (const attempt of attempts) {
      await expect(
        recovery.recordWatchdogDecision({
          runId,
          actor: { type: "agent", agentId: managerId },
          reason: "malicious or stale binding",
          ...attempt,
        }),
      ).rejects.toMatchObject({ status: 403 });
    }

    await db.update(issues).set({ status: "done" }).where(eq(issues.id, evaluationIssueId));
    await expect(
      recovery.recordWatchdogDecision({
        runId,
        actor: { type: "agent", agentId: managerId },
        decision: "continue",
        evaluationIssueId,
        reason: "closed evaluation should not authorize",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("validates createdByRunId before storing watchdog decisions", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, managerId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);
    const recovery = recoveryService(db, { enqueueWakeup: vi.fn() });

    const scan = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = scan.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();

    await expect(
      recovery.recordWatchdogDecision({
        runId,
        actor: { type: "agent", agentId: managerId },
        decision: "continue",
        evaluationIssueId,
        reason: "client supplied another agent run",
        createdByRunId: runId,
      }),
    ).rejects.toMatchObject({ status: 403 });

    const managerRunId = randomUUID();
    await db.insert(heartbeatRuns).values({
      id: managerRunId,
      companyId,
      agentId: managerId,
      status: "running",
      invocationSource: "assignment",
      triggerDetail: "system",
      startedAt: now,
      processStartedAt: now,
      lastOutputAt: now,
      lastOutputSeq: 1,
      lastOutputStream: "stdout",
      contextSnapshot: {},
      logBytes: 0,
    });

    const decision = await recovery.recordWatchdogDecision({
      runId,
      actor: { type: "agent", agentId: managerId, runId: managerRunId },
      decision: "continue",
      evaluationIssueId,
      reason: "valid current actor run",
      createdByRunId: randomUUID(),
    });
    expect(decision.createdByRunId).toBe(managerRunId);
  });

  // §A1 / §A3: anti-dedup cooldown + implicit snooze
  it("does not create a second evaluation within the 60m anti-dedup cooldown and writes an implicit snooze", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);

    // Create the first evaluation.
    const first = await heartbeat.scanSilentActiveRuns({ now, companyId });
    const evaluationIssueId = first.evaluationIssueIds[0];
    expect(evaluationIssueId).toBeTruthy();
    expect(first.created).toBe(1);

    // Close the evaluation (simulate the assignee marking it done).
    const closedAt = new Date(now.getTime() + 5 * 60_000);
    await db.update(issues).set({ status: "done", updatedAt: closedAt }).where(eq(issues.id, evaluationIssueId));

    // Scan again well within the anti-dedup cooldown window — should NOT create a new issue.
    const secondNow = new Date(closedAt.getTime() + 10 * 60_000); // 10m after close, within 60m window
    const second = await heartbeat.scanSilentActiveRuns({ now: secondNow, companyId });

    expect(second.created).toBe(0);
    const allEvaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(allEvaluations).toHaveLength(1);

    // An implicit snooze decision row should have been written.
    const snoozeRows = await db
      .select()
      .from(heartbeatRunWatchdogDecisions)
      .where(and(eq(heartbeatRunWatchdogDecisions.companyId, companyId), eq(heartbeatRunWatchdogDecisions.runId, runId)));
    const autoSnooze = snoozeRows.find((r) => r.decision === "snooze" && r.reason?.includes("anti-dedup cooldown"));
    expect(autoSnooze).toBeTruthy();
    expect(autoSnooze?.snoozedUntil).toBeTruthy();
    const expectedSnoozeEnd = new Date(secondNow.getTime() + ACTIVE_RUN_OUTPUT_TERMINAL_SNOOZE_MS);
    expect(autoSnooze!.snoozedUntil!.getTime()).toBeCloseTo(expectedSnoozeEnd.getTime(), -3);
  });

  // §A2: N terminal evaluations → board approval instead of another evaluation issue
  it(`escalates to a board approval after ${ACTIVE_RUN_OUTPUT_MAX_EVALUATIONS} terminal evaluations without resolving the run`, async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, managerId, runId, issuePrefix } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);

    // Directly seed ACTIVE_RUN_OUTPUT_MAX_EVALUATIONS terminal evaluations so we can
    // test the churn-cap escalation without timing/cooldown complexity.
    // Each uses a unique issueNumber so the identifier is unique.
    const terminalEvalIds: string[] = [];
    for (let i = 0; i < ACTIVE_RUN_OUTPUT_MAX_EVALUATIONS; i += 1) {
      const evalId = randomUUID();
      const issueNumber = 100 + i;
      await db.insert(issues).values({
        id: evalId,
        companyId,
        title: `Review silent active run (pre-seeded ${i})`,
        status: "done",  // already terminal
        priority: "medium",
        assigneeAgentId: managerId,
        issueNumber,
        identifier: `${issuePrefix}-${issueNumber}`,
        originKind: "stale_active_run_evaluation",
        originId: runId,
        originFingerprint: `stale_active_run:${companyId}:${runId}:${i}`, // unique per row
        updatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000 - i * 60_000), // older than ANTIDEDUP cooldown
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000 - i * 60_000),
      });
      terminalEvalIds.push(evalId);
    }

    // The scan at `now` should detect MAX_EVALUATIONS terminal evals and escalate to a board approval.
    const approvalScan = await heartbeat.scanSilentActiveRuns({ now, companyId });

    // No new evaluation issues should have been created.
    const allEvaluations = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(allEvaluations).toHaveLength(ACTIVE_RUN_OUTPUT_MAX_EVALUATIONS);
    expect(allEvaluations.every((e) => ["done", "cancelled"].includes(e.status))).toBe(true);

    // A board approval of type release_stale_run should exist.
    const pendingApprovals = await db
      .select()
      .from(approvals)
      .where(and(eq(approvals.companyId, companyId), eq(approvals.type, "release_stale_run"), eq(approvals.status, "pending")));
    expect(pendingApprovals).toHaveLength(1);
    expect(pendingApprovals[0]?.payload).toMatchObject({ runId });

    // The second scan must be idempotent: the 24h snooze written by the approval scan makes
    // the run snoozed, so no second approval is created.
    await heartbeat.scanSilentActiveRuns({ now: new Date(now.getTime() + 30 * 60_000), companyId });
    const approvalCount = await db
      .select()
      .from(approvals)
      .where(and(eq(approvals.companyId, companyId), eq(approvals.type, "release_stale_run")));
    expect(approvalCount).toHaveLength(1);
  });

  // §C1: evaluation title includes run short-id and silence duration
  it("includes the run short-id and silence duration in the evaluation title", async () => {
    const now = new Date("2026-04-22T20:00:00.000Z");
    const { companyId, runId } = await seedRunningRun({
      now,
      ageMs: ACTIVE_RUN_OUTPUT_SUSPICION_THRESHOLD_MS + 60_000,
    });
    const heartbeat = heartbeatService(db);

    await heartbeat.scanSilentActiveRuns({ now, companyId });

    const [evaluation] = await db
      .select()
      .from(issues)
      .where(and(eq(issues.companyId, companyId), eq(issues.originKind, "stale_active_run_evaluation")));
    expect(evaluation).toBeTruthy();
    // Title must include the short run ID (first 8 chars).
    expect(evaluation?.title).toContain(runId.slice(0, 8));
    // Title must mention silence duration.
    expect(evaluation?.title).toMatch(/silent\s/i);
  });
});
