import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { handleRequest } from "../src/index.js";

test("Cloudflare route config sends SEO API requests to the Worker", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/seo\/\*"/);
});

test("Cloudflare route config sends reliability telemetry requests to the Worker", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/reliability\/\*"/);
});

test("Cloudflare route config sends CRO API requests to the Worker", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/cro\/\*"/);
});

test("Cloudflare route config sends Brand Trust API requests to the Worker", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/brand-trust\/\*"/);
  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/dashboard\/api\/brand-trust\/\*"/);
});

test("Cloudflare route config sends chat API requests to the Worker", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/chat\/\*"/);
});

test("Cloudflare route config sends preset routes and admin export requests to the Worker", () => {
  const wranglerConfig = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");

  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/routes\/presets"/);
  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/preset-routes\/\*"/);
  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/admin\/preset-route-feedback\/export"/);
  assert.match(wranglerConfig, /pattern\s*=\s*"ai\.outrec\.com\/api\/admin\/preset-route-feedback\/capture-metrics"/);
});

test("signup noop health returns ok without credentials or storage writes", async () => {
  const response = await handleRequest(
    new Request("https://ai.outrec.com/api/outrec/healthz/signup-noop"),
    {}
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, {
    ok: true,
    status: "ok",
    noop: true,
    check: "signup-noop"
  });
});

test("signup noop health only accepts GET", async () => {
  const response = await handleRequest(
    new Request("https://ai.outrec.com/api/outrec/healthz/signup-noop", { method: "POST" }),
    { OUTREC_KV: new MemoryKv() }
  );

  assert.equal(response.status, 404);
});

test("Brand Trust reviews return degraded JSON for dashboard API route", async () => {
  const response = await handleRequest(
    new Request("https://ai.outrec.com/dashboard/api/brand-trust/reviews"),
    { OUTREC_KV: new MemoryKv() },
    { now: Date.parse("2026-06-06T15:00:00.000Z") }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(body.widgetSummary.segmentCount, 3);
  assert.equal(body.widgetSummary.reviewCount, 6);
  assert.equal(body.segments[0].reviewSummary.ratingAverage, 4.7);
  assert.equal(body.recentReviews[0].id, "facebook-large-service-recommend");
  assert.equal(body.recentReviews[0].sourcePlatform, "facebook");
  assert.equal(body.recentReviews[0].rating, null);
  assert.equal(body._health.sourceHealth.status, "degraded");
  assert.equal(body._health.sourceStatus.status, "degraded_fixture");
});

test("Brand Trust source health and review request aliases return JSON", async () => {
  const env = { OUTREC_KV: new MemoryKv() };

  const health = await handleRequest(
    new Request("https://ai.outrec.com/api/brand-trust/source-health"),
    env,
    { now: Date.parse("2026-06-06T15:00:00.000Z") }
  );
  const healthBody = await health.json();

  assert.equal(health.status, 200);
  assert.equal(healthBody.ok, true);
  assert.equal(healthBody.source_health.status, "degraded");
  assert.equal(healthBody.source_health.segmentCount, 3);

  const requests = await handleRequest(
    new Request("https://ai.outrec.com/dashboard/api/brand-trust/review-requests"),
    env,
    { now: Date.parse("2026-06-06T15:00:00.000Z") }
  );
  const requestsBody = await requests.json();

  assert.equal(requests.status, 200);
  assert.equal(requestsBody.ok, true);
  assert.equal(requestsBody.ctaStates.length, 3);
  assert.equal(requestsBody.ctaStates[0].outboundReviewCta.state, "ready");
  assert.equal(requestsBody.ctaStates[1].outboundReviewCta.suppressionReason, "unanswered_negative_review");
});

test("CRO experiment endpoints accept token-gated safe test-mode events and summarize by run", async () => {
  const env = {
    OUTREC_KV: new MemoryKv(),
    OUTREC_AB_TEST_MODE_TOKEN: "ab-secret",
    OUTREC_AB_EXPERIMENT_ID: "qa-control-vs-control"
  };
  const now = Date.parse("2026-06-03T18:00:00.000Z");

  const experiments = await handleRequest(new Request(`${base}/api/cro/experiments`), env, { now });
  const experimentsBody = await experiments.json();
  assert.equal(experiments.status, 200);
  assert.equal(experimentsBody.experiments[0].id, "qa-control-vs-control");
  assert.equal(experimentsBody.endpoints.assign, "/api/cro/experiments/assign");

  const denied = await handleRequest(new Request(`${base}/api/cro/experiments/assign`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      experiment_id: "qa-control-vs-control",
      run_id: "run-001",
      session_id: "session-denied"
    })
  }), env, { now });
  const deniedBody = await denied.json();
  assert.equal(denied.status, 401);
  assert.equal(deniedBody.diagnostics.code, "AB_EXPERIMENT_TEST_MODE_TOKEN_REQUIRED");

  const assigned = { control: 0, treatment: 0 };
  for (let index = 0; index < 100; index += 1) {
    const sessionId = `session-${index}`;
    const assignment = await handleRequest(new Request(`${base}/api/cro/experiments/assign`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-outrec-ab-test-mode-token": "ab-secret"
      },
      body: JSON.stringify({
        experiment_id: "qa-control-vs-control",
        run_id: "run-001",
        session_id: sessionId
      })
    }), env, { now: now + index });
    const assignmentBody = await assignment.json();

    assert.equal(assignment.status, 202);
    assert.equal(assignmentBody.ok, true);
    assert.equal(assignmentBody.route, "/api/cro/experiments/assign");
    assert.equal(assignmentBody.mode, "test");
    assert.equal(assignmentBody.lead_mutation, false);
    assigned[assignmentBody.variant] += 1;

    const exposure = await handleRequest(new Request(`${base}/api/cro/experiments/exposure`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-outrec-ab-test-mode-token": "ab-secret"
      },
      body: JSON.stringify({
        experiment_id: "qa-control-vs-control",
        run_id: "run-001",
        session_id: sessionId,
        variant: assignmentBody.variant
      })
    }), env, { now: now + index });
    assert.equal(exposure.status, 202);

    if (assignmentBody.variant === "control" && assigned.control <= 2) {
      const conversion = await handleRequest(new Request(`${base}/api/cro/experiments/conversion`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-outrec-ab-test-mode-token": "ab-secret"
        },
        body: JSON.stringify({
          experiment_id: "qa-control-vs-control",
          run_id: "run-001",
          session_id: sessionId,
          variant: assignmentBody.variant,
          conversion_name: "quote_submit"
        })
      }), env, { now: now + index });
      assert.equal(conversion.status, 202);
    }
  }

  assert.equal(assigned.control, 50);
  assert.equal(assigned.treatment, 50);

  const summary = await handleRequest(new Request(`${base}/api/cro/experiments/summary?experiment_id=qa-control-vs-control&run_id=run-001`, {
    headers: { authorization: "Bearer ab-secret" }
  }), env, { now });
  const summaryBody = await summary.json();

  assert.equal(summary.status, 200);
  assert.equal(summaryBody.ok, true);
  assert.equal(summaryBody.route, "/api/cro/experiments/summary");
  assert.equal(summaryBody.totals.assignments, 100);
  assert.equal(summaryBody.totals.exposures, 100);
  assert.equal(summaryBody.totals.conversions, 2);
  assert.deepEqual(summaryBody.variants, [
    {
      variant: "control",
      assignments: 50,
      exposures: 50,
      conversions: 2,
      conversion_rate: 0.04
    },
    {
      variant: "treatment",
      assignments: 50,
      exposures: 50,
      conversions: 0,
      conversion_rate: 0
    }
  ]);
});

test("Vallely widget chat lead route accepts and deduplicates lead capture", async () => {
  const env = { OUTREC_KV: new MemoryKv(), OUTREC_CRM_LEAD_INTAKE_URL: "https://crm.test/leads" };
  const previousFetch = globalThis.fetch;
  const crmRequests = [];
  globalThis.fetch = async (url, init) => {
    crmRequests.push({
      url: String(url),
      idempotencyKey: init.headers["idempotency-key"],
      body: JSON.parse(init.body)
    });
    return Response.json({ lead_id: "dp360-chat-qa-001" }, { status: 201 });
  };
  const now = Date.parse("2026-05-26T18:18:03.535Z");

  try {
    const request = new Request("https://ai.outrec.com/api/chat/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "qa-regression-OUT-35734-2026-05-26T18-18-03-535Z"
      },
      body: JSON.stringify({
        conversation_id: "vallely-widget-qa-conversation",
        customer_name: "QA Lead",
        phone: "701-555-0100",
        email: "qa@example.com",
        message: "Please contact me about a boat.",
        source: "qa-out-35734",
        source_id: "vallely-sales",
        surface: "Vallely widget lead capture"
      })
    });

    const response = await handleRequest(request, env, { now });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    assert.equal(body.ok, true);
    assert.equal(body.crm_id, "dp360-chat-qa-001");
    assert.equal(body.idempotency_key, "qa-regression-OUT-35734-2026-05-26T18-18-03-535Z");
    assert.equal(body.status, "delivered");
    assert.equal(crmRequests.length, 1);
    assert.equal(crmRequests[0].url, "https://crm.test/leads");
    assert.equal(crmRequests[0].idempotencyKey, "qa-regression-OUT-35734-2026-05-26T18-18-03-535Z");

    const lead = await findKvJson(env.OUTREC_KV, "chat_lead:");
    assert.equal(lead.status, "delivered");
    assert.equal(lead.crm_id, "dp360-chat-qa-001");
    assert.equal(lead.source_id, "vallely-sales");
    assert.equal(lead.contact.email, "qa@example.com");

    const duplicate = await handleRequest(new Request("https://ai.outrec.com/api/chat/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "qa-regression-OUT-35734-2026-05-26T18-18-03-535Z"
      },
      body: JSON.stringify({
        conversation_id: "vallely-widget-qa-conversation",
        customer_name: "QA Lead",
        phone: "701-555-0100"
      })
    }), env, { now });
    const duplicateBody = await duplicate.json();

    assert.equal(duplicate.status, 200);
    assert.equal(duplicateBody.ok, true);
    assert.equal(duplicateBody.duplicate, true);
    assert.equal(duplicateBody.lead_id, body.lead_id);
    assert.equal(crmRequests.length, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Vallely widget chat start route returns a session envelope instead of 404", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const response = await handleRequest(new Request("https://ai.outrec.com/api/chat/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ conversation_id: "widget-conversation-001" })
  }), env, { now: Date.parse("2026-06-04T15:00:00.000Z") });
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(body.ok, true);
  assert.equal(body.conversation_id, "widget-conversation-001");
  assert.equal(body.conversationId, "widget-conversation-001");
  assert.match(body.session_id, /^outrec_chat_session_/);
  assert.equal(body.sessionId, body.session_id);
});

test("Vallely widget chat message route uses lead delivery instead of 404", async () => {
  const env = { OUTREC_KV: new MemoryKv(), OUTREC_CRM_LEAD_INTAKE_URL: "https://crm.test/leads" };
  const previousFetch = globalThis.fetch;
  const crmRequests = [];
  globalThis.fetch = async (url, init) => {
    crmRequests.push({
      url: String(url),
      idempotencyKey: init.headers["idempotency-key"],
      body: JSON.parse(init.body)
    });
    return Response.json({ lead_id: "dp360-chat-message-001" }, { status: 201 });
  };

  try {
    const response = await handleRequest(new Request("https://ai.outrec.com/api/chat/message", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "widget-message-001"
      },
      body: JSON.stringify({
        conversation_id: "widget-conversation-001",
        customer_name: "QA Lead",
        phone: "701-555-0100",
        message: "Please have sales contact me."
      })
    }), env, { now: Date.parse("2026-06-04T15:01:00.000Z") });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.crm_id, "dp360-chat-message-001");
    assert.equal(body.idempotency_key, "widget-message-001");
    assert.equal(crmRequests.length, 1);
    assert.equal(crmRequests[0].url, "https://crm.test/leads");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Vallely widget bare chat route uses lead delivery instead of 404", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const response = await handleRequest(new Request("https://ai.outrec.com/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "bare-chat-001"
    },
    body: JSON.stringify({
      conversation_id: "bare-chat-conversation",
      customer_name: "QA Lead",
      phone: "701-555-0100"
    })
  }), env, { now: Date.parse("2026-06-04T15:02:00.000Z") });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(body.ok, true);
  assert.equal(body.status, "queued");
  assert.equal(body.queued, true);
  assert.equal(body.idempotency_key, "bare-chat-001");
});

test("Vallely widget chat lead route suppresses same-session duplicate contact within 60 seconds", async () => {
  const env = { OUTREC_KV: new MemoryKv(), OUTREC_CRM_LEAD_INTAKE_URL: "https://crm.test/leads" };
  const previousFetch = globalThis.fetch;
  const crmRequests = [];
  globalThis.fetch = async (url, init) => {
    crmRequests.push({
      url: String(url),
      idempotencyKey: init.headers["idempotency-key"],
      body: JSON.parse(init.body)
    });
    if (crmRequests.length > 1) {
      return Response.json({ error: "duplicate should not be posted" }, { status: 502 });
    }
    return Response.json({ lead_id: "dp360-chat-session-001" }, { status: 201 });
  };

  try {
    const first = await handleRequest(new Request("https://ai.outrec.com/api/chat/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "qa-lead-alert-first"
      },
      body: JSON.stringify({
        lead_id: "chatbot-15e658a2-f823-46ee-9070-e7b9fb86c952",
        customer_name: "QA Leadalert 20260602180922",
        phone: "7015550137",
        email: "qa-leadalert-20260602180922@example.com",
        message: "OUT-40748 synthetic live lead-alert regression marker"
      })
    }), env, { now: Date.parse("2026-06-02T18:09:43.193Z") });
    const firstBody = await first.json();

    const duplicate = await handleRequest(new Request("https://ai.outrec.com/api/chat/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "qa-lead-alert-second"
      },
      body: JSON.stringify({
        lead_id: "chatbot-15e658a2-f823-46ee-9070-e7b9fb86c952",
        customer_name: "QA Leadalert 20260602180922",
        phone: "(701) 555-0137",
        email: "QA-LEADALERT-20260602180922@example.com",
        message: "OUT-40748 synthetic live lead-alert regression marker duplicate click"
      })
    }), env, { now: Date.parse("2026-06-02T18:10:10.903Z") });
    const duplicateBody = await duplicate.json();

    assert.equal(first.status, 201);
    assert.equal(duplicate.status, 200);
    assert.equal(duplicateBody.ok, true);
    assert.equal(duplicateBody.duplicate, true);
    assert.equal(duplicateBody.lead_id, firstBody.lead_id);
    assert.equal(duplicateBody.crm_id, "dp360-chat-session-001");
    assert.equal(duplicateBody.idempotency_key, "qa-lead-alert-first");
    assert.equal(crmRequests.length, 1);

    const page = await env.OUTREC_KV.list({ prefix: "chat_lead:" });
    assert.equal(page.keys.length, 1);
  } finally {
    globalThis.fetch = previousFetch;
  }
});

test("Vallely widget chat lead route queues lead when stable CRM writer is not configured", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const response = await handleRequest(new Request("https://ai.outrec.com/api/chat/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "missing-writer"
    },
    body: JSON.stringify({
      conversation_id: "missing-writer",
      customer_name: "QA Lead",
      phone: "701-555-0100"
    })
  }), env, { now: Date.parse("2026-05-26T18:18:03.535Z") });
  const body = await response.json();

  assert.equal(response.status, 202);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(body.ok, true);
  assert.equal(body.status, "queued");
  assert.equal(body.queued, true);

  const lead = await findKvJson(env.OUTREC_KV, "chat_lead:");
  assert.equal(lead.status, "queued");
  assert.equal(lead.delivery_target, "outrec_kv_queue");

  const duplicate = await handleRequest(new Request("https://ai.outrec.com/api/chat/lead", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "missing-writer"
    },
    body: JSON.stringify({
      conversation_id: "missing-writer",
      customer_name: "QA Lead",
      phone: "701-555-0100"
    })
  }), env, { now: Date.parse("2026-05-26T18:18:04.535Z") });
  const duplicateBody = await duplicate.json();

  assert.equal(duplicate.status, 200);
  assert.equal(duplicateBody.ok, true);
  assert.equal(duplicateBody.duplicate, true);
  assert.equal(duplicateBody.status, "queued");
  assert.equal(duplicateBody.lead_id, body.lead_id);
});

test("Vallely widget chat lead route writes directly to configured DP360 API", async () => {
  const env = {
    OUTREC_KV: new MemoryKv(),
    DP360_API_TOKEN: "dp360-token",
    DP360_DEALER_ID: "5000",
    DP360_API_BASE_URL: "https://dp360.test"
  };
  const previousFetch = globalThis.fetch;
  const crmRequests = [];
  globalThis.fetch = async (url, init) => {
    crmRequests.push({
      url: String(url),
      headers: init.headers,
      body: JSON.parse(init.body)
    });
    return Response.json({ id: 98765 }, { status: 201 });
  };

  try {
    const response = await handleRequest(new Request("https://ai.outrec.com/api/chat/lead", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": "dp360-direct"
      },
      body: JSON.stringify({
        conversation_id: "dp360-direct-conversation",
        customer_name: "QA Lead",
        phone: "701-555-0100",
        email: "qa@example.com",
        message: "Please contact me.",
        source_id: "vallely-sales"
      })
    }), env, { now: Date.parse("2026-05-26T18:18:03.535Z") });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.crm_id, "98765");
    assert.equal(crmRequests[0].url, "https://dp360.test/api/2.0/leads.json");
    assert.equal(crmRequests[0].headers.token, "dp360-token");
    assert.equal(crmRequests[0].headers.DealerId, "5000");
    assert.equal(crmRequests[0].body.lead.lead_type, "Web Lead");
    assert.equal(crmRequests[0].body.lead.contact.email, "qa@example.com");
  } finally {
    globalThis.fetch = previousFetch;
  }
});

class MemoryKv {
  constructor() {
    this.values = new Map();
  }

  async get(key) {
    return this.values.get(key) ?? null;
  }

  async put(key, value) {
    this.values.set(key, value);
  }

  async delete(key) {
    this.values.delete(key);
  }

  async list({ prefix = "", cursor } = {}) {
    const keys = [...this.values.keys()]
      .filter((name) => name.startsWith(prefix))
      .sort()
      .map((name) => ({ name }));
    return { keys, list_complete: true, cursor };
  }
}

async function findKvJson(kv, prefix) {
  const page = await kv.list({ prefix });
  assert.equal(page.keys.length, 1);
  return JSON.parse(await kv.get(page.keys[0].name));
}

async function listKvJson(kv, prefix) {
  const page = await kv.list({ prefix });
  return Promise.all(page.keys.map(async (key) => JSON.parse(await kv.get(key.name))));
}

class MemoryD1 {
  constructor() {
    this.accounts = new Map();
    this.sessions = new Map();
    this.presetRoutes = new Map();
    this.presetRouteFeedback = new Map();
  }

  prepare(sql) {
    return new MemoryD1Statement(this, sql);
  }
}

class MemoryD1Statement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql.replace(/\s+/g, " ").trim();
    this.params = [];
  }

  bind(...params) {
    this.params = params;
    return this;
  }

  async first() {
    if (this.sql.startsWith("SELECT COUNT(*) AS count FROM preset_routes")) {
      return { count: this.db.presetRoutes.size };
    }
    if (this.sql.startsWith("SELECT * FROM preset_routes WHERE id = ?")) {
      return this.db.presetRoutes.get(this.params[0]) ?? null;
    }
    if (this.sql.startsWith("SELECT * FROM preset_route_feedback WHERE account_id = ? AND route_id = ?")) {
      return this.db.presetRouteFeedback.get(`${this.params[0]}:${this.params[1]}`) ?? null;
    }
    if (this.sql.startsWith("SELECT * FROM accounts WHERE email = ?")) {
      return [...this.db.accounts.values()].find((row) => row.email === this.params[0]) ?? null;
    }
    if (this.sql.startsWith("SELECT * FROM accounts WHERE id = ?")) {
      return this.db.accounts.get(this.params[0]) ?? null;
    }
    if (this.sql.startsWith("SELECT * FROM account_sessions WHERE access_token = ?")) {
      return [...this.db.sessions.values()].find((row) => row.access_token === this.params[0]) ?? null;
    }
    if (this.sql.startsWith("SELECT * FROM account_sessions WHERE refresh_token = ?")) {
      return [...this.db.sessions.values()].find((row) => row.refresh_token === this.params[0]) ?? null;
    }
    throw new Error(`Unhandled first SQL: ${this.sql}`);
  }

  async all() {
    if (this.sql.startsWith("SELECT * FROM preset_routes WHERE launch_region = ?")) {
      return {
        results: [...this.db.presetRoutes.values()]
          .filter((row) => row.launch_region === this.params[0])
          .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
      };
    }
    if (this.sql.startsWith("SELECT * FROM preset_routes ORDER BY launch_region")) {
      return {
        results: [...this.db.presetRoutes.values()].sort(
          (a, b) => a.launch_region.localeCompare(b.launch_region) || a.sort_order - b.sort_order || a.id.localeCompare(b.id)
        )
      };
    }
    if (this.sql.startsWith("SELECT f.account_id")) {
      return {
        results: [...this.db.presetRouteFeedback.values()]
          .map((feedback) => {
            const route = this.db.presetRoutes.get(feedback.route_id);
            const account = this.db.accounts.get(feedback.account_id);
            return {
              ...feedback,
              email: account?.email ?? null,
              launch_region: route?.launch_region ?? null,
              name: route?.name ?? null,
              distance_km: route?.distance_km ?? null,
              curvy_score: route?.curvy_score ?? null,
              scenic_score: route?.scenic_score ?? null,
              elevation_gain_m: route?.elevation_gain_m ?? null
            };
          })
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at) || a.route_id.localeCompare(b.route_id))
      };
    }
    if (this.sql.startsWith("SELECT * FROM account_sessions WHERE account_id = ?")) {
      return {
        results: [...this.db.sessions.values()].filter((row) => row.account_id === this.params[0])
      };
    }
    throw new Error(`Unhandled all SQL: ${this.sql}`);
  }

  async run() {
    if (this.sql.startsWith("INSERT INTO preset_routes")) {
      const [
        id,
        launch_region,
        name,
        geometry_json,
        distance_km,
        curvy_score,
        scenic_score,
        elevation_gain_m,
        metadata_json,
        sort_order,
        created_at,
        updated_at
      ] = this.params;
      const existing = this.db.presetRoutes.get(id);
      this.db.presetRoutes.set(id, {
        id,
        launch_region,
        name,
        geometry_json,
        distance_km,
        curvy_score,
        scenic_score,
        elevation_gain_m,
        metadata_json,
        sort_order,
        created_at: existing?.created_at ?? created_at,
        updated_at
      });
      return { meta: { changes: 1 } };
    }

    if (this.sql.startsWith("INSERT INTO preset_route_feedback")) {
      const [
        account_id,
        route_id,
        ride_id,
        rating,
        liked_feedback,
        disliked_feedback,
        feedback_text,
        visibility,
        created_at,
        updated_at
      ] = this.params;
      const key = `${account_id}:${route_id}`;
      const existing = this.db.presetRouteFeedback.get(key);
      this.db.presetRouteFeedback.set(key, {
        account_id,
        route_id,
        ride_id,
        rating,
        liked_feedback,
        disliked_feedback,
        feedback_text,
        visibility,
        created_at: existing?.created_at ?? created_at,
        updated_at
      });
      return { meta: { changes: 1 } };
    }

    if (this.sql.startsWith("INSERT INTO accounts")) {
      const [
        id,
        email,
        phone,
        password_hash,
        status,
        vin,
        email_verified_at,
        phone_verified_at,
        vin_verified_at,
        created_at,
        updated_at
      ] = this.params;
      const existing = this.db.accounts.get(id);
      this.db.accounts.set(id, {
        id,
        email,
        phone,
        password_hash,
        status,
        vin,
        email_verified_at,
        phone_verified_at,
        vin_verified_at,
        created_at: existing?.created_at ?? created_at,
        updated_at
      });
      return { meta: { changes: existing ? 0 : 1 } };
    }

    if (this.sql.startsWith("UPDATE accounts SET updated_at = ? WHERE id = ?")) {
      const [updated_at, id] = this.params;
      const account = this.db.accounts.get(id);
      if (account) account.updated_at = updated_at;
      return { meta: { changes: account ? 1 : 0 } };
    }

    if (this.sql.startsWith("INSERT INTO account_sessions")) {
      const [
        account_id,
        device_id,
        device_name,
        access_token,
        refresh_token,
        expires_at,
        refresh_expires_at,
        created_at,
        updated_at
      ] = this.params;
      const key = `${account_id}:${device_id}`;
      const existing = this.db.sessions.get(key);
      this.db.sessions.set(key, {
        account_id,
        device_id,
        device_name,
        access_token,
        refresh_token,
        expires_at,
        refresh_expires_at,
        created_at: existing?.created_at ?? created_at,
        updated_at,
        revoked_at: null
      });
      return { meta: { changes: 1 } };
    }

    if (this.sql.startsWith("UPDATE account_sessions SET revoked_at = ?")) {
      const [revoked_at, updated_at, account_id, device_id] = this.params;
      const session = this.db.sessions.get(`${account_id}:${device_id}`);
      if (session) {
        session.revoked_at = revoked_at;
        session.updated_at = updated_at;
      }
      return { meta: { changes: session ? 1 : 0 } };
    }

    if (this.sql.startsWith("DELETE FROM account_sessions WHERE account_id = ?")) {
      let changes = 0;
      for (const [key, session] of this.db.sessions) {
        if (session.account_id === this.params[0]) {
          this.db.sessions.delete(key);
          changes += 1;
        }
      }
      return { meta: { changes } };
    }

    if (this.sql.startsWith("DELETE FROM accounts WHERE id = ?")) {
      const changes = this.db.accounts.delete(this.params[0]) ? 1 : 0;
      return { meta: { changes } };
    }

    throw new Error(`Unhandled run SQL: ${this.sql}`);
  }
}

function authEnv() {
  return {
    OUTREC_AI_JWT_SIGNING_KEY: "ai-ops-test-secret",
    OUTREC_KV: new MemoryKv(),
    OUTREC_AUTH_DB: new MemoryD1()
  };
}

async function signTestJwt(aud, key, issuedAt) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    aud,
    sub: `${aud}-account`,
    deviceId: `${aud}-device`,
    iat: Math.floor(issuedAt / 1000),
    exp: Math.floor(issuedAt / 1000) + 900
  };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(unsigned));
  return `${unsigned}.${Buffer.from(signature).toString("base64url")}`;
}

function base64UrlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

const base = "https://worker.test";

test("dashboard DP360 inventory search serves fresh refreshed cache metadata", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-25T18:30:00.000Z");
  await env.OUTREC_KV.put("inventory:vallely:latest", JSON.stringify({
    summary: { generatedAt: "2026-05-25T18:11:56.058Z", totalListings: 1 },
    listings: [
      {
        id: "18764893",
        stockNumber: "XU11740",
        title: "2026 Polaris Ranger Crew XD 1500 NorthStar Ultimate",
        inventoryKind: "new",
        year: 2026,
        make: "Polaris",
        model: "Ranger Crew XD 1500",
        location: "Minot ND",
        status: "Available",
        publicPrice: 39999,
        lastUpdatedAt: "2026-05-25"
      }
    ]
  }));

  const response = await handleRequest(
    new Request(`${base}/dashboard/api/dp360/inventory/search`, {
      method: "POST",
      body: JSON.stringify({ query: "ranger", limit: 5 })
    }),
    env,
    { now }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.source, "vallely_inventory_feed_cache");
  assert.equal(body.cacheStatus.status, "healthy");
  assert.equal(body.cacheStatus.cacheKey, "inventory:vallely:latest");
  assert.equal(body.freshness.isStale, false);
  assert.equal(body.total, 1);
  assert.equal(body.results[0].stockNumber, "XU11740");
});

test("production inventory search fails closed when cache misses freshness SLA", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-25T18:30:00.000Z");
  await env.OUTREC_KV.put("inventory:vallely:latest", JSON.stringify({
    summary: { generatedAt: "2026-05-15T16:58:13.861Z", totalListings: 1 },
    listings: [{ id: "old-1", title: "Stale inventory row", status: "Available" }]
  }));

  const response = await handleRequest(
    new Request(`${base}/api/inventory/search?query=stale`),
    env,
    { now }
  );
  const body = await response.json();

  assert.equal(response.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.error, "INVENTORY_CACHE_STALE");
  assert.equal(body.source, "vallely_inventory_feed_cache");
  assert.equal(body.cacheStatus.status, "stale");
  assert.equal(body.cacheStatus.state, "stale");
  assert.equal(body.cacheStatus.scrapedAt, "2026-05-15T16:58:13.861Z");
  assert.equal(body.cacheStatus.listings, 1);
  assert.equal(body.results, undefined);
});

test("activation telemetry accepts and counts first-message and voice-toggle events", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-13T18:00:00.000Z");

  for (const event_name of ["first-message-sent", "voice-toggle-used"]) {
    const response = await handleRequest(
      new Request(`${base}/api/analytics/events`, {
        method: "POST",
        body: JSON.stringify({
          event_name,
          user_id: "out-29271-smoke",
          session_id: "out-29271-prod-smoke",
          ts: new Date(now).toISOString(),
          props: { source: "worker-test" }
        })
      }),
      env,
      { now }
    );
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.event.event_name, event_name);
  }

  const list = await handleRequest(new Request(`${base}/api/analytics/events?since_hours=24`), env, { now });
  const body = await list.json();

  assert.equal(list.status, 200);
  assert.equal(body.counts["first-message-sent"], 1);
  assert.equal(body.counts["voice-toggle-used"], 1);
  assert.equal(body.counts.signup, 0);
});

test("activation telemetry rejects malformed event payloads", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const response = await handleRequest(
    new Request(`${base}/api/analytics/events`, {
      method: "POST",
      body: JSON.stringify({
        event_name: "page-view",
        user_id: "out-29271-smoke",
        session_id: "out-29271-prod-smoke",
        props: {}
      })
    }),
    env
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: "unsupported_event_name" });
});

test("reliability telemetry stores feed-load and playback failure events without PII", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-30T18:00:00.000Z");

  const feedAttempt = await handleRequest(new Request(`${base}/api/reliability/events`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "feed_load",
      timestamp: "2026-05-30T17:55:00.000Z",
      platform: "ios",
      app_version: "2.4.1",
      app_build: "2040107",
      surface: "for-you",
      outcome: "attempt",
      request_id: "req-feed-1"
    })
  }), env, { now });
  const feedFailure = await handleRequest(new Request(`${base}/api/reliability/events`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "feed_load",
      timestamp: "2026-05-30T17:55:01.000Z",
      platform: "ios",
      app_version: "2.4.1",
      app_build: "2040107",
      surface: "for-you",
      outcome: "failure",
      request_id: "req-feed-1",
      error: {
        code: "http 503",
        message: "Feed fetch failed token=secret123 https://example.test/feed"
      }
    })
  }), env, { now });
  const playbackFailure = await handleRequest(new Request(`${base}/api/reliability/events`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "video_playback",
      timestamp: "2026-05-30T17:56:00.000Z",
      platform: "android",
      app_version: "2.4.1",
      app_build: "2040108",
      surface: "homepage",
      phase: "initial_play",
      media_id: "short-483",
      outcome: "failure",
      request_id: "req-video-1",
      error_code: "decoder_timeout",
      error_message: "Decoder timed out after 5s password=hunter2"
    })
  }), env, { now });

  assert.equal(feedAttempt.status, 201);
  assert.equal(feedFailure.status, 201);
  assert.equal(playbackFailure.status, 201);

  const stored = await listKvJson(env.OUTREC_KV, "reliability_event:");
  assert.equal(stored.length, 3);
  const failedFeed = stored.find((event) => event.event_type === "feed_load" && event.outcome === "failure");
  assert.equal(failedFeed.phase, "feed_load");
  assert.equal(failedFeed.error.code, "HTTP_503");
  assert.equal(failedFeed.error.message.includes("secret123"), false);
  assert.equal(failedFeed.error.message.includes("https://example.test"), false);

  const summary = await handleRequest(new Request(`${base}/api/reliability/summary?since_hours=168`), env, { now });
  const body = await summary.json();

  assert.equal(summary.status, 200);
  assert.equal(body.attempts, 3);
  assert.equal(body.failures, 2);
  assert.equal(body.failureRate, 0.6667);
  assert.equal(body.segments["ios|for-you|feed_load"].attempts, 2);
  assert.equal(body.segments["ios|for-you|feed_load"].failures, 1);
  assert.equal(body.topFingerprints.length, 2);
  assert.equal(body.topFingerprints[0].count, 1);
});

test("reliability telemetry accepts mobile alias field naming", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-30T18:30:00.000Z");

  const feedLoadFromMobile = await handleRequest(new Request(`${base}/api/reliability/events`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "feed-load",
      timestamp: "2026-05-30T18:30:00.000Z",
      platform: "android",
      app_version: "2.4.2",
      app_build: "2040201",
      surface: "for_you",
      outcome: "attempt",
      request_id: "req-feed-mobile-1"
    })
  }), env, { now });
  const playbackFailureFromMobile = await handleRequest(new Request(`${base}/api/reliability/events`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "video-playback",
      timestamp: "2026-05-30T18:30:10.000Z",
      platform: "ios",
      app_version: "2.4.2",
      app_build: "2040201",
      surface: "home_screen",
      phase: "initial-play",
      media_id: "short-901",
      outcome: "failure",
      request_id: "req-video-mobile-1",
      error: {
        code: "decoder_timeout",
        message: "Decoder stalled after 2s"
      }
    })
  }), env, { now });

  assert.equal(feedLoadFromMobile.status, 201);
  assert.equal(playbackFailureFromMobile.status, 201);

  const stored = await listKvJson(env.OUTREC_KV, "reliability_event:");
  assert.equal(stored.length, 2);
  const feedLoadEvent = stored.find((event) => event.event_type === "feed_load");
  const playbackEvent = stored.find((event) => event.event_type === "video_playback");
  assert.equal(feedLoadEvent.surface, "for-you");
  assert.equal(playbackEvent.phase, "initial_play");
  assert.equal(playbackEvent.error.code, "DECODER_TIMEOUT");
});

test("reliability telemetry rejects invalid contract values", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const response = await handleRequest(new Request(`${base}/api/reliability/events`, {
    method: "POST",
    body: JSON.stringify({
      event_type: "video_playback",
      timestamp: "not-a-date",
      platform: "windows-phone",
      surface: "profile",
      phase: "buffering",
      outcome: "failure",
      error_code: "timeout"
    })
  }), env);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error, "invalid_reliability_event");
  assert.deepEqual(body.details.platform, ["ios", "android", "web"]);
  assert.deepEqual(body.details.surface, ["homepage", "for-you", "category"]);
  assert.deepEqual(body.details.phase, ["initial_play", "mid_stream_stall", "post_roll"]);
  assert.equal(body.details.media_id, "required for video_playback events");
  assert.equal(body.details.timestamp, "valid ISO timestamp required");
});

test("outrec auth signup returns account progress instead of worker failure", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const signup = await handleRequest(
    new Request(`${base}/api/outrec/auth/signup`, {
      method: "POST",
      body: JSON.stringify({
        email: "new-rider@outrec.local",
        phone: "+17015550101",
        password: "OUTREC-QA-2026!",
        deviceName: "QA device"
      })
    }),
    env,
    { now }
  );
  const body = await signup.json();

  assert.equal(signup.status, 201);
  assert.equal(body.email, "new-rider@outrec.local");
  assert.equal(body.status, "pending_verification");
  assert.deepEqual(body.requirements, ["email_verification", "phone_verification", "vin_verification"]);
  assert.ok(body.accountId);
  assert.ok(body.deviceId);
  assert.equal(await env.OUTREC_KV.get(`auth_account:${body.accountId}`), null);
  assert.equal(await env.OUTREC_KV.get("auth_email:new-rider@outrec.local"), null);
});

test("outrec auth signup rejects duplicate D1 email rows", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");
  const requestBody = {
    email: "duplicate-rider@outrec.local",
    phone: "+17015550103",
    password: "OUTREC-QA-2026!",
    deviceName: "QA device"
  };

  const first = await handleRequest(
    new Request(`${base}/api/outrec/auth/signup`, {
      method: "POST",
      body: JSON.stringify(requestBody)
    }),
    env,
    { now }
  );
  const duplicate = await handleRequest(
    new Request(`${base}/api/outrec/auth/signup`, {
      method: "POST",
      body: JSON.stringify(requestBody)
    }),
    env,
    { now: now + 1000 }
  );
  const body = await duplicate.json();

  assert.equal(first.status, 201);
  assert.equal(duplicate.status, 409);
  assert.deepEqual(body, { error: "account_already_exists" });
});

test("outrec auth signin reads a just-created D1 account", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const signup = await handleRequest(
    new Request(`${base}/api/outrec/auth/signup`, {
      method: "POST",
      body: JSON.stringify({
        email: "read-after-write@outrec.local",
        phone: "+17015550104",
        password: "OUTREC-QA-2026!"
      })
    }),
    env,
    { now }
  );
  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        email: "read-after-write@outrec.local",
        password: "OUTREC-QA-2026!",
        deviceId: "read-after-write-device"
      })
    }),
    env,
    { now: now + 1000 }
  );
  const body = await signin.json();

  assert.equal(signup.status, 201);
  assert.equal(signin.status, 403);
  assert.equal(body.error, "account_incomplete");
  assert.deepEqual(body.requirements, ["email_verification", "phone_verification", "vin_verification"]);
});

test("outrec auth signup catches async storage errors as JSON instead of worker failure", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");
  env.OUTREC_AUTH_DB.prepare = () => {
    throw new Error("simulated d1 write failure");
  };

  const signup = await handleRequest(
    new Request(`${base}/api/outrec/auth/signup`, {
      method: "POST",
      body: JSON.stringify({
        email: "storage-error@outrec.local",
        phone: "+17015550102",
        password: "OUTREC-QA-2026!",
        deviceName: "QA device"
      })
    }),
    env,
    { now }
  );
  const body = await signup.json();

  assert.equal(signup.status, 500);
  assert.deepEqual(body, { error: "internal_error" });
});

test("outrec auth signin accepts seeded QA credentials", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        email: "qa@outrec.local",
        password: "OUTREC-QA-2026!",
        deviceId: "qa-review-device"
      })
    }),
    env,
    { now }
  );
  const body = await signin.json();

  assert.equal(signin.status, 200);
  assert.equal(body.tokenType, "Bearer");
  assert.equal(body.expiresIn, 900);
  assert.equal(body.audience, "ai-ops");
  assert.equal(body.deviceId, "qa-review-device");
  assert.ok(body.accessToken);
  assert.equal(JSON.parse(Buffer.from(body.accessToken.split(".")[1], "base64url").toString("utf8")).aud, "ai-ops");
  assert.ok(body.refreshToken);
  assert.match(signin.headers.get("set-cookie"), /^__Host-ai_session=/);
  assert.equal(env.OUTREC_AUTH_DB.sessions.size, 1);
  assert.equal((await env.OUTREC_KV.list({ prefix: "auth_token:" })).keys.length, 0);
});

test("ai outrec auth rejects rider audience tokens", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");
  const riderToken = await signTestJwt("ride-app", "ride-only-test-secret", now);

  const deleted = await handleRequest(
    new Request(`${base}/api/outrec/auth/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${riderToken}` }
    }),
    env,
    { now: now + 1000 }
  );

  assert.equal(deleted.status, 401);
  assert.deepEqual(await deleted.json(), { error: "unauthorized" });
});

test("group ride create rejects requests without a validated identity", async () => {
  const env = authEnv();
  const response = await handleRequest(
    new Request(`${base}/api/group-ride/create`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ submittedUserId: "dev-bypass-user" })
    }),
    env,
    { now: Date.parse("2026-06-13T06:00:00.000Z") }
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "unauthorized" });
});

test("outrec auth signin repairs pending QA seed account", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  env.OUTREC_AUTH_DB.accounts.set("pending-qa-account", {
    id: "pending-qa-account",
    email: "qa@outrec.local",
    phone: "+17015550999",
    password_hash: "stale",
    status: "pending_verification",
    email_verified_at: null,
    phone_verified_at: null,
    vin_verified_at: null,
    vin: null,
    created_at: "2026-05-10T01:00:00.000Z",
    updated_at: "2026-05-10T01:00:00.000Z"
  });

  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        email: "qa@outrec.local",
        password: "OUTREC-QA-2026!",
        deviceId: "qa-repaired-device"
      })
    }),
    env,
    { now }
  );
  const body = await signin.json();

  assert.equal(signin.status, 200);
  assert.equal(body.tokenType, "Bearer");
  assert.equal(body.deviceId, "qa-repaired-device");
  assert.equal(env.OUTREC_AUTH_DB.accounts.get("qa-edge-account").email, "qa@outrec.local");
});

test("outrec account deletion removes account, indexes, and owned customer data", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        email: "qa@outrec.local",
        password: "OUTREC-QA-2026!",
        deviceId: "qa-delete-device"
      })
    }),
    env,
    { now }
  );
  const authBody = await signin.json();

  await env.OUTREC_KV.put("voice_recording:qa-edge-account:window-1", JSON.stringify({ accountId: "qa-edge-account" }));
  await env.OUTREC_KV.put("transcript:window-1", JSON.stringify({ userId: "qa-edge-account", text: "delete me" }));
  await env.OUTREC_KV.put(
    "activation_event:2026-05-10T03:00:00.000Z:event-1",
    JSON.stringify({ user_id: "qa-edge-account", event_name: "signup" })
  );

  const deleted = await handleRequest(
    new Request(`${base}/api/outrec/auth/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authBody.accessToken}` }
    }),
    env,
    { now: now + 60_000 }
  );
  const body = await deleted.json();

  assert.equal(deleted.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.deleted.accounts, 1);
  assert.equal(body.deleted.emailIndexes, 1);
  assert.equal(body.deleted.authSessions, 1);
  assert.equal(body.deleted.voiceRecordings, 1);
  assert.equal(body.deleted.transcripts, 1);
  assert.equal(body.deleted.activationEvents, 1);
  assert.equal(env.OUTREC_AUTH_DB.accounts.has("qa-edge-account"), false);
  assert.equal(await env.OUTREC_KV.get("auth_account:qa-edge-account"), null);
  assert.equal(await env.OUTREC_KV.get("auth_email:qa@outrec.local"), null);
  assert.equal(await env.OUTREC_KV.get("voice_recording:qa-edge-account:window-1"), null);
  assert.equal(await env.OUTREC_KV.get("transcript:window-1"), null);
});

test("outrec auth refresh rotates the D1 session and signout revokes it", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        email: "qa@outrec.local",
        password: "OUTREC-QA-2026!",
        deviceId: "qa-refresh-device"
      })
    }),
    env,
    { now }
  );
  const signedIn = await signin.json();

  const refreshed = await handleRequest(
    new Request(`${base}/api/outrec/auth/refresh`, {
      method: "POST",
      body: JSON.stringify({ refreshToken: signedIn.refreshToken })
    }),
    env,
    { now: now + 60_000 }
  );
  const refreshBody = await refreshed.json();

  assert.equal(refreshed.status, 200);
  assert.notEqual(refreshBody.accessToken, signedIn.accessToken);
  assert.notEqual(refreshBody.refreshToken, signedIn.refreshToken);
  assert.equal((await env.OUTREC_KV.list({ prefix: "auth_token:" })).keys.length, 0);

  const signedOut = await handleRequest(
    new Request(`${base}/api/outrec/auth/signout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshBody.accessToken}` }
    }),
    env,
    { now: now + 120_000 }
  );

  assert.equal(signedOut.status, 200);
  assert.equal((await signedOut.json()).ok, true);
  assert.equal([...env.OUTREC_AUTH_DB.sessions.values()][0].revoked_at, "2026-05-10T03:02:00.000Z");
});

test("outrec auth rejects expired D1 access sessions", async () => {
  const env = authEnv();
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      body: JSON.stringify({
        email: "qa@outrec.local",
        password: "OUTREC-QA-2026!",
        deviceId: "qa-expired-device"
      })
    }),
    env,
    { now }
  );
  const signedIn = await signin.json();

  const deleted = await handleRequest(
    new Request(`${base}/api/outrec/auth/account`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${signedIn.accessToken}` }
    }),
    env,
    { now: now + 16 * 60 * 1000 }
  );
  const body = await deleted.json();

  assert.equal(signin.status, 200);
  assert.equal(deleted.status, 401);
  assert.deepEqual(body, { error: "unauthorized" });
  assert.equal(env.OUTREC_AUTH_DB.accounts.has("qa-edge-account"), true);
});

test("SEO strategy route returns public JSON without D1 auth dependencies", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const response = await handleRequest(
    new Request(`${base}/api/seo/strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        keyword: "pontoons bismarck nd",
        dealer: "Vallely Sport & Marine"
      })
    }),
    env,
    { now: Date.parse("2026-05-27T06:00:00.000Z") }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(body.ok, true);
  assert.equal(body.keyword, "pontoons bismarck nd");
  assert.equal(body.strategy.title, "Vallely Sport & Marine SEO strategy for pontoons bismarck nd");
  assert.ok(Array.isArray(body.strategy.recommendations));
});

test("SEO strategy route validates requests as JSON", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-27T06:00:00.000Z");

  const response = await handleRequest(
    new Request(`${base}/api/seo/strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dealer: "Vallely Sport & Marine" })
    }),
    env,
    { now: now + 1000 }
  );
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(body.ok, false);
  assert.equal(body.error, "keyword_or_request_required");
});

test("SEO strategy route returns stable strategy JSON", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-27T06:00:00.000Z");

  const response = await handleRequest(
    new Request(`${base}/api/seo/strategy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        keyword: "pontoons bismarck nd",
        dealer: "Vallely Sport & Marine"
      })
    }),
    env,
    { now: now + 1000 }
  );
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
  assert.equal(body.ok, true);
  assert.equal(body.keyword, "pontoons bismarck nd");
  assert.equal(body.dealer, "Vallely Sport & Marine");
  assert.equal(body.strategy.title, "Vallely Sport & Marine SEO strategy for pontoons bismarck nd");
  assert.ok(Array.isArray(body.strategy.recommendations));
  assert.ok(body.strategy.recommendations.length >= 4);
  assert.equal(body.strategy.recommendations[0].priority, "high");
});

test("preset route list seeds launch regions without exposing user feedback", async () => {
  const env = authEnv();
  const response = await handleRequest(new Request(`${base}/api/outrec/routes/presets?region=bismarck-nd`), env, {
    now: Date.parse("2026-05-31T00:00:00.000Z")
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.deepEqual(body.launchRegions, ["bismarck-nd", "minot-nd"]);
  assert.equal(body.routes.length, 25);
  assert.equal(body.routes[0].id, "bismarck-nd-curated-01");
  assert.equal(body.routes[0].launchRegion, "bismarck-nd");
  assert.equal(body.routes[0].geometry.type, "LineString");
  assert.ok(Array.isArray(body.routes[0].geometry.coordinates));
  assert.ok(body.routes[0].metadata.tags.includes("balanced"));
  assert.equal(body.routes[0].feedback, undefined);
});

test("authenticated preset route rating upserts per user and admin export returns label CSV", async () => {
  const env = { ...authEnv(), OUTREC_ADMIN_EXPORT_TOKEN: "admin-export-token" };
  const now = Date.parse("2026-05-31T01:00:00.000Z");

  const signin = await handleRequest(
    new Request(`${base}/api/outrec/auth/signin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "qa@outrec.local", password: "OUTREC-QA-2026!", deviceId: "route-rater" })
    }),
    env,
    { now }
  );
  const session = await signin.json();

  const created = await handleRequest(
    new Request(`${base}/api/outrec/preset-routes/bismarck-nd-curated-01/rating`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({
        rating: 4,
        rideId: "ride-qa-001",
        visibility: "training",
        likedFeedback: "Good curves and river views.",
        dislikedFeedback: "One dull straight segment.",
        feedback: "Use as a positive scenic label with a mild straight-road penalty."
      })
    }),
    env,
    { now: now + 1000 }
  );
  const createdBody = await created.json();

  assert.equal(created.status, 200);
  assert.equal(createdBody.feedback.rating, 4);
  assert.equal(createdBody.feedback.rideId, "ride-qa-001");
  assert.equal(createdBody.feedback.visibility, "training");
  assert.equal(createdBody.feedback.likedFeedback, "Good curves and river views.");
  assert.equal(env.OUTREC_AUTH_DB.presetRouteFeedback.size, 1);

  const updated = await handleRequest(
    new Request(`${base}/api/outrec/preset-routes/bismarck-nd-curated-01/feedback`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ rating: 5, ride_id: "ride-qa-002", liked_feedback: "Better after reride.", disliked_feedback: "" })
    }),
    env,
    { now: now + 2000 }
  );
  const updatedBody = await updated.json();

  assert.equal(updated.status, 200);
  assert.equal(updatedBody.feedback.rating, 5);
  assert.equal(updatedBody.feedback.rideId, "ride-qa-002");
  assert.equal(updatedBody.feedback.likedFeedback, "Better after reride.");
  assert.equal(env.OUTREC_AUTH_DB.presetRouteFeedback.size, 1);

  const shownMetric = await handleRequest(
    new Request(`${base}/api/outrec/preset-routes/bismarck-nd-curated-01/capture-metrics`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({ event: "sheet_shown", rideId: "ride-qa-002", source: "qa" })
    }),
    env,
    { now: now + 2500 }
  );

  const skippedMetric = await handleRequest(
    new Request(`${base}/api/outrec/preset-routes/bismarck-nd-curated-01/capture-metrics`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventName: "sheet-skipped", ride_id: "anonymous-skip", feedback: "must not be persisted" })
    }),
    env,
    { now: now + 2600 }
  );

  assert.equal(shownMetric.status, 201);
  assert.equal(skippedMetric.status, 201);

  const exportResponse = await handleRequest(
    new Request(`${base}/api/outrec/admin/preset-route-feedback/export`, {
      headers: { authorization: "Bearer admin-export-token" }
    }),
    env,
    { now: now + 3000 }
  );
  const csv = await exportResponse.text();

  assert.equal(exportResponse.status, 200);
  assert.equal(exportResponse.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.match(csv, /^account_id,account_email,route_id,launch_region,route_name,/);
  assert.match(csv, /ride_id,rating,stars,liked_feedback/);
  assert.match(csv, /qa@outrec\.local,bismarck-nd-curated-01,bismarck-nd/);
  assert.match(csv, /ride-qa-002,5,5,Better after reride\./);
  assert.match(csv, /Better after reride\./);

  const unauthorizedExport = await handleRequest(
    new Request(`${base}/api/outrec/admin/preset-route-feedback/export`),
    env,
    { now: now + 3500 }
  );

  assert.equal(unauthorizedExport.status, 401);

  const metricsResponse = await handleRequest(
    new Request(`${base}/api/outrec/admin/preset-route-feedback/capture-metrics?since_hours=2`, {
      headers: { "x-admin-token": "admin-export-token" }
    }),
    env,
    { now: now + 4000 }
  );
  const metrics = await metricsResponse.json();

  assert.equal(metricsResponse.status, 200);
  assert.equal(metrics.counts.sheet_shown, 1);
  assert.equal(metrics.counts.sheet_submitted, 2);
  assert.equal(metrics.counts.sheet_skipped, 1);
  assert.equal(metrics.rates.submittedPerShown, 2);
  assert.equal(metrics.rates.skippedPerShown, 1);
  assert.equal(metrics.events.some((event) => Object.hasOwn(event, "feedback")), false);

  const unauthorizedMetrics = await handleRequest(
    new Request(`${base}/api/outrec/admin/preset-route-feedback/capture-metrics`),
    env,
    { now: now + 5000 }
  );

  assert.equal(unauthorizedMetrics.status, 401);
});

test("report and nearby return active hazard metadata", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const report = await handleRequest(
    new Request(`${base}/api/hazards/report`, {
      method: "POST",
      body: JSON.stringify({
        type: "police",
        lat: 46.8083,
        lon: -100.7837,
        source: "voice",
        clientReportId: "voice-1",
        createdByUserId: "rider-1"
      })
    }),
    env,
    { now }
  );

  assert.equal(report.status, 201);
  const reportBody = await report.json();
  assert.equal(reportBody.hazard.type, "police_activity");
  assert.equal(reportBody.hazard.languageSafetyLabel, "Roadway awareness report");
  assert.ok(reportBody.hazard.duplicateSuppressionKey);

  const nearby = await handleRequest(
    new Request(`${base}/api/hazards/nearby?lat=46.8080&lon=-100.7830&radiusM=500`),
    env,
    { now: now + 1000 }
  );
  const nearbyBody = await nearby.json();

  assert.equal(nearby.status, 200);
  assert.equal(nearbyBody.hazards.length, 1);
  assert.equal(nearbyBody.hazards[0].id, reportBody.hazard.id);
  assert.ok(nearbyBody.hazards[0].distanceM < 100);
});

test("confirm extends confidence and clear can deactivate stale reports", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const report = await handleRequest(
    new Request(`${base}/api/hazards/report`, {
      method: "POST",
      body: JSON.stringify({ type: "sand", lat: 46.8, lon: -100.78 })
    }),
    env,
    { now }
  );
  const id = (await report.json()).hazard.id;

  const confirmed = await handleRequest(
    new Request(`${base}/api/hazards/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({ userId: "rider-2" })
    }),
    env,
    { now: now + 60_000 }
  );
  const confirmedBody = await confirmed.json();
  assert.equal(confirmedBody.hazard.confirmations, 1);
  assert.ok(confirmedBody.hazard.confidence > 0.58);

  let clearedBody;
  for (let i = 0; i < 3; i += 1) {
    const cleared = await handleRequest(
      new Request(`${base}/api/hazards/${id}/clear`, {
        method: "POST",
        body: JSON.stringify({ userId: `rider-clear-${i}` })
      }),
      env,
      { now: now + 120_000 + i * 1000 }
    );
    clearedBody = await cleared.json();
  }

  assert.equal(clearedBody.hazard.active, false);
  assert.ok(clearedBody.hazard.nonConfirmations >= 3);
});

test("repeat reports create risk zones", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  for (let i = 0; i < 2; i += 1) {
    await handleRequest(
      new Request(`${base}/api/hazards/report`, {
        method: "POST",
        body: JSON.stringify({
          type: "pothole",
          lat: 46.808 + i * 0.0002,
          lon: -100.783 + i * 0.0002,
          createdByUserId: `rider-${i}`
        })
      }),
      env,
      { now: now + i * 1000 }
    );
  }

  const zones = await handleRequest(
    new Request(`${base}/api/risk-zones?lat=46.808&lon=-100.783&radiusM=1000`),
    env,
    { now: now + 10_000 }
  );
  const zonesBody = await zones.json();

  assert.equal(zones.status, 200);
  assert.equal(zonesBody.riskZones.length, 1);
  assert.equal(zonesBody.riskZones[0].type, "pothole");
  assert.equal(zonesBody.riskZones[0].reportCount, 2);
});

test("coordinate validation and rate limiting reject bad/spam reports", async () => {
  const env = { OUTREC_KV: new MemoryKv() };
  const now = Date.parse("2026-05-10T03:00:00.000Z");

  const bad = await handleRequest(
    new Request(`${base}/api/hazards/report`, {
      method: "POST",
      body: JSON.stringify({ type: "gravel", lat: 181, lon: 0 })
    }),
    env,
    { now }
  );
  assert.equal(bad.status, 400);

  const statuses = [];
  for (let i = 0; i < 7; i += 1) {
    const response = await handleRequest(
      new Request(`${base}/api/hazards/report`, {
        method: "POST",
        headers: { "cf-connecting-ip": "203.0.113.1" },
        body: JSON.stringify({ type: "gravel", lat: 46.8, lon: -100.78 })
      }),
      env,
      { now }
    );
    statuses.push(response.status);
  }

  assert.equal(statuses.filter((status) => status === 201).length, 6);
  assert.equal(statuses.at(-1), 429);
});
