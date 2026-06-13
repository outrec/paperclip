export { GroupRideRoom } from "./GroupRideRoom.js";
export { PresenceRoom } from "./PresenceRoom.js";

const HAZARD_PREFIX = "hazard:";
const HAZARD_EVENT_PREFIX = "hazard_event:";
const RISK_ZONE_PREFIX = "risk_zone:";
const RATE_PREFIX = "rate:";
const DEDUPE_PREFIX = "hazard_dedupe:";
const ACTIVATION_EVENT_PREFIX = "activation_event:";
const VOICE_RECORDING_PREFIX = "voice_recording:";
const TRANSCRIPT_PREFIX = "transcript:";
const CHAT_LEAD_PREFIX = "chat_lead:";
const CHAT_LEAD_EVENT_PREFIX = "chat_lead_event:";
const CHAT_LEAD_DEDUPE_PREFIX = "chat_lead_dedupe:";
const CHAT_LEAD_FINGERPRINT_DEDUPE_PREFIX = "chat_lead_fingerprint_dedupe:";
const CHAT_LEAD_FINGERPRINT_DEDUPE_TTL_SECONDS = 60;
const PRESET_ROUTE_FEEDBACK_METRIC_PREFIX = "preset_route_feedback_metric:";
const RELIABILITY_EVENT_PREFIX = "reliability_event:";
const CRO_EXPERIMENT_EVENT_PREFIX = "cro_experiment_event:";
const CRO_EXPERIMENT_EVENTS_TABLE = "cro_experiment_events";
const GROUP_RIDE_CREATE_SUCCESS_LIMIT = 5;
const GROUP_RIDE_CREATE_ATTEMPT_LIMIT = 20;
const GROUP_RIDE_CREATE_RATE_TTL_SECONDS = 10 * 60;
const INVENTORY_CACHE_KEYS = [
  "inventory:vallely:latest",
  "vallely:inventory:latest",
  "dp360:inventory:latest",
  "vallely_inventory_feed",
  "inventory_feed"
];
const INVENTORY_STALE_AFTER_SECONDS = 24 * 60 * 60;
const BRAND_TRUST_FIXTURE_UPDATED_AT = "2026-06-02T01:22:31.016Z";
const BRAND_TRUST_SEGMENTS = [
  {
    segmentId: "small-single-location",
    segmentLabel: "Small single-location dealer",
    accountScope: "representative synthetic segment",
    dealerDisplayName: "Synthetic North Basin Marine",
    locations: 1,
    reviewSummary: {
      ratingAverage: 4.7,
      reviewCount: 44,
      unansweredCount: 2,
      positiveShare: 0.86,
      negativeShare: 0.05,
      latestReviewAt: "2026-05-31T17:42:00.000Z"
    },
    outboundReviewCta: {
      state: "ready",
      recommendedChannel: "google",
      eligibleAudienceCount: 18,
      suppressionReason: null,
      ctaCopyKey: "post_delivery_review_request"
    }
  },
  {
    segmentId: "mid-two-location",
    segmentLabel: "Mid-size two-location dealer",
    accountScope: "representative synthetic segment",
    dealerDisplayName: "Synthetic Prairie Powersports",
    locations: 2,
    reviewSummary: {
      ratingAverage: 4.4,
      reviewCount: 137,
      unansweredCount: 9,
      positiveShare: 0.78,
      negativeShare: 0.11,
      latestReviewAt: "2026-06-01T13:10:00.000Z"
    },
    outboundReviewCta: {
      state: "needs_review_response",
      recommendedChannel: "google",
      eligibleAudienceCount: 36,
      suppressionReason: "unanswered_negative_review",
      ctaCopyKey: "service_followup_review_request"
    }
  },
  {
    segmentId: "large-multi-location",
    segmentLabel: "Large multi-location dealer group",
    accountScope: "representative synthetic segment",
    dealerDisplayName: "Synthetic Lakeside Dealer Group",
    locations: 5,
    reviewSummary: {
      ratingAverage: 4.2,
      reviewCount: 421,
      unansweredCount: 27,
      positiveShare: 0.72,
      negativeShare: 0.16,
      latestReviewAt: "2026-06-01T20:05:00.000Z"
    },
    outboundReviewCta: {
      state: "ready_with_guardrail",
      recommendedChannel: "facebook",
      eligibleAudienceCount: 74,
      suppressionReason: null,
      ctaCopyKey: "post_service_review_request"
    }
  }
];
const BRAND_TRUST_REVIEWS = [
  {
    id: "google-small-delivery-pontoon",
    segmentId: "small-single-location",
    platform: "google",
    sourcePlatform: "google",
    authorName: "Synthetic Google Reviewer",
    rating: 5,
    sentiment: "positive",
    text: "Delivery was on time and the team walked through every setup step.",
    reviewUrl: "https://example.test/reviews/google-small-delivery-pontoon",
    createdAt: "2026-05-31T17:42:00.000Z",
    updatedAt: "2026-05-31T17:42:00.000Z",
    responseText: "Thanks for choosing us for your delivery walkthrough.",
    responseAt: "2026-05-31T19:15:00.000Z"
  },
  {
    id: "facebook-small-weekend-service",
    segmentId: "small-single-location",
    platform: "facebook",
    sourcePlatform: "facebook",
    authorName: "Synthetic Facebook Reviewer",
    recommendationType: "positive",
    rating: null,
    sentiment: "positive",
    text: "Service got the boat ready before the weekend rush.",
    reviewText: "Service got the boat ready before the weekend rush.",
    permalinkUrl: "https://example.test/reviews/facebook-small-weekend-service",
    createdAt: "2026-05-29T15:18:00.000Z",
    responseText: null,
    responseAt: null
  },
  {
    id: "google-mid-finance-followup",
    segmentId: "mid-two-location",
    platform: "google",
    sourcePlatform: "google",
    authorName: "Synthetic Google Reviewer 2",
    rating: 3,
    sentiment: "mixed",
    text: "Helpful visit, but finance follow-up took longer than expected.",
    reviewUrl: "https://example.test/reviews/google-mid-finance-followup",
    createdAt: "2026-06-01T13:10:00.000Z",
    updatedAt: "2026-06-01T13:10:00.000Z",
    responseText: null,
    responseAt: null
  },
  {
    id: "google-mid-parts-delay",
    segmentId: "mid-two-location",
    platform: "google",
    sourcePlatform: "google",
    authorName: "Synthetic Google Reviewer 3",
    rating: 2,
    sentiment: "negative",
    text: "Parts estimate changed twice and nobody explained the delay.",
    reviewUrl: "https://example.test/reviews/google-mid-parts-delay",
    createdAt: "2026-05-30T21:35:00.000Z",
    updatedAt: "2026-05-30T21:35:00.000Z",
    responseText: null,
    responseAt: null
  },
  {
    id: "facebook-large-service-recommend",
    segmentId: "large-multi-location",
    platform: "facebook",
    sourcePlatform: "facebook",
    authorName: "Synthetic Facebook Reviewer 2",
    recommendationType: "positive",
    rating: null,
    sentiment: "positive",
    text: "The service lane kept the appointment moving and sent clear pickup instructions.",
    reviewText: "The service lane kept the appointment moving and sent clear pickup instructions.",
    permalinkUrl: "https://example.test/reviews/facebook-large-service-recommend",
    createdAt: "2026-06-01T20:05:00.000Z",
    responseText: "We appreciate the recommendation and the service team feedback.",
    responseAt: "2026-06-01T21:20:00.000Z"
  },
  {
    id: "google-large-inventory-callout",
    segmentId: "large-multi-location",
    platform: "google",
    sourcePlatform: "google",
    authorName: "Synthetic Google Reviewer 4",
    rating: 4,
    sentiment: "positive",
    text: "Inventory photos matched the unit we saw, and the rep had pricing ready.",
    reviewUrl: "https://example.test/reviews/google-large-inventory-callout",
    createdAt: "2026-05-31T22:40:00.000Z",
    updatedAt: "2026-05-31T22:40:00.000Z",
    responseText: "Thanks for calling out the inventory detail and pricing handoff.",
    responseAt: "2026-06-01T14:05:00.000Z"
  }
];
const AUTH_QA_EMAIL = "qa@outrec.local";
const AUTH_QA_PASSWORD = "OUTREC-QA-2026!";
const AUTH_QA_ACCOUNT_ID = "qa-edge-account";
const AI_SESSION_COOKIE = "__Host-ai_session";
const AI_JWT_AUDIENCE = "ai-ops";
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const LAUNCH_REGIONS = ["bismarck-nd", "minot-nd"];
const PRESET_ROUTE_SEED_COUNT_PER_REGION = 25;
const PRESET_ROUTE_CAPTURE_EVENTS = new Set(["sheet_shown", "sheet_submitted", "sheet_skipped"]);
const PRESET_ROUTE_VISIBILITY_VALUES = new Set(["private", "training", "public"]);
const ACTIVATION_EVENT_NAMES = new Set(["signup", "first-message-sent", "voice-toggle-used"]);
const RELIABILITY_EVENT_TYPES = new Set(["feed_load", "video_playback"]);
const RELIABILITY_FEED_SURFACES = new Set(["homepage", "for-you", "category"]);
const RELIABILITY_PLAYBACK_PHASES = new Set(["initial_play", "mid_stream_stall", "post_roll"]);
const RELIABILITY_EVENT_TYPE_ALIASES = new Map([
  ["feed-load", "feed_load"],
  ["video-playback", "video_playback"]
]);
const RELIABILITY_SURFACE_ALIASES = new Map([
  ["for_you", "for-you"],
  ["home", "homepage"],
  ["home_screen", "homepage"],
  ["home-screen", "homepage"]
]);
const RELIABILITY_PHASE_ALIASES = new Map([
  ["initial-play", "initial_play"],
  ["mid-stream-stall", "mid_stream_stall"],
  ["post-roll", "post_roll"],
  ["initial_play", "initial_play"]
]);
const RELIABILITY_OUTCOMES = new Set(["attempt", "success", "failure"]);
const RELIABILITY_PLATFORMS = new Set(["ios", "android", "web"]);
const DEFAULT_TEST_EXPERIMENT_ID = "qa_control_vs_control";
const TEST_EXPERIMENT_VARIANTS = ["control", "treatment"];
const EXPERIMENT_AUTH_CODE = "AB_EXPERIMENT_TEST_MODE_TOKEN_REQUIRED";
const EXPERIMENT_VALIDATION_CODE = "AB_EXPERIMENT_VALIDATION_FAILED";

const HAZARD_TYPES = new Set([
  "gravel",
  "pothole",
  "police_activity",
  "sand",
  "debris",
  "ice",
  "water",
  "construction",
  "traffic",
  "animal",
  "other"
]);

const TYPE_TTL_MS = {
  police_activity: 45 * 60 * 1000,
  traffic: 45 * 60 * 1000,
  animal: 60 * 60 * 1000,
  ice: 2 * 60 * 60 * 1000,
  water: 2 * 60 * 60 * 1000,
  construction: 8 * 60 * 60 * 1000,
  gravel: 6 * 60 * 60 * 1000,
  pothole: 24 * 60 * 60 * 1000,
  sand: 6 * 60 * 60 * 1000,
  debris: 4 * 60 * 60 * 1000,
  other: 2 * 60 * 60 * 1000
};

const RISK_ZONE_TYPES = new Set(["gravel", "pothole", "police_activity", "sand", "debris", "ice", "water"]);

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};

export async function handleRequest(request, env, options = {}) {
  const now = options.now ?? Date.now();
  const url = new URL(request.url);
  const apiPath = normalizeApiPath(url.pathname);

  if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
  if (!apiPath) return json({ error: "not_found" }, 404);

  if (request.method === "GET" && apiPath === "/healthz/signup-noop") {
    return json({ ok: true, status: "ok", noop: true, check: "signup-noop" });
  }

  const kv = env.OUTREC_KV;
  if (!kv) return json({ error: "missing_kv_binding", binding: "OUTREC_KV" }, 500);
  const authDb = env.OUTREC_AUTH_DB;

  try {
    if (apiPath.startsWith("/auth/") || apiPath === "/auth/account") {
      if (!authDb) return json({ error: "missing_d1_binding", binding: "OUTREC_AUTH_DB" }, 500);
      if (!aiSigningKey(env)) return json({ error: "missing_secret", binding: "OUTREC_AI_JWT_SIGNING_KEY" }, 500);
    }

    if (request.method === "POST" && apiPath === "/auth/signup") {
      return await signup(request, kv, authDb, now);
    }

    if (request.method === "POST" && apiPath === "/analytics/events") {
      return await createActivationEvent(request, kv, now);
    }

    if (request.method === "GET" && apiPath === "/analytics/events") {
      return await listActivationEvents(url, kv, now);
    }

    if (request.method === "POST" && apiPath === "/reliability/events") {
      return await createReliabilityEvent(request, kv, now);
    }

    if (request.method === "GET" && apiPath === "/reliability/summary") {
      return await reliabilitySummary(url, kv, now);
    }

    if (request.method === "POST" && apiPath === "/chat/start") {
      return await createChatStart(request, now);
    }

    if (
      request.method === "POST" &&
      (apiPath === "/chat" || apiPath === "/chat/lead" || apiPath === "/chat/message")
    ) {
      return await createChatLead(request, env, kv, now);
    }

    if (apiPath === "/cro/experiments") {
      if (request.method === "GET") return croExperiments(env);
    }

    if (apiPath === "/cro/experiments/active") {
      if (request.method === "GET") return croActiveExperiment(env);
    }

    if (request.method === "POST" && apiPath === "/cro/experiments/assign") {
      return await createCroExperimentEvent(request, env, kv, now, "ab_assignment");
    }

    if (
      request.method === "POST" &&
      (apiPath === "/cro/experiments/exposure" || apiPath === "/cro/experiments/expose")
    ) {
      return await createCroExperimentEvent(request, env, kv, now, "ab_exposure");
    }

    if (
      request.method === "POST" &&
      (apiPath === "/cro/experiments/conversion" || apiPath === "/cro/experiments/convert")
    ) {
      return await createCroExperimentEvent(request, env, kv, now, "ab_conversion");
    }

    if (request.method === "GET" && apiPath === "/cro/experiments/summary") {
      return await croExperimentSummary(request, env, kv);
    }

    if (request.method === "POST" && apiPath === "/seo/strategy") {
      return await createSeoStrategy(request, now);
    }

    if (apiPath === "/routes/presets" || apiPath === "/preset-routes") {
      if (!authDb) return json({ error: "missing_d1_binding", binding: "OUTREC_AUTH_DB" }, 500);
      if (request.method === "GET") return await listPresetRoutes(url, authDb, now);
    }

    const presetFeedbackMatch = apiPath.match(/^\/(?:routes\/presets|preset-routes)\/([^/]+)\/(?:feedback|rating)$/);
    if (presetFeedbackMatch && (request.method === "POST" || request.method === "PATCH")) {
      if (!authDb) return json({ error: "missing_d1_binding", binding: "OUTREC_AUTH_DB" }, 500);
      return await upsertPresetRouteFeedback(request, env, kv, authDb, now, presetFeedbackMatch[1]);
    }

    const presetMetricMatch = apiPath.match(/^\/(?:routes\/presets|preset-routes)\/([^/]+)\/capture-metrics$/);
    if (presetMetricMatch && request.method === "POST") {
      if (!authDb) return json({ error: "missing_d1_binding", binding: "OUTREC_AUTH_DB" }, 500);
      return await createPresetRouteCaptureMetric(request, env, kv, authDb, now, presetMetricMatch[1]);
    }

    if (apiPath === "/admin/preset-route-feedback/capture-metrics") {
      if (!authDb) return json({ error: "missing_d1_binding", binding: "OUTREC_AUTH_DB" }, 500);
      if (request.method === "GET") return await presetRouteCaptureMetricsSummary(request, env, kv, authDb, now);
    }

    if (apiPath === "/admin/preset-route-feedback/export") {
      if (!authDb) return json({ error: "missing_d1_binding", binding: "OUTREC_AUTH_DB" }, 500);
      if (request.method === "GET") return await exportPresetRouteFeedback(request, env, authDb, now);
    }

    if (request.method === "POST" && apiPath === "/group-ride/create") {
      return await createGroupRide(request, env, kv, authDb, now);
    }

    if (
      (request.method === "GET" || request.method === "POST") &&
      (apiPath === "/inventory/search" || apiPath === "/dp360/inventory/search")
    ) {
      return await searchInventory(request, url, kv, now);
    }

    if (
      request.method === "GET" &&
      (apiPath === "/inventory/source-health" || apiPath === "/dp360/inventory/source-health")
    ) {
      return await inventorySourceHealth(kv, now);
    }

    if (request.method === "GET" && apiPath === "/brand-trust/reviews") {
      return brandTrustReviews(now);
    }

    if (request.method === "GET" && apiPath === "/brand-trust/source-health") {
      return brandTrustSourceHealth(now);
    }

    if (
      request.method === "GET" &&
      (apiPath === "/brand-trust/review-request" ||
        apiPath === "/brand-trust/review-requests" ||
        apiPath === "/brand-trust/outbound-review-cta")
    ) {
      return brandTrustReviewRequests(now);
    }

    if (request.method === "POST" && apiPath === "/auth/signin") {
      return await signin(request, env, kv, authDb, now);
    }

    if (request.method === "POST" && apiPath === "/auth/refresh") {
      return await refreshAuthSession(request, env, kv, authDb, now);
    }

    if (request.method === "POST" && apiPath === "/auth/signout") {
      return await signout(request, env, kv, authDb, now);
    }

    if (request.method === "DELETE" && apiPath === "/auth/account") {
      return await deleteAccount(request, env, kv, authDb, now);
    }

    if (request.method === "POST" && apiPath === "/hazards/report") {
      return await reportHazard(request, kv, now);
    }

    if (request.method === "GET" && apiPath === "/hazards/nearby") {
      return await nearbyHazards(url, kv, now);
    }

    const confirmMatch = apiPath.match(/^\/hazards\/([^/]+)\/confirm$/);
    if (request.method === "POST" && confirmMatch) {
      return await updateHazardSignal(request, kv, now, confirmMatch[1], "confirm");
    }

    const clearMatch = apiPath.match(/^\/hazards\/([^/]+)\/clear$/);
    if (request.method === "POST" && clearMatch) {
      return await updateHazardSignal(request, kv, now, clearMatch[1], "clear");
    }

    if (request.method === "GET" && apiPath === "/risk-zones") {
      return await nearbyRiskZones(url, kv, now);
    }

    return json({ error: "not_found" }, 404);
  } catch (error) {
    console.error("outrec_hazard_api_error", { message: error?.message, stack: error?.stack });
    return json({ error: "internal_error" }, 500);
  }
}

async function signup(request, kv, db, now) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const phone = normalizeText(body.phone);
  const password = normalizeText(body.password);
  const vin = normalizeText(body.vin).toUpperCase();
  const deviceName = typeof body.deviceName === "string" ? body.deviceName.slice(0, 120) : null;

  if (!email) return json({ error: "bad_request", message: "email is required" }, 400);
  if (!phone) return json({ error: "bad_request", message: "phone is required" }, 400);
  if (!password) return json({ error: "bad_request", message: "password is required" }, 400);

  await ensureQaAccount(db, now);
  if (await findAccountByEmail(db, email)) return json({ error: "account_already_exists" }, 409);

  const accountId = randomId();
  const deviceId = randomId();
  const account = {
    id: accountId,
    email,
    phone,
    passwordHash: await passwordHash(password),
    status: "pending_verification",
    vin: vin || null,
    emailVerifiedAt: null,
    phoneVerifiedAt: null,
    vinVerifiedAt: null,
    createdAt: iso(now),
    updatedAt: iso(now)
  };

  await insertAccount(db, account);
  return json(accountProgress(account, deviceId), 201);
}

function configuredCroExperimentId(env) {
  return normalizeText(env.OUTREC_AB_EXPERIMENT_ID) || DEFAULT_TEST_EXPERIMENT_ID;
}

function configuredCroTestModeToken(env) {
  return normalizeText(env.OUTREC_AB_TEST_MODE_TOKEN);
}

function croExperimentToken(request, url, body) {
  const auth = request.headers.get("authorization") || "";
  const [scheme, bearer] = auth.split(/\s+/);
  if (scheme?.toLowerCase() === "bearer" && bearer) return bearer;
  return normalizeText(request.headers.get("x-outrec-ab-test-mode-token"))
    || normalizeText(request.headers.get("x-ab-test-mode-token"))
    || normalizeText(request.headers.get("x-test-mode-token"))
    || normalizeText(body?.test_mode_token)
    || normalizeText(body?.testModeToken)
    || normalizeText(body?.token)
    || normalizeText(url.searchParams.get("token"));
}

function croExperimentAuthorized(request, env, body = null) {
  const expected = configuredCroTestModeToken(env);
  if (!expected) return true;
  return croExperimentToken(request, new URL(request.url), body) === expected;
}

function croExperimentIdFromBody(body, env) {
  return normalizeText(body.experiment_id)
    || normalizeText(body.experimentId)
    || normalizeText(body.experiment)
    || normalizeText(body.id)
    || configuredCroExperimentId(env);
}

function croExperimentIdFromUrl(url, env) {
  return normalizeText(url.searchParams.get("experiment_id"))
    || normalizeText(url.searchParams.get("experimentId"))
    || normalizeText(url.searchParams.get("experiment"))
    || normalizeText(url.searchParams.get("id"))
    || configuredCroExperimentId(env);
}

function croRunIdFromBody(body) {
  return normalizeText(body.run_id)
    || normalizeText(body.runId)
    || normalizeText(body.harness_run_id)
    || normalizeText(body.harnessRunId)
    || "default";
}

function croRunIdFromUrl(url) {
  return normalizeText(url.searchParams.get("run_id"))
    || normalizeText(url.searchParams.get("runId"))
    || normalizeText(url.searchParams.get("harness_run_id"))
    || normalizeText(url.searchParams.get("harnessRunId"));
}

function croSessionId(body) {
  return normalizeText(body.session_id)
    || normalizeText(body.sessionId)
    || normalizeText(body.visitor_id)
    || normalizeText(body.visitorId)
    || normalizeText(body.anonymous_id)
    || normalizeText(body.anonymousId);
}

function croForcedVariant(body) {
  const variant = normalizeText(body.variant || body.bucket || body.force_variant || body.forceVariant)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return TEST_EXPERIMENT_VARIANTS.includes(variant) ? variant : "";
}

function croResolvedVariant(experimentId, sessionId, body) {
  const forced = croForcedVariant(body);
  if (forced) return forced;
  let hash = 2166136261;
  const input = `${experimentId}:${sessionId}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2 === 0 ? "control" : "treatment";
}

function parseCroOccurredAt(value, now) {
  const raw = normalizeText(value) || iso(now);
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? "" : new Date(parsed).toISOString();
}

function croStableId(prefix, parts) {
  let hash = 2166136261;
  for (const char of parts.join(":")) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function croExperiments(env) {
  return json({
    ok: true,
    mode: "test",
    experiments: [{
      id: configuredCroExperimentId(env),
      name: "QA control-vs-control experiment",
      variants: TEST_EXPERIMENT_VARIANTS,
      safe_noop: true
    }],
    endpoints: {
      assign: "/api/cro/experiments/assign",
      exposure: "/api/cro/experiments/exposure",
      conversion: "/api/cro/experiments/conversion",
      summary: "/api/cro/experiments/summary"
    }
  });
}

function croActiveExperiment(env) {
  return json({
    ok: true,
    mode: "test",
    experiment: {
      id: configuredCroExperimentId(env),
      name: "QA control-vs-control experiment",
      variants: TEST_EXPERIMENT_VARIANTS,
      safe_noop: true
    }
  });
}

async function createCroExperimentEvent(request, env, kv, now, eventType) {
  const url = new URL(request.url);
  const body = await readJson(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ ok: false, error: "experiment event payload must be a JSON object" }, 422);
  }

  const route = eventType === "ab_assignment"
    ? "/api/cro/experiments/assign"
    : eventType === "ab_exposure"
      ? "/api/cro/experiments/exposure"
      : "/api/cro/experiments/conversion";

  if (!croExperimentAuthorized(request, env, body)) {
    return json({
      ok: false,
      error: "A valid A/B test-mode token is required.",
      diagnostics: { code: EXPERIMENT_AUTH_CODE, route }
    }, 401);
  }

  const sessionId = croSessionId(body);
  const occurredAt = parseCroOccurredAt(body.occurred_at || body.occurredAt, now);
  if (!sessionId || !occurredAt) {
    return json({
      ok: false,
      error: "Please fix the highlighted experiment fields.",
      errors: {
        ...(!sessionId ? { session_id: "session_id is required." } : {}),
        ...(!occurredAt ? { occurred_at: "occurred_at must be an ISO-8601 timestamp when provided." } : {})
      },
      diagnostics: { code: EXPERIMENT_VALIDATION_CODE, route }
    }, 422);
  }

  const experimentId = croExperimentIdFromBody(body, env);
  const runId = croRunIdFromBody(body);
  const variant = croResolvedVariant(experimentId, sessionId, body);
  const conversionName = normalizeText(body.conversion_name) || normalizeText(body.conversionName) || normalizeText(body.name);
  const event = {
    event_type: eventType,
    experiment_id: experimentId,
    run_id: runId,
    session_id: sessionId,
    variant,
    occurred_at: occurredAt,
    mode: "test",
    idempotency_key: normalizeText(request.headers.get("idempotency-key"))
      || normalizeText(body.idempotency_key)
      || normalizeText(body.idempotencyKey)
      || croStableId(eventType, [experimentId, runId, sessionId, conversionName || "event"]),
    source_id: normalizeText(body.source_id) || normalizeText(body.sourceId) || "qa-ab-test-harness",
    ...(eventType === "ab_conversion" ? { conversion_name: conversionName || "conversion" } : {}),
    ...(eventType === "ab_exposure" && (normalizeText(body.page_url) || normalizeText(body.pageUrl))
      ? { page_url: normalizeText(body.page_url) || normalizeText(body.pageUrl) }
      : {}),
    ...(eventType === "ab_conversion" && Number.isFinite(Number(body.value))
      ? { value: Number(body.value) }
      : {})
  };

  const storageKey = `${CRO_EXPERIMENT_EVENT_PREFIX}${event.experiment_id}:${event.run_id}:${event.event_type}:${event.occurred_at}:${event.idempotency_key}`;
  await putCroExperimentEvent(env, kv, storageKey, event);
  return json({
    ok: true,
    route,
    experiment_id: experimentId,
    run_id: runId,
    session_id: sessionId,
    variant,
    mode: "test",
    lead_mutation: false
  }, 202);
}

async function croExperimentSummary(request, env, kv) {
  const url = new URL(request.url);
  if (!croExperimentAuthorized(request, env)) {
    return json({
      ok: false,
      error: "A valid A/B test-mode token is required.",
      diagnostics: { code: EXPERIMENT_AUTH_CODE, route: "/api/cro/experiments/summary" }
    }, 401);
  }

  const experimentId = croExperimentIdFromUrl(url, env);
  const runId = croRunIdFromUrl(url);
  const events = (await listCroExperimentEvents(env, kv))
    .filter((event) => event.experiment_id === experimentId && (!runId || event.run_id === runId));
  const summary = buildCroExperimentSummary(events, experimentId, runId);
  return json({
    ok: true,
    route: "/api/cro/experiments/summary",
    ...summary
  });
}

function isKvQuotaError(error) {
  return String(error?.message || error).toLowerCase().includes("kv put() limit exceeded")
    || String(error?.message || error).toLowerCase().includes("kv list() limit exceeded");
}

async function putCroExperimentEvent(env, kv, key, event) {
  try {
    await putJson(kv, key, event);
    return;
  } catch (error) {
    if (!env.OUTREC_AUTH_DB || !isKvQuotaError(error)) throw error;
  }

  await dbRun(
    env.OUTREC_AUTH_DB,
    `INSERT OR REPLACE INTO ${CRO_EXPERIMENT_EVENTS_TABLE} (
      id, experiment_id, run_id, event_type, session_id, variant, occurred_at, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    key,
    event.experiment_id,
    event.run_id,
    event.event_type,
    event.session_id,
    event.variant,
    event.occurred_at,
    JSON.stringify(event),
    event.occurred_at
  );
}

async function listCroExperimentEvents(env, kv) {
  let events = [];
  try {
    events = await listJson(kv, CRO_EXPERIMENT_EVENT_PREFIX);
  } catch (error) {
    if (!env.OUTREC_AUTH_DB || !isKvQuotaError(error)) throw error;
  }

  if (!env.OUTREC_AUTH_DB) return events;

  const rows = await dbAll(
    env.OUTREC_AUTH_DB,
    `SELECT payload_json FROM ${CRO_EXPERIMENT_EVENTS_TABLE} ORDER BY occurred_at ASC`
  );
  const d1Events = rows.map((row) => JSON.parse(row.payload_json)).filter(Boolean);
  const seen = new Set(events.map((event) => event.idempotency_key));
  for (const event of d1Events) {
    if (seen.has(event.idempotency_key)) continue;
    events.push(event);
    seen.add(event.idempotency_key);
  }
  return events;
}

function buildCroExperimentSummary(events, experimentId, runId) {
  const rows = new Map(TEST_EXPERIMENT_VARIANTS.map((variant) => [variant, {
    variant,
    assignments: 0,
    exposures: 0,
    conversions: 0,
    conversion_rate: 0
  }]));
  const seen = {
    assignments: new Set(),
    exposures: new Set(),
    conversions: new Set()
  };

  for (const event of events) {
    const row = rows.get(event.variant);
    if (!row) continue;
    if (event.event_type === "ab_assignment") {
      const key = `${event.variant}:${event.session_id}`;
      if (!seen.assignments.has(key)) {
        row.assignments += 1;
        seen.assignments.add(key);
      }
    } else if (event.event_type === "ab_exposure") {
      const key = `${event.variant}:${event.session_id}`;
      if (!seen.exposures.has(key)) {
        row.exposures += 1;
        seen.exposures.add(key);
      }
    } else if (event.event_type === "ab_conversion") {
      const key = `${event.variant}:${event.session_id}:${event.conversion_name || "conversion"}`;
      if (!seen.conversions.has(key)) {
        row.conversions += 1;
        seen.conversions.add(key);
      }
    }
  }

  const variants = [...rows.values()].map((row) => ({
    ...row,
    conversion_rate: row.exposures > 0 ? row.conversions / row.exposures : 0
  }));
  const control = variants.find((row) => row.variant === "control");
  const treatment = variants.find((row) => row.variant === "treatment");
  return {
    experiment_id: experimentId,
    run_id: runId || null,
    mode: "test",
    variants,
    totals: {
      assignments: variants.reduce((sum, row) => sum + row.assignments, 0),
      exposures: variants.reduce((sum, row) => sum + row.exposures, 0),
      conversions: variants.reduce((sum, row) => sum + row.conversions, 0)
    },
    lift: control?.conversion_rate > 0 ? (treatment.conversion_rate - control.conversion_rate) / control.conversion_rate : 0
  };
}

async function signin(request, env, kv, db, now) {
  const body = await readJson(request);
  const email = normalizeEmail(body.email);
  const password = normalizeText(body.password);
  const requestedDeviceId = normalizeText(body.deviceId);
  const deviceName = typeof body.deviceName === "string" ? body.deviceName.slice(0, 120) : null;

  if (!email || !password) return json({ error: "invalid_credentials" }, 401);

  await ensureQaAccount(db, now);
  const account = await findAccountByEmail(db, email);
  if (!account || account.passwordHash !== (await passwordHash(password))) {
    return json({ error: "invalid_credentials" }, 401);
  }

  const deviceId = requestedDeviceId || randomId();
  account.updatedAt = iso(now);
  await touchAccount(db, account.id, account.updatedAt);

  const requirements = missingAuthRequirements(account);
  if (requirements.length) {
    const response = accountProgress(account, deviceId);
    response.error = "account_incomplete";
    return json(response, 403);
  }

  const accessToken = await signAccessToken(env, account, deviceId, now);
  const refreshToken = randomId().replace(/-/g, "");
  await writeSession(db, account, deviceId, deviceName, accessToken, refreshToken, now);
  return json({
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    audience: AI_JWT_AUDIENCE,
    deviceId,
    session: publicCustomerSession(account, accessToken)
  }, 200, { cookie: sessionCookie(AI_SESSION_COOKIE, accessToken) });
}

async function refreshAuthSession(request, env, kv, db, now) {
  const body = await readJson(request);
  const refreshToken = normalizeText(body.refreshToken);
  if (!refreshToken) return json({ error: "refresh_token_required" }, 400);

  const session = await findSessionByRefreshToken(db, refreshToken);
  if (!session) return json({ error: "invalid_token" }, 401);

  if (Date.parse(session.refreshExpiresAt) <= now || session.revokedAt) {
    return json({ error: "invalid_token" }, 401);
  }

  const account = await findAccountById(db, session.accountId);
  if (!account) return json({ error: "account_not_found" }, 404);

  const accessToken = await signAccessToken(env, account, session.deviceId, now);
  const nextRefreshToken = randomId().replace(/-/g, "");
  await writeSession(db, account, session.deviceId, session.deviceName, accessToken, nextRefreshToken, now);

  return json({
    accessToken,
    refreshToken: nextRefreshToken,
    tokenType: "Bearer",
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    audience: AI_JWT_AUDIENCE,
    deviceId: session.deviceId,
    session: publicCustomerSession(account, accessToken)
  }, 200, { cookie: sessionCookie(AI_SESSION_COOKIE, accessToken) });
}

async function signout(request, env, kv, db, now) {
  const body = await readJson(request);
  const refreshToken = normalizeText(body.refreshToken);
  const auth = await authenticateAccount(request, env, kv, db, now, { allowMissing: Boolean(refreshToken) });
  let session = auth.session;

  if (!session && refreshToken) {
    session = await findSessionByRefreshToken(db, refreshToken);
  }
  if (!session) return json({ error: "invalid_token" }, 401);

  await revokeSession(db, session, iso(now));
  return json({ ok: true }, 200, { cookie: expiredSessionCookie(AI_SESSION_COOKIE) });
}

async function deleteAccount(request, env, kv, db, now) {
  const auth = await authenticateAccount(request, env, kv, db, now);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  const deleted = await deleteAccountData(kv, db, auth.account);
  console.log("account_deleted", { account_id: auth.account.id, deleted });
  return json({ ok: true, accountId: auth.account.id, deleted });
}

async function createActivationEvent(request, kv, now) {
  const body = await readJson(request);
  const eventName = normalizeText(body.event_name);
  const userId = normalizeText(body.user_id);
  const sessionId = normalizeText(body.session_id);
  const ts = normalizeText(body.ts) || iso(now);
  const props = body.props ?? {};

  if (!ACTIVATION_EVENT_NAMES.has(eventName)) return json({ error: "unsupported_event_name" }, 400);
  if (!userId) return json({ error: "user_id_required" }, 400);
  if (!sessionId) return json({ error: "session_id_required" }, 400);
  if (!ts || Number.isNaN(Date.parse(ts))) return json({ error: "invalid_ts" }, 400);
  if (!props || typeof props !== "object" || Array.isArray(props)) return json({ error: "props_must_be_object" }, 400);

  const event = {
    event_name: eventName,
    user_id: userId,
    session_id: sessionId,
    ts: new Date(Date.parse(ts)).toISOString(),
    props
  };
  const key = `${ACTIVATION_EVENT_PREFIX}${event.ts}:${randomId()}`;
  await putJson(kv, key, event);
  console.log("activation_event_received", { event_name: event.event_name, user_id: event.user_id, session_id: event.session_id });
  return json({ ok: true, event }, 201);
}

async function listActivationEvents(url, kv, now) {
  const requestedEventName = normalizeText(url.searchParams.get("event_name"));
  const sinceHours = Number(url.searchParams.get("since_hours") ?? 24);
  const minTs = now - (Number.isFinite(sinceHours) && sinceHours > 0 ? sinceHours : 24) * 60 * 60 * 1000;
  const events = (await listJson(kv, ACTIVATION_EVENT_PREFIX))
    .filter((event) => !requestedEventName || event.event_name === requestedEventName)
    .filter((event) => Date.parse(event.ts) >= minTs)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));
  const counts = Object.fromEntries([...ACTIVATION_EVENT_NAMES].map((eventName) => [eventName, 0]));
  for (const event of events) {
    counts[event.event_name] = (counts[event.event_name] ?? 0) + 1;
  }
  return json({ events, counts, sinceHours: Number.isFinite(sinceHours) && sinceHours > 0 ? sinceHours : 24 });
}

async function createReliabilityEvent(request, kv, now) {
  const validation = parseReliabilityEvent(await readJson(request), now);
  if (!validation.ok) return json({ error: validation.error, details: validation.details }, 400);

  const event = validation.event;
  await putJson(kv, `${RELIABILITY_EVENT_PREFIX}${event.ts}:${event.id}`, event);
  console.log("outrec_reliability_event_received", {
    event_type: event.event_type,
    outcome: event.outcome,
    platform: event.platform,
    surface: event.surface,
    phase: event.phase,
    fingerprint: event.fingerprint
  });
  return json({ ok: true, event }, 201);
}

async function reliabilitySummary(url, kv, now) {
  const sinceHours = boundedNumber(url.searchParams.get("since_hours"), 168, 1, 24 * 14);
  const limit = boundedNumber(url.searchParams.get("limit"), 10, 1, 50);
  const minTs = now - sinceHours * 60 * 60 * 1000;
  const requestedPlatform = normalizeReliabilityEnum(url.searchParams.get("platform"));
  const requestedSurface = normalizeReliabilityEnum(url.searchParams.get("surface"));
  const requestedPhase = normalizeReliabilityEnum(url.searchParams.get("phase"));
  const events = (await listJson(kv, RELIABILITY_EVENT_PREFIX))
    .filter((event) => Date.parse(event.ts) >= minTs)
    .filter((event) => !requestedPlatform || event.platform === requestedPlatform)
    .filter((event) => !requestedSurface || event.surface === requestedSurface)
    .filter((event) => !requestedPhase || event.phase === requestedPhase)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));

  const summary = {
    sinceHours,
    generatedAt: iso(now),
    attempts: 0,
    failures: 0,
    failureRate: 0,
    segments: {},
    topFingerprints: []
  };
  const fingerprints = new Map();

  for (const event of events) {
    const attemptValue = 1;
    const failureValue = event.outcome === "failure" ? 1 : 0;
    summary.attempts += attemptValue;
    summary.failures += failureValue;

    const segmentKey = `${event.platform}|${event.surface}|${event.phase}`;
    const segment = summary.segments[segmentKey] ?? {
      platform: event.platform,
      surface: event.surface,
      phase: event.phase,
      attempts: 0,
      failures: 0,
      failureRate: 0
    };
    segment.attempts += attemptValue;
    segment.failures += failureValue;
    summary.segments[segmentKey] = segment;

    if (failureValue) {
      const fingerprint = event.fingerprint;
      const entry = fingerprints.get(fingerprint) ?? {
        fingerprint,
        event_type: event.event_type,
        platform: event.platform,
        surface: event.surface,
        phase: event.phase,
        error_code: event.error.code,
        error_message: event.error.message,
        count: 0
      };
      entry.count += 1;
      fingerprints.set(fingerprint, entry);
    }
  }

  summary.failureRate = rate(summary.failures, summary.attempts);
  summary.segments = Object.fromEntries(
    Object.entries(summary.segments).map(([key, segment]) => [
      key,
      { ...segment, failureRate: rate(segment.failures, segment.attempts) }
    ])
  );
  summary.topFingerprints = [...fingerprints.values()]
    .sort((a, b) => b.count - a.count || a.fingerprint.localeCompare(b.fingerprint))
    .slice(0, limit);

  return json(summary);
}

function parseReliabilityEvent(body, now) {
  const eventType = normalizeReliabilityEnum(body.event_type ?? body.eventType, RELIABILITY_EVENT_TYPE_ALIASES);
  const platform = normalizeReliabilityEnum(body.platform);
  const surface = normalizeReliabilityEnum(body.surface, RELIABILITY_SURFACE_ALIASES);
  const phase = normalizeReliabilityEnum(body.phase, RELIABILITY_PHASE_ALIASES);
  const outcome = normalizeReliabilityEnum(body.outcome);
  const tsInput = normalizeText(body.timestamp) || normalizeText(body.ts) || iso(now);
  const tsMs = Date.parse(tsInput);
  const error = normalizeReliabilityError(body.error ?? body);

  const details = {};
  if (!RELIABILITY_EVENT_TYPES.has(eventType)) details.event_type = [...RELIABILITY_EVENT_TYPES];
  if (!RELIABILITY_PLATFORMS.has(platform)) details.platform = [...RELIABILITY_PLATFORMS];
  if (!RELIABILITY_FEED_SURFACES.has(surface)) details.surface = [...RELIABILITY_FEED_SURFACES];
  if (!RELIABILITY_OUTCOMES.has(outcome)) details.outcome = [...RELIABILITY_OUTCOMES];
  if (!Number.isFinite(tsMs)) details.timestamp = "valid ISO timestamp required";
  if (eventType === "video_playback" && !RELIABILITY_PLAYBACK_PHASES.has(phase)) {
    details.phase = [...RELIABILITY_PLAYBACK_PHASES];
  }
  if (eventType === "feed_load" && phase && phase !== "feed_load") {
    details.phase = ["feed_load"];
  }
  if (eventType === "video_playback" && !normalizeText(body.media_id ?? body.mediaId)) {
    details.media_id = "required for video_playback events";
  }
  if (outcome === "failure" && !error.code) {
    details.error_code = "required when outcome is failure";
  }

  if (Object.keys(details).length) return { ok: false, error: "invalid_reliability_event", details };

  const normalizedPhase = eventType === "feed_load" ? "feed_load" : phase;
  const event = {
    id: randomId(),
    event_type: eventType,
    ts: new Date(tsMs).toISOString(),
    platform,
    app: {
      version: truncate(body.app_version ?? body.appVersion, 80) || null,
      build: truncate(body.app_build ?? body.appBuild, 80) || null
    },
    surface,
    phase: normalizedPhase,
    media_id: truncate(body.media_id ?? body.mediaId, 120) || null,
    outcome,
    request_id: truncate(body.request_id ?? body.requestId, 120) || null,
    error,
    fingerprint: reliabilityFingerprint(eventType, platform, surface, normalizedPhase, error)
  };

  return { ok: true, event };
}

function normalizeReliabilityError(input) {
  const source = input && typeof input === "object" ? input : {};
  const code = normalizeErrorCode(source.code ?? source.error_code ?? source.errorCode);
  const message = normalizeErrorMessage(source.message ?? source.error_message ?? source.errorMessage);
  return { code, message };
}

function normalizeReliabilityEnum(value, aliases = new Map()) {
  const normalized = normalizeText(value).toLowerCase().replace(/[_\s]+/g, "-");
  if (!normalized) return "";
  return aliases.get(normalized) ?? normalized;
}

function normalizeErrorCode(value) {
  return truncate(normalizeText(value).toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, ""), 80);
}

function normalizeErrorMessage(value) {
  return redactErrorMessage(normalizeText(value).toLowerCase().replace(/\s+/g, " ")).slice(0, 160);
}

function reliabilityFingerprint(eventType, platform, surface, phase, error) {
  return [eventType, platform, surface, phase, error.code || "NO_CODE", error.message || "no_message"].join("|");
}

function rate(failures, attempts) {
  return attempts > 0 ? Number((failures / attempts).toFixed(4)) : 0;
}

function boundedNumber(value, fallback, min, max) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

async function createChatStart(request, now) {
  const body = await readJson(request);
  const conversationId =
    normalizeText(body.conversation_id) ||
    normalizeText(body.conversationId) ||
    normalizeText(body.session_id) ||
    normalizeText(body.sessionId) ||
    `chat_conversation_${safeId(randomId())}`;
  const sessionId = `outrec_chat_session_${stableHash(conversationId)}`;

  return json({
    ok: true,
    conversation_id: conversationId,
    conversationId,
    session_id: sessionId,
    sessionId,
    created_at: iso(now)
  }, 201);
}

async function createChatLead(request, env, kv, now) {
  const body = await readJson(request);
  const leadCorrelationId =
    normalizeText(body.lead_correlation_id) ||
    normalizeText(body.leadCorrelationId) ||
    normalizeText(body.lead_id) ||
    normalizeText(body.leadId) ||
    normalizeText(body.conversation_id) ||
    normalizeText(body.conversationId) ||
    randomId();
  const idempotencyKey =
    normalizeText(request.headers.get("idempotency-key")) ||
    normalizeText(body.idempotency_key) ||
    normalizeText(body.idempotencyKey) ||
    leadCorrelationId;
  const idempotencyDedupeKey = `${CHAT_LEAD_DEDUPE_PREFIX}${safeId(idempotencyKey)}`;
  const existingLeadId = await kv.get(idempotencyDedupeKey);

  if (existingLeadId) {
    const existing = await getJson(kv, `${CHAT_LEAD_PREFIX}${existingLeadId}`);
    if (isReplayableChatLead(existing)) {
      return json({
        ok: true,
        duplicate: true,
        lead_id: existing.id,
        crm_id: existing.crm_id,
        idempotency_key: existing.idempotency_key,
        status: existing.status
      });
    }
  }

  const contact = {
    name: normalizeText(body.customer_name) || normalizeText(body.name),
    phone: normalizeText(body.phone) || normalizeText(body.customer_phone),
    email: normalizeEmail(body.email || body.customer_email),
    message: truncate(normalizeText(body.message) || normalizeText(body.notes) || normalizeText(body.note), 600)
  };
  if (!contact.name || (!contact.phone && !contact.email)) {
    return json({
      ok: false,
      error: "lead_contact_required",
      message: "name and either phone or email are required"
    }, 422);
  }

  const fingerprintDedupeKey = chatLeadFingerprintDedupeKey({ leadCorrelationId, contact });
  const existingFingerprintLeadId = await kv.get(fingerprintDedupeKey);
  if (existingFingerprintLeadId) {
    const existing = await getJson(kv, `${CHAT_LEAD_PREFIX}${existingFingerprintLeadId}`);
    if (isReplayableChatLead(existing)) {
      return json({
        ok: true,
        duplicate: true,
        lead_id: existing.id,
        crm_id: existing.crm_id,
        idempotency_key: existing.idempotency_key,
        status: existing.status
      });
    }
  }

  const leadId = `outrec_chat_lead_${safeId(idempotencyKey) || randomId()}`;
  const lead = {
    id: leadId,
    crm_id: null,
    lead_correlation_id: leadCorrelationId,
    idempotency_key: idempotencyKey,
    surface: truncate(normalizeText(body.surface) || "Vallely widget lead capture", 120),
    source_id: truncate(normalizeText(body.source_id) || normalizeText(body.sourceId) || "vallely-sales", 120),
    source: truncate(normalizeText(body.source) || "ai.outrec.com/widget", 120),
    contact,
    routing: {
      department: truncate(normalizeText(body.department) || "sales", 80),
      dealer: truncate(normalizeText(body.dealer) || "Vallely Sport & Marine", 120)
    },
    created_at: iso(now),
    status: "received"
  };

  await putJson(kv, `${CHAT_LEAD_PREFIX}${lead.id}`, lead);
  await kv.put(idempotencyDedupeKey, lead.id, { expirationTtl: 24 * 60 * 60 });
  await kv.put(fingerprintDedupeKey, lead.id, { expirationTtl: CHAT_LEAD_FINGERPRINT_DEDUPE_TTL_SECONDS });
  await putJson(kv, `${CHAT_LEAD_EVENT_PREFIX}${iso(now)}:${lead.id}`, {
    event_type: "capture",
    lead_id: lead.id,
    lead_correlation_id: lead.lead_correlation_id,
    idempotency_key: lead.idempotency_key,
    surface: lead.surface,
    source_id: lead.source_id,
    occurred_at: lead.created_at,
    status: "ok"
  });
  await putJson(kv, `${CHAT_LEAD_EVENT_PREFIX}${iso(now + 1)}:${lead.id}`, {
    event_type: "crm_request",
    lead_id: lead.id,
    lead_correlation_id: lead.lead_correlation_id,
    idempotency_key: lead.idempotency_key,
    surface: lead.surface,
    source_id: lead.source_id,
    occurred_at: iso(now + 1),
    status: "ok"
  });

  try {
    const crmResult = await postChatLeadToCrm(env, lead);
    const delivered = {
      ...lead,
      crm_id: crmResult.crmId,
      status: "delivered",
      delivered_at: iso(now + 2),
      delivery_target: crmResult.target
    };
    await putJson(kv, `${CHAT_LEAD_PREFIX}${lead.id}`, delivered);
    await putJson(kv, `${CHAT_LEAD_EVENT_PREFIX}${iso(now + 2)}:${lead.id}`, {
      event_type: "crm_ack",
      lead_id: lead.id,
      lead_correlation_id: lead.lead_correlation_id,
      idempotency_key: lead.idempotency_key,
      surface: lead.surface,
      source_id: lead.source_id,
      occurred_at: iso(now + 2),
      status: "ok",
      crm_id: crmResult.crmId,
      delivery_target: crmResult.target
    });
    await kv.put(idempotencyDedupeKey, lead.id, { expirationTtl: 24 * 60 * 60 });
    await kv.put(fingerprintDedupeKey, lead.id, { expirationTtl: CHAT_LEAD_FINGERPRINT_DEDUPE_TTL_SECONDS });

    return json({
      ok: true,
      lead_id: lead.id,
      crm_id: crmResult.crmId,
      idempotency_key: lead.idempotency_key,
      status: delivered.status
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "CRM lead delivery failed";
    const queued = {
      ...lead,
      status: "queued",
      queued_at: iso(now + 2),
      delivery_target: "outrec_kv_queue",
      redacted_error: {
        code: "CRM_LEAD_INTAKE_FAILED",
        message: redactErrorMessage(message)
      }
    };
    await putJson(kv, `${CHAT_LEAD_PREFIX}${lead.id}`, queued);
    await putJson(kv, `${CHAT_LEAD_EVENT_PREFIX}${iso(now + 2)}:${lead.id}`, {
      event_type: "crm_failure",
      lead_id: lead.id,
      lead_correlation_id: lead.lead_correlation_id,
      idempotency_key: lead.idempotency_key,
      surface: lead.surface,
      source_id: lead.source_id,
      occurred_at: iso(now + 2),
      status: "failed",
      redacted_error: {
        code: "CRM_LEAD_INTAKE_FAILED",
        message: redactErrorMessage(message)
      }
    });
    await kv.put(idempotencyDedupeKey, lead.id, { expirationTtl: 24 * 60 * 60 });
    await kv.put(fingerprintDedupeKey, lead.id, { expirationTtl: CHAT_LEAD_FINGERPRINT_DEDUPE_TTL_SECONDS });
    return json({
      ok: true,
      lead_id: lead.id,
      idempotency_key: lead.idempotency_key,
      status: queued.status,
      queued: true
    }, 202);
  }
}

function isReplayableChatLead(lead) {
  return lead?.status === "received" || lead?.status === "delivered" || lead?.status === "queued";
}

function chatLeadFingerprintDedupeKey({ leadCorrelationId, contact }) {
  const material = [
    normalizeText(leadCorrelationId).toLowerCase(),
    normalizeText(contact.name).toLowerCase().replace(/\s+/g, " "),
    normalizeText(contact.phone).replace(/\D/g, ""),
    normalizeEmail(contact.email)
  ].join("|");
  return `${CHAT_LEAD_FINGERPRINT_DEDUPE_PREFIX}${stableHash(material)}`;
}

function stableHash(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

async function createSeoStrategy(request, now) {
  const body = await readJson(request);
  const keyword =
    normalizeSeoKeyword(body.keyword) ||
    normalizeSeoKeyword(body.request) ||
    normalizeSeoKeyword(body.query);
  if (!keyword) {
    return json({
      ok: false,
      error: "keyword_or_request_required",
      message: "keyword or request is required"
    }, 400);
  }

  const dealer = truncate(normalizeText(body.dealer) || "Vallely Sport & Marine", 120);
  return json({
    ok: true,
    keyword,
    dealer,
    generatedAt: iso(now),
    source: "outrec_static_seo_strategy_v1",
    strategy: buildSeoStrategy(keyword, dealer)
  });
}

function buildSeoStrategy(keyword, dealer) {
  const normalizedKeyword = keyword.toLowerCase();
  const market = inferSeoMarket(normalizedKeyword);
  const intent = inferSeoIntent(normalizedKeyword);
  const title = `${dealer} SEO strategy for ${keyword}`;

  return {
    title,
    summary: `Prioritize local-intent content and conversion paths for "${keyword}" so search visitors can move from discovery to inventory, finance, or contact actions without leaving ${dealer}.`,
    audience: {
      market,
      intent
    },
    recommendations: [
      {
        id: "local-landing-page",
        priority: "high",
        title: `Publish a ${market} landing page for ${keyword}`,
        detail: "Lead with available inventory, dealership trust signals, directions, and a clear quote or contact action above the fold."
      },
      {
        id: "inventory-internal-links",
        priority: "high",
        title: "Connect ranking content to live inventory",
        detail: "Add internal links from the landing page to matching inventory filters and keep product availability copy synchronized with the DP360 feed."
      },
      {
        id: "faq-schema",
        priority: "medium",
        title: "Add buyer FAQ schema",
        detail: "Answer pricing, financing, trade-in, service, and delivery questions using concise FAQ entries that match local search phrasing."
      },
      {
        id: "conversion-measurement",
        priority: "medium",
        title: "Track organic lead conversion",
        detail: "Tag quote, finance, chat, and call actions from the page so organic sessions can be tied back to lead response and revenue dashboards."
      }
    ]
  };
}

function normalizeSeoKeyword(value) {
  return truncate(normalizeText(value).replace(/\s+/g, " "), 160);
}

function inferSeoMarket(keyword) {
  if (/\bbismarck\b/.test(keyword)) return "Bismarck, ND";
  if (/\bminot\b/.test(keyword)) return "Minot, ND";
  if (/\bmandan\b/.test(keyword)) return "Mandan, ND";
  if (/\bnorth dakota\b|\bnd\b/.test(keyword)) return "North Dakota";
  return "local dealership market";
}

function inferSeoIntent(keyword) {
  if (/\bfinance|payment|loan|credit\b/.test(keyword)) return "financing";
  if (/\bservice|repair|maintenance\b/.test(keyword)) return "service";
  if (/\bused|pre-owned|preowned\b/.test(keyword)) return "used inventory";
  return "inventory research";
}

async function postChatLeadToCrm(env, lead) {
  const webhookUrl = normalizeText(env.OUTREC_CRM_LEAD_INTAKE_URL);
  if (webhookUrl) {
    return await postJsonLeadWebhook(webhookUrl, lead);
  }

  const token = normalizeText(env.DP360_API_TOKEN) || normalizeText(env.OUTREC_DP360_API_TOKEN);
  const dealerId = normalizeText(env.DP360_DEALER_ID) || normalizeText(env.OUTREC_DP360_DEALER_ID);
  const vendorLegacyId = normalizeText(env.DP360_VENDOR_LEGACY_ID) || normalizeText(env.OUTREC_DP360_VENDOR_LEGACY_ID);
  if (!token || (!dealerId && !vendorLegacyId)) {
    throw new Error("Stable CRM lead writer is not configured");
  }

  return await postDp360Lead({
    baseUrl: normalizeText(env.DP360_API_BASE_URL) || "https://api.dp360crm.com",
    token,
    dealerId,
    vendorLegacyId,
    lead
  });
}

async function postJsonLeadWebhook(url, lead) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": lead.idempotency_key,
      "x-lead-correlation-id": lead.lead_correlation_id
    },
    body: JSON.stringify(lead)
  });
  const text = await response.text();
  const payload = parseJsonObject(text);
  if (!response.ok) throw new Error(`CRM lead intake returned HTTP ${response.status}`);
  return {
    crmId: readFirstString(payload, ["crm_id", "crmId", "lead_id", "leadId", "id"]) || `crm_ack_${safeId(lead.id)}`,
    target: "webhook"
  };
}

async function postDp360Lead(input) {
  const payload = buildDp360LeadPayload(input.lead, input.dealerId);
  const headers = {
    "content-type": "application/json",
    token: input.token
  };
  if (input.dealerId) headers.DealerId = input.dealerId;
  if (input.vendorLegacyId) headers.VendorLegacyId = input.vendorLegacyId;

  const response = await fetch(`${input.baseUrl.replace(/\/+$/, "")}/api/2.0/leads.json`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  const text = await response.text();
  const responsePayload = parseJsonObject(text);
  if (!response.ok) throw new Error(`DP360 lead intake returned HTTP ${response.status}`);
  return {
    crmId: readFirstString(responsePayload, ["lead_id", "leadId", "id", "crm_id", "crmId"]) || input.lead.id,
    target: "dp360"
  };
}

function buildDp360LeadPayload(lead, dealerId) {
  const created = new Date(lead.created_at);
  const date = created.toISOString().slice(0, 10);
  const time = created.toISOString().slice(11, 19);
  const name = splitName(lead.contact.name);
  return {
    dealer_id: dealerId || undefined,
    date,
    time,
    timezone: "UTC",
    source: lead.source_id || lead.source,
    lead: {
      date,
      time,
      timezone: "UTC",
      lead_type: "Web Lead",
      vendor_customer_id: lead.lead_correlation_id,
      vendor_lead_id: lead.idempotency_key,
      sales_step: "New",
      lead_status: "New",
      is_sold: 0,
      comment: lead.contact.message,
      contact: {
        first_name: name.firstName,
        last_name: name.lastName,
        phone: lead.contact.phone,
        mobile: lead.contact.phone,
        email: lead.contact.email
      },
      product: {
        make: normalizeText(lead.product?.make),
        model: normalizeText(lead.product?.model),
        year: normalizeText(lead.product?.year),
        stockno: normalizeText(lead.product?.stockno)
      }
    },
    contact: {
      first_name: name.firstName,
      last_name: name.lastName,
      phone: lead.contact.phone,
      mobile: lead.contact.phone,
      email: lead.contact.email
    },
    product: {
      make: normalizeText(lead.product?.make),
      model: normalizeText(lead.product?.model),
      year: normalizeText(lead.product?.year),
      stockno: normalizeText(lead.product?.stockno)
    }
  };
}

function splitName(value) {
  const parts = normalizeText(value).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "Vallely",
    lastName: parts.slice(1).join(" ") || "Lead"
  };
}

function readFirstString(record, keys) {
  if (!record || typeof record !== "object") return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function parseJsonObject(text) {
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function redactErrorMessage(message) {
  return normalizeText(message)
    .replace(/(token|password|secret|api[_-]?key)[=:]\S+/gi, "$1=[redacted]")
    .replace(/https?:\/\/\S+/gi, "[redacted-url]")
    .slice(0, 240);
}

async function searchInventory(request, url, kv, now) {
  const cache = await readInventoryCache(kv);
  const health = inventoryHealth(cache.feed, now, cache.key);

  if (health.status !== "healthy") {
    return json({
      ok: false,
      error: health.status === "down" ? "INVENTORY_CACHE_UNAVAILABLE" : "INVENTORY_CACHE_STALE",
      message: health.message,
      source: health.source,
      cacheStatus: health,
      source_health: health,
      _health: { sourceStatus: health, sourceHealth: health }
    }, 503);
  }

  const filters = request.method === "POST" ? await readJson(request) : Object.fromEntries(url.searchParams);
  const page = filterInventoryListings(cache.feed.listings ?? [], filters);
  return json({
    ok: true,
    source: health.source,
    cacheStatus: health,
    source_health: health,
    freshness: {
      lastSeen: health.lastSeen,
      staleAfterSeconds: health.staleAfterSeconds,
      isStale: false
    },
    total: page.total,
    limit: page.limit,
    offset: page.offset,
    results: page.results
  });
}

async function inventorySourceHealth(kv, now) {
  const cache = await readInventoryCache(kv);
  const health = inventoryHealth(cache.feed, now, cache.key);
  return json({
    ok: health.status === "healthy",
    source: health.source,
    cacheStatus: health,
    source_health: health,
    freshness: {
      lastSeen: health.lastSeen,
      staleAfterSeconds: health.staleAfterSeconds,
      isStale: health.status !== "healthy"
    },
    _health: { sourceStatus: health, sourceHealth: health }
  }, health.status === "healthy" ? 200 : 503);
}

function brandTrustPayload(now) {
  const checkedAt = iso(now);
  const reviews = [...BRAND_TRUST_REVIEWS].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const latestReviewAt = BRAND_TRUST_SEGMENTS
    .map((segment) => segment.reviewSummary.latestReviewAt)
    .sort()
    .at(-1);
  const sourceHealth = {
    status: "degraded",
    segmentCount: BRAND_TRUST_SEGMENTS.length,
    reviewCount: BRAND_TRUST_REVIEWS.length,
    lastRefreshedAt: BRAND_TRUST_FIXTURE_UPDATED_AT,
    latestReviewAt,
    message: "Brand Trust live source is not configured on ai.outrec.com; serving bundled synthetic fixture data with explicit degraded health."
  };

  return {
    source: "OUT-40311 synthetic Brand Trust review/reputation fixture",
    fixtureFor: "OUT-40285 reviews widget and outbound review CTA QA",
    lastUpdatedAt: BRAND_TRUST_FIXTURE_UPDATED_AT,
    lastRefreshedAt: BRAND_TRUST_FIXTURE_UPDATED_AT,
    latestReviewAt,
    safetyMode: "Synthetic aggregate data only; no live credentials, customer PII, source tokens, or private dealer records.",
    activeSourceSet: [
      {
        id: "google-business-profile",
        label: "Google Business Profile reviews",
        status: "degraded_fixture",
        acceptedRoute: "GET /dashboard/api/brand-trust/reviews"
      },
      {
        id: "facebook-recommendations",
        label: "Facebook recommendations",
        status: "degraded_fixture",
        acceptedRoute: "GET /dashboard/api/brand-trust/reviews"
      }
    ],
    segments: BRAND_TRUST_SEGMENTS,
    reviews: BRAND_TRUST_REVIEWS,
    recentReviews: reviews.slice(0, 10),
    widgetSummary: {
      segmentCount: BRAND_TRUST_SEGMENTS.length,
      reviewCount: BRAND_TRUST_REVIEWS.length,
      platforms: ["google", "facebook"],
      sentimentBreakdown: {
        positive: 4,
        mixed: 1,
        negative: 1
      },
      ctaStates: ["ready", "needs_review_response", "ready_with_guardrail"]
    },
    _health: {
      lastUpdatedAt: BRAND_TRUST_FIXTURE_UPDATED_AT,
      sourceStatus: {
        source: "Brand Trust reviews fixture",
        status: "degraded_fixture",
        lastSuccessAt: checkedAt,
        lastFailureAt: null
      },
      sourceHealth
    }
  };
}

function brandTrustReviews(now) {
  return json(brandTrustPayload(now));
}

function brandTrustSourceHealth(now) {
  const payload = brandTrustPayload(now);
  return json({
    ok: true,
    source: "Brand Trust reviews",
    lastCheckedAt: iso(now),
    source_health: payload._health.sourceHealth,
    _health: payload._health
  });
}

function brandTrustReviewRequests(now) {
  const payload = brandTrustPayload(now);
  return json({
    ok: true,
    lastRefreshedAt: payload.lastRefreshedAt,
    ctaStates: payload.segments.map((segment) => ({
      segmentId: segment.segmentId,
      segmentLabel: segment.segmentLabel,
      dealerDisplayName: segment.dealerDisplayName,
      latestReviewAt: segment.reviewSummary.latestReviewAt,
      reviewSummary: segment.reviewSummary,
      outboundReviewCta: segment.outboundReviewCta
    })),
    _health: payload._health
  });
}

async function readInventoryCache(kv) {
  for (const key of INVENTORY_CACHE_KEYS) {
    const feed = await getJson(kv, key);
    if (feed) return { key, feed };
  }
  return { key: null, feed: null };
}

function inventoryHealth(feed, now, key) {
  const timestamp = inventoryTimestamp(feed);
  const timestampMs = timestamp ? Date.parse(timestamp) : NaN;
  const ageSeconds = Number.isFinite(timestampMs) ? Math.max(0, Math.floor((now - timestampMs) / 1000)) : null;
  const listings = Array.isArray(feed?.listings) ? feed.listings.length : 0;
  const status = !feed || !Array.isArray(feed.listings)
    ? "down"
    : ageSeconds === null || ageSeconds > INVENTORY_STALE_AFTER_SECONDS
      ? "stale"
      : "healthy";

  return {
    status,
    state: status,
    source: "vallely_inventory_feed_cache",
    cacheKey: key,
    checkedAt: iso(now),
    lastSeen: timestamp,
    scrapedAt: timestamp,
    ageSeconds,
    ageHours: ageSeconds === null ? null : Number((ageSeconds / 3600).toFixed(2)),
    staleAfterSeconds: INVENTORY_STALE_AFTER_SECONDS,
    listings,
    message: inventoryHealthMessage(status, timestamp, listings)
  };
}

function inventoryHealthMessage(status, timestamp, listings) {
  if (status === "down") return "Inventory cache is unavailable or malformed; inventory search is fail-closed.";
  if (status === "stale") return `Inventory cache is stale; lastSeen=${timestamp ?? "unknown"}`;
  return `Inventory cache is fresh; ${listings} listings available.`;
}

function inventoryTimestamp(feed) {
  return feed?.freshness?.lastSeen
    ?? feed?.freshness?.lastRefreshedAt
    ?? feed?.generatedAt
    ?? feed?.summary?.generatedAt
    ?? feed?.scrapedAt
    ?? null;
}

function filterInventoryListings(listings, filters) {
  const query = textFilter(filters.query ?? filters.q ?? filters.search ?? filters.term);
  const kind = textFilter(filters.inventoryKind ?? filters.kind);
  const make = textFilter(filters.make);
  const location = textFilter(filters.location);
  const limit = Math.min(positiveInteger(filters.limit, 25), 100);
  const offset = Math.max(0, positiveInteger(filters.offset, 0));
  const filtered = listings.filter((listing) => {
    if (query && !inventoryHaystack(listing).includes(query)) return false;
    if (kind && textFilter(listing.inventoryKind) !== kind) return false;
    if (make && textFilter(listing.make) !== make) return false;
    if (location && textFilter(listing.location) !== location) return false;
    return true;
  });

  return {
    total: filtered.length,
    limit,
    offset,
    results: filtered.slice(offset, offset + limit).map(publicInventoryListing)
  };
}

function publicInventoryListing(listing) {
  const publicPrice = listing.publicPrice ?? listing.pricing?.publicPrice ?? listing.pricing?.salePrice ?? listing.pricing?.retailPrice ?? null;
  const msrp = listing.msrp ?? listing.pricing?.msrp ?? null;
  return {
    id: listing.id ?? null,
    stockNumber: listing.stockNumber ?? null,
    title: listing.title ?? null,
    url: listing.url ?? null,
    inventoryKind: listing.inventoryKind ?? null,
    year: listing.year ?? null,
    make: listing.make ?? null,
    model: listing.model ?? null,
    location: listing.location ?? null,
    status: listing.status ?? listing.availability?.status ?? null,
    availability: listing.availability ?? {
      status: listing.status ?? null,
      isAvailable: listing.status ? !/sold|unavailable/i.test(listing.status) : null,
      source: "vallely_inventory_feed_cache"
    },
    pricing: {
      currency: listing.pricing?.currency ?? "USD",
      publicPrice,
      msrp
    },
    photoCount: listing.photoCount ?? listing.photoUrls?.length ?? (listing.primaryPhotoUrl ? 1 : 0),
    photoUrls: listing.photoUrls ?? (listing.primaryPhotoUrl ? [listing.primaryPhotoUrl] : []),
    primaryPhotoUrl: listing.primaryPhotoUrl ?? listing.photoUrls?.[0] ?? null,
    freshness: {
      lastSeen: listing.lastUpdatedAt ?? listing.provenance?.retrieved_at ?? null,
      ageDays: listing.ageDays ?? null,
      stale: listing.stale ?? null
    }
  };
}

function inventoryHaystack(listing) {
  return [
    listing.id,
    listing.stockNumber,
    listing.title,
    listing.inventoryKind,
    listing.year,
    listing.make,
    listing.model,
    listing.location,
    listing.status
  ].map(textFilter).join(" ");
}

function textFilter(value) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim().toLowerCase() : "";
}

async function ensureQaAccount(db, now) {
  const existingAccount = await findAccountByEmail(db, AUTH_QA_EMAIL);
  const expectedPasswordHash = await passwordHash(AUTH_QA_PASSWORD);

  if (existingAccount && isQaSeedHealthy(existingAccount, expectedPasswordHash)) return;
  if (existingAccount && existingAccount.id !== AUTH_QA_ACCOUNT_ID) {
    await deleteAccountRow(db, existingAccount.id);
  }

  const account = {
    id: AUTH_QA_ACCOUNT_ID,
    email: AUTH_QA_EMAIL,
    phone: "+17015550999",
    passwordHash: expectedPasswordHash,
    status: "active",
    emailVerifiedAt: iso(now),
    phoneVerifiedAt: iso(now),
    vinVerifiedAt: iso(now),
    vin: "1HD1ABC50PY123456",
    createdAt: existingAccount?.createdAt ?? iso(now),
    updatedAt: iso(now)
  };
  await upsertAccount(db, account);
}

async function listPresetRoutes(url, db, now) {
  await ensurePresetRoutesSeeded(db, now);
  const region = normalizeLaunchRegion(url.searchParams.get("region"));
  const rows = region
    ? await dbAll(db, "SELECT * FROM preset_routes WHERE launch_region = ? ORDER BY sort_order ASC, id ASC", region)
    : await dbAll(db, "SELECT * FROM preset_routes ORDER BY launch_region ASC, sort_order ASC, id ASC");

  return json({
    ok: true,
    launchRegions: LAUNCH_REGIONS,
    routes: rows.map(presetRouteFromRow)
  });
}

async function upsertPresetRouteFeedback(request, env, kv, db, now, rawRouteId) {
  const auth = await authenticateAccount(request, env, kv, db, now);
  if (!auth.ok) return json({ error: auth.error }, auth.status);

  await ensurePresetRoutesSeeded(db, now);
  const routeId = safeId(rawRouteId);
  const route = await findPresetRouteById(db, routeId);
  if (!route) return json({ error: "preset_route_not_found" }, 404);

  const body = await readJson(request);
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ error: "invalid_rating", message: "rating must be an integer from 1 to 5" }, 400);
  }

  const likedFeedback = truncate(body.likedFeedback ?? body.liked_feedback ?? body.liked, 1000);
  const dislikedFeedback = truncate(body.dislikedFeedback ?? body.disliked_feedback ?? body.disliked, 1000);
  const feedbackText = truncate(body.feedback ?? body.freeTextFeedback ?? body.free_text_feedback, 2000);
  const rideId = truncate(body.rideId ?? body.ride_id, 120);
  const visibility = normalizePresetRouteFeedbackVisibility(body.visibility);
  const updatedAt = iso(now);
  const createdAt = updatedAt;

  await dbRun(
    db,
    `INSERT INTO preset_route_feedback (
      account_id, route_id, ride_id, rating, liked_feedback, disliked_feedback, feedback_text, visibility, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(account_id, route_id) DO UPDATE SET
      ride_id = excluded.ride_id,
      rating = excluded.rating,
      liked_feedback = excluded.liked_feedback,
      disliked_feedback = excluded.disliked_feedback,
      feedback_text = excluded.feedback_text,
      visibility = excluded.visibility,
      updated_at = excluded.updated_at`,
    auth.account.id,
    route.id,
    rideId,
    rating,
    likedFeedback,
    dislikedFeedback,
    feedbackText,
    visibility,
    createdAt,
    updatedAt
  );

  await recordPresetRouteCaptureMetric(kv, now, {
    event: "sheet_submitted",
    routeId: route.id,
    launchRegion: route.launchRegion,
    accountId: auth.account.id,
    rideId,
    visibility,
    source: "rating_api"
  });

  const saved = await findPresetRouteFeedback(db, auth.account.id, route.id);
  return json({ ok: true, route: publicPresetRoute(route), feedback: publicOwnPresetRouteFeedback(saved) }, 200);
}

async function createPresetRouteCaptureMetric(request, env, kv, db, now, rawRouteId) {
  await ensurePresetRoutesSeeded(db, now);
  const routeId = safeId(rawRouteId);
  const route = await findPresetRouteById(db, routeId);
  if (!route) return json({ error: "preset_route_not_found" }, 404);

  const body = await readJson(request);
  const event = normalizePresetRouteCaptureEvent(body.event ?? body.event_name ?? body.eventName);
  if (!event) {
    return json({ error: "invalid_capture_event", allowedEvents: [...PRESET_ROUTE_CAPTURE_EVENTS] }, 400);
  }

  const auth = await authenticateAccount(request, env, kv, db, now, { allowMissing: true });
  if (!auth.ok && auth.error !== "unauthorized") return json({ error: auth.error }, auth.status);

  const metric = await recordPresetRouteCaptureMetric(kv, now, {
    event,
    routeId: route.id,
    launchRegion: route.launchRegion,
    accountId: auth.ok ? auth.account.id : null,
    rideId: truncate(body.rideId ?? body.ride_id, 120),
    visibility: normalizePresetRouteFeedbackVisibility(body.visibility),
    source: truncate(body.source, 80) || "app"
  });

  return json({ ok: true, metric }, 201);
}

async function presetRouteCaptureMetricsSummary(request, env, kv, db, now) {
  if (!isAdminExportAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
  await ensurePresetRoutesSeeded(db, now);
  const url = new URL(request.url);
  const sinceHours = Number(url.searchParams.get("since_hours") ?? 24);
  const windowHours = Number.isFinite(sinceHours) && sinceHours > 0 ? sinceHours : 24;
  const minTs = now - windowHours * 60 * 60 * 1000;
  const routeFilter = safeId(url.searchParams.get("route_id") ?? url.searchParams.get("routeId") ?? "");
  const events = (await listJson(kv, PRESET_ROUTE_FEEDBACK_METRIC_PREFIX))
    .filter((event) => Date.parse(event.ts) >= minTs)
    .filter((event) => !routeFilter || event.route_id === routeFilter)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));

  const counts = Object.fromEntries([...PRESET_ROUTE_CAPTURE_EVENTS].map((eventName) => [eventName, 0]));
  const byRoute = {};
  for (const event of events) {
    counts[event.event] = (counts[event.event] ?? 0) + 1;
    const routeCounts = byRoute[event.route_id] ?? Object.fromEntries([...PRESET_ROUTE_CAPTURE_EVENTS].map((eventName) => [eventName, 0]));
    routeCounts[event.event] = (routeCounts[event.event] ?? 0) + 1;
    byRoute[event.route_id] = routeCounts;
  }

  const shown = counts.sheet_shown ?? 0;
  const submitted = counts.sheet_submitted ?? 0;
  const skipped = counts.sheet_skipped ?? 0;
  return json({
    ok: true,
    sinceHours: windowHours,
    counts,
    rates: {
      submittedPerShown: shown > 0 ? Number((submitted / shown).toFixed(4)) : 0,
      skippedPerShown: shown > 0 ? Number((skipped / shown).toFixed(4)) : 0
    },
    byRoute,
    events
  });
}

async function exportPresetRouteFeedback(request, env, db, now) {
  if (!isAdminExportAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
  await ensurePresetRoutesSeeded(db, now);
  const rows = await dbAll(
    db,
    `SELECT
      f.account_id, a.email, f.route_id, r.launch_region, r.name, r.distance_km,
      r.curvy_score, r.scenic_score, r.elevation_gain_m, f.ride_id, f.rating,
      f.liked_feedback, f.disliked_feedback, f.feedback_text, f.visibility, f.created_at, f.updated_at
    FROM preset_route_feedback f
    JOIN preset_routes r ON r.id = f.route_id
    LEFT JOIN accounts a ON a.id = f.account_id
    ORDER BY f.updated_at DESC, f.route_id ASC`
  );

  const fields = [
    "account_id",
    "account_email",
    "route_id",
    "launch_region",
    "route_name",
    "distance_km",
    "curvy_score",
    "scenic_score",
    "elevation_gain_m",
    "ride_id",
    "rating",
    "stars",
    "liked_feedback",
    "disliked_feedback",
    "feedback_text",
    "visibility",
    "created_at",
    "updated_at"
  ];
  const csv = [
    fields.join(","),
    ...rows.map((row) =>
      [
        row.account_id,
        row.email,
        row.route_id,
        row.launch_region,
        row.name,
        row.distance_km,
        row.curvy_score,
        row.scenic_score,
        row.elevation_gain_m,
        row.ride_id,
        row.rating,
        row.rating,
        row.liked_feedback,
        row.disliked_feedback,
        row.feedback_text,
        row.visibility,
        row.created_at,
        row.updated_at
      ].map(csvCell).join(",")
    )
  ].join("\n");

  return cors(new Response(`${csv}\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="outrec-preset-route-feedback-${new Date(now).toISOString().slice(0, 10)}.csv"`
    }
  }));
}

async function ensurePresetRoutesSeeded(db, now) {
  const row = await dbFirst(db, "SELECT COUNT(*) AS count FROM preset_routes");
  if (Number(row?.count ?? 0) >= LAUNCH_REGIONS.length * PRESET_ROUTE_SEED_COUNT_PER_REGION) return;
  const createdAt = iso(now);
  for (const route of buildPresetRouteSeeds(createdAt)) {
    await dbRun(
      db,
      `INSERT INTO preset_routes (
        id, launch_region, name, geometry_json, distance_km, curvy_score, scenic_score,
        elevation_gain_m, metadata_json, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        launch_region = excluded.launch_region,
        name = excluded.name,
        geometry_json = excluded.geometry_json,
        distance_km = excluded.distance_km,
        curvy_score = excluded.curvy_score,
        scenic_score = excluded.scenic_score,
        elevation_gain_m = excluded.elevation_gain_m,
        metadata_json = excluded.metadata_json,
        sort_order = excluded.sort_order,
        updated_at = excluded.updated_at`,
      route.id,
      route.launchRegion,
      route.name,
      JSON.stringify(route.geometry),
      route.distanceKm,
      route.curvyScore,
      route.scenicScore,
      route.elevationGainM,
      JSON.stringify(route.metadata),
      route.sortOrder,
      createdAt,
      createdAt
    );
  }
}

function buildPresetRouteSeeds(createdAt) {
  const configs = [
    { region: "bismarck-nd", label: "Bismarck", lat: 46.8083, lon: -100.7837 },
    { region: "minot-nd", label: "Minot", lat: 48.2325, lon: -101.2963 }
  ];
  const seeds = [];
  for (const config of configs) {
    for (let i = 1; i <= PRESET_ROUTE_SEED_COUNT_PER_REGION; i += 1) {
      const latOffset = (i % 5) * 0.018;
      const lonOffset = Math.floor(i / 5) * 0.022;
      const coordinates = [
        [round6(config.lon - 0.05 + lonOffset), round6(config.lat + latOffset)],
        [round6(config.lon - 0.015 + lonOffset), round6(config.lat + 0.012 + latOffset)],
        [round6(config.lon + 0.025 + lonOffset), round6(config.lat + 0.006 + latOffset)],
        [round6(config.lon + 0.055 + lonOffset), round6(config.lat + 0.02 + latOffset)]
      ];
      seeds.push({
        id: `${config.region}-curated-${String(i).padStart(2, "0")}`,
        launchRegion: config.region,
        name: `${config.label} curated loop ${String(i).padStart(2, "0")}`,
        geometry: { type: "LineString", coordinates },
        distanceKm: round1(18 + i * 1.7),
        curvyScore: round2(0.42 + (i % 7) * 0.07),
        scenicScore: round2(0.48 + (i % 6) * 0.065),
        elevationGainM: 60 + i * 11,
        sortOrder: i,
        metadata: {
          surface: "road_snapped",
          tags: [i % 2 === 0 ? "curvy" : "balanced", i % 3 === 0 ? "scenic" : "local"],
          seed_version: "2026-05-31",
          created_at: createdAt
        }
      });
    }
  }
  return seeds;
}

async function findPresetRouteById(db, routeId) {
  const row = await dbFirst(db, "SELECT * FROM preset_routes WHERE id = ?", routeId);
  return row ? presetRouteFromRow(row) : null;
}

async function findPresetRouteFeedback(db, accountId, routeId) {
  const row = await dbFirst(db, "SELECT * FROM preset_route_feedback WHERE account_id = ? AND route_id = ?", accountId, routeId);
  return row ? presetRouteFeedbackFromRow(row) : null;
}

function presetRouteFromRow(row) {
  return publicPresetRoute({
    id: row.id,
    launchRegion: row.launch_region,
    name: row.name,
    geometry: parseJsonValue(row.geometry_json, { type: "LineString", coordinates: [] }),
    distanceKm: Number(row.distance_km),
    curvyScore: Number(row.curvy_score),
    scenicScore: Number(row.scenic_score),
    elevationGainM: Number(row.elevation_gain_m),
    metadata: parseJsonValue(row.metadata_json, {}),
    sortOrder: Number(row.sort_order),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function publicPresetRoute(route) {
  return {
    id: route.id,
    launchRegion: route.launchRegion,
    name: route.name,
    geometry: route.geometry,
    distanceKm: route.distanceKm,
    curvyScore: route.curvyScore,
    scenicScore: route.scenicScore,
    elevationGainM: route.elevationGainM,
    metadata: route.metadata,
    sortOrder: route.sortOrder,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt
  };
}

function presetRouteFeedbackFromRow(row) {
  return {
    accountId: row.account_id,
    routeId: row.route_id,
    rideId: row.ride_id ?? "",
    rating: Number(row.rating),
    likedFeedback: row.liked_feedback ?? "",
    dislikedFeedback: row.disliked_feedback ?? "",
    feedbackText: row.feedback_text ?? "",
    visibility: row.visibility ?? "private",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function publicOwnPresetRouteFeedback(feedback) {
  return {
    routeId: feedback.routeId,
    rideId: feedback.rideId,
    rating: feedback.rating,
    likedFeedback: feedback.likedFeedback,
    dislikedFeedback: feedback.dislikedFeedback,
    feedbackText: feedback.feedbackText,
    visibility: feedback.visibility,
    createdAt: feedback.createdAt,
    updatedAt: feedback.updatedAt
  };
}

function normalizePresetRouteCaptureEvent(value) {
  const event = normalizeText(value).toLowerCase().replace(/[\s-]+/g, "_");
  return PRESET_ROUTE_CAPTURE_EVENTS.has(event) ? event : "";
}

function normalizePresetRouteFeedbackVisibility(value) {
  const visibility = normalizeText(value).toLowerCase();
  return PRESET_ROUTE_VISIBILITY_VALUES.has(visibility) ? visibility : "private";
}

async function recordPresetRouteCaptureMetric(kv, now, details) {
  const metric = {
    id: randomId(),
    event: details.event,
    route_id: details.routeId,
    launch_region: details.launchRegion,
    account_id: details.accountId || null,
    ride_id: details.rideId || null,
    visibility: details.visibility || "private",
    source: details.source || "app",
    ts: iso(now)
  };
  await putJson(kv, `${PRESET_ROUTE_FEEDBACK_METRIC_PREFIX}${metric.ts}:${metric.id}`, metric);
  return metric;
}

function normalizeLaunchRegion(value) {
  const region = normalizeText(value).toLowerCase();
  return LAUNCH_REGIONS.includes(region) ? region : "";
}

function isAdminExportAuthorized(request, env) {
  const expected = normalizeText(env.OUTREC_ADMIN_EXPORT_TOKEN);
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const [, bearer] = header.split(/\s+/);
  return bearer === expected || request.headers.get("x-admin-token") === expected;
}

function csvCell(value) {
  const text = value == null ? "" : String(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function parseJsonValue(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function publicCustomerSession(account, accessToken) {
  return {
    userId: account.id,
    token: accessToken,
    email: account.email,
    phone: account.phone,
    vin: account.vin || "",
    motorcycle: account.motorcycle || {
      year: null,
      make: "Verified",
      model: "Motorcycle",
      type: "motorcycle",
      country: "United States"
    },
    biometricEnabled: false
  };
}

async function authenticateAccount(request, env, kv, db, now, options = {}) {
  const token = bearerToken(request) || cookieValue(request, AI_SESSION_COOKIE);
  if (!token) {
    if (options.allowMissing) return { ok: false, status: 401, error: "unauthorized" };
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const payload = await verifyJwt(env, token, aiSigningKey(env));
  if (!payload || payload.aud !== AI_JWT_AUDIENCE || !payload.sub || !payload.exp || payload.exp < Math.floor(now / 1000)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const session = await findSessionByAccessToken(db, token);
  if (
    !session ||
    session.accountId !== safeId(payload.sub) ||
    session.deviceId !== normalizeText(payload.deviceId) ||
    session.revokedAt ||
    Date.parse(session.expiresAt) <= now
  ) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  const account = await findAccountById(db, safeId(payload.sub));
  if (!account) return { ok: false, status: 404, error: "account_not_found" };
  return { ok: true, account, session };
}

async function deleteAccountData(kv, db, account) {
  const deleted = {
    accounts: 0,
    emailIndexes: 0,
    authSessions: 0,
    activationEvents: 0,
    voiceRecordings: 0,
    transcripts: 0
  };

  deleted.authSessions += await deleteSessionsByAccount(db, account.id);
  deleted.voiceRecordings += await deleteOwnedPrefix(kv, VOICE_RECORDING_PREFIX, account.id);
  deleted.transcripts += await deleteOwnedPrefix(kv, TRANSCRIPT_PREFIX, account.id);
  deleted.activationEvents += await deleteOwnedPrefix(kv, ACTIVATION_EVENT_PREFIX, account.id);

  await deleteAccountRow(db, account.id);
  deleted.accounts += 1;

  if (account.email) {
    deleted.emailIndexes += 1;
  }

  return deleted;
}

async function deletePrefix(kv, prefix) {
  let deleted = 0;
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor });
    for (const key of page.keys ?? []) {
      await kv.delete(key.name);
      deleted += 1;
    }
    cursor = page.list_complete === false ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}

async function deleteOwnedPrefix(kv, prefix, accountId) {
  let deleted = 0;
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor });
    for (const key of page.keys ?? []) {
      const ownedByKey = key.name.startsWith(`${prefix}${accountId}:`) || key.name.startsWith(`${prefix}${accountId}`);
      const value = ownedByKey ? null : await getJson(kv, key.name);
      const ownedByRecord =
        value?.user_id === accountId ||
        value?.userId === accountId ||
        value?.accountId === accountId ||
        value?.customerId === accountId;
      if (ownedByKey || ownedByRecord) {
        await kv.delete(key.name);
        deleted += 1;
      }
    }
    cursor = page.list_complete === false ? page.cursor : undefined;
  } while (cursor);
  return deleted;
}

function isQaSeedHealthy(account, expectedPasswordHash) {
  return (
    account.id === AUTH_QA_ACCOUNT_ID &&
    account.email === AUTH_QA_EMAIL &&
    account.status === "active" &&
    account.passwordHash === expectedPasswordHash &&
    Boolean(account.emailVerifiedAt) &&
    Boolean(account.phoneVerifiedAt) &&
    Boolean(account.vinVerifiedAt)
  );
}

function accountProgress(account, deviceId) {
  return {
    accountId: account.id,
    deviceId,
    email: account.email,
    phone: account.phone,
    status: account.status,
    requirements: missingAuthRequirements(account),
    emailVerified: Boolean(account.emailVerifiedAt),
    phoneVerified: Boolean(account.phoneVerifiedAt),
    vinVerified: Boolean(account.vinVerifiedAt)
  };
}

function missingAuthRequirements(account) {
  const requirements = [];
  if (!account.emailVerifiedAt) requirements.push("email_verification");
  if (!account.phoneVerifiedAt) requirements.push("phone_verification");
  if (!account.vinVerifiedAt) requirements.push("vin_verification");
  return requirements;
}

async function signAccessToken(env, account, deviceId, now) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    aud: AI_JWT_AUDIENCE,
    sub: account.id,
    email: account.email,
    deviceId,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ACCESS_TOKEN_TTL_SECONDS
  };
  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  return `${unsigned}.${await hmacSha256(aiSigningKey(env), unsigned)}`;
}

async function insertAccount(db, account) {
  await dbRun(
    db,
    `INSERT INTO accounts (
      id, email, phone, password_hash, status, vin,
      email_verified_at, phone_verified_at, vin_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    account.id,
    account.email,
    account.phone,
    account.passwordHash,
    account.status,
    account.vin,
    account.emailVerifiedAt,
    account.phoneVerifiedAt,
    account.vinVerifiedAt,
    account.createdAt,
    account.updatedAt
  );
}

async function upsertAccount(db, account) {
  await dbRun(
    db,
    `INSERT INTO accounts (
      id, email, phone, password_hash, status, vin,
      email_verified_at, phone_verified_at, vin_verified_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      phone = excluded.phone,
      password_hash = excluded.password_hash,
      status = excluded.status,
      vin = excluded.vin,
      email_verified_at = excluded.email_verified_at,
      phone_verified_at = excluded.phone_verified_at,
      vin_verified_at = excluded.vin_verified_at,
      updated_at = excluded.updated_at`,
    account.id,
    account.email,
    account.phone,
    account.passwordHash,
    account.status,
    account.vin,
    account.emailVerifiedAt,
    account.phoneVerifiedAt,
    account.vinVerifiedAt,
    account.createdAt,
    account.updatedAt
  );
}

async function touchAccount(db, accountId, updatedAt) {
  await dbRun(db, "UPDATE accounts SET updated_at = ? WHERE id = ?", updatedAt, accountId);
}

async function findAccountByEmail(db, email) {
  const row = await dbFirst(db, "SELECT * FROM accounts WHERE email = ?", email);
  return row ? accountFromRow(row) : null;
}

async function findAccountById(db, accountId) {
  const row = await dbFirst(db, "SELECT * FROM accounts WHERE id = ?", accountId);
  return row ? accountFromRow(row) : null;
}

async function writeSession(db, account, deviceId, deviceName, accessToken, refreshToken, now) {
  const expiresAt = iso(now + ACCESS_TOKEN_TTL_SECONDS * 1000);
  const refreshExpiresAt = iso(now + REFRESH_TOKEN_TTL_SECONDS * 1000);
  const createdAt = iso(now);
  await dbRun(
    db,
    `INSERT INTO account_sessions (
      account_id, device_id, device_name, access_token, refresh_token,
      expires_at, refresh_expires_at, created_at, updated_at, revoked_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(account_id, device_id) DO UPDATE SET
      device_name = excluded.device_name,
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      refresh_expires_at = excluded.refresh_expires_at,
      updated_at = excluded.updated_at,
      revoked_at = NULL`,
    account.id,
    deviceId,
    deviceName,
    accessToken,
    refreshToken,
    expiresAt,
    refreshExpiresAt,
    createdAt,
    createdAt
  );
}

async function findSessionByAccessToken(db, accessToken) {
  const row = await dbFirst(db, "SELECT * FROM account_sessions WHERE access_token = ?", accessToken);
  return row ? sessionFromRow(row) : null;
}

async function findSessionByRefreshToken(db, refreshToken) {
  const row = await dbFirst(db, "SELECT * FROM account_sessions WHERE refresh_token = ?", refreshToken);
  return row ? sessionFromRow(row) : null;
}

async function listSessionsByAccount(db, accountId) {
  const result = await dbAll(db, "SELECT * FROM account_sessions WHERE account_id = ?", accountId);
  return result.map(sessionFromRow);
}

async function revokeSession(db, session, revokedAt) {
  await dbRun(
    db,
    "UPDATE account_sessions SET revoked_at = ?, updated_at = ? WHERE account_id = ? AND device_id = ?",
    revokedAt,
    revokedAt,
    session.accountId,
    session.deviceId
  );
}

async function deleteSessionsByAccount(db, accountId) {
  const result = await dbRun(db, "DELETE FROM account_sessions WHERE account_id = ?", accountId);
  return result.meta?.changes ?? 0;
}

async function deleteAccountRow(db, accountId) {
  await dbRun(db, "DELETE FROM accounts WHERE id = ?", accountId);
}

function accountFromRow(row) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    passwordHash: row.password_hash,
    status: row.status,
    vin: row.vin,
    emailVerifiedAt: row.email_verified_at,
    phoneVerifiedAt: row.phone_verified_at,
    vinVerifiedAt: row.vin_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function sessionFromRow(row) {
  return {
    accountId: row.account_id,
    deviceId: row.device_id,
    deviceName: row.device_name,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresAt: row.expires_at,
    refreshExpiresAt: row.refresh_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at
  };
}

async function dbFirst(db, sql, ...params) {
  return await db.prepare(sql).bind(...params).first();
}

async function dbAll(db, sql, ...params) {
  const result = await db.prepare(sql).bind(...params).all();
  return result.results ?? [];
}

async function dbRun(db, sql, ...params) {
  return await db.prepare(sql).bind(...params).run();
}

async function createGroupRide(request, env, kv, db, now) {
  const sourceIp = sourceIpKey(request);
  const attemptRate = await checkRateLimit(
    kv,
    `group_ride_create_attempt:${sourceIp}:${tenMinuteBucket(now)}`,
    GROUP_RIDE_CREATE_ATTEMPT_LIMIT,
    GROUP_RIDE_CREATE_RATE_TTL_SECONDS
  );
  if (!attemptRate.allowed) return json({ error: "rate_limited", retryAfterSeconds: attemptRate.retryAfterSeconds }, 429);

  const identity = await validateIdentity(request, env, kv, db, now);
  if (!identity.ok) return json({ error: identity.error }, identity.status);

  const successRate = await checkRateLimit(
    kv,
    `group_ride_create_success:${identity.identityId}:${tenMinuteBucket(now)}`,
    GROUP_RIDE_CREATE_SUCCESS_LIMIT,
    GROUP_RIDE_CREATE_RATE_TTL_SECONDS
  );
  if (!successRate.allowed) return json({ error: "rate_limited", retryAfterSeconds: successRate.retryAfterSeconds }, 429);

  const body = await readJson(request);
  const rideCode = safeId(body.rideCode || body.code || randomId().replace(/-/g, "").slice(0, 8)).toUpperCase();
  const roomName = `group-ride:${rideCode}`;
  const roomId = safeId(rideCode);
  const hostId = identity.identityId;

  const roomBinding = env.GROUP_RIDE_ROOM || env.GroupRideRoom;
  if (!roomBinding) return json({ error: "missing_durable_object_binding", binding: "GROUP_RIDE_ROOM" }, 500);

  const durableObjectId = typeof roomBinding.idFromName === "function" ? roomBinding.idFromName(roomName) : roomBinding.idFromString(roomId);
  const room = roomBinding.get(durableObjectId);
  await room.fetch(`https://group-ride.internal/${roomId}?__init__=1&hostId=${encodeURIComponent(hostId)}`);

  return json({
    ok: true,
    rideCode,
    roomId,
    hostId,
    websocketUrl: `/api/group-ride/${rideCode}/connect`
  }, 201);
}

async function validateIdentity(request, env, kv, db, now) {
  const bearer = bearerToken(request);
  const accessJwt = normalizeText(request.headers.get("Cf-Access-Jwt-Assertion"));

  if (bearer) {
    if (!db) return { ok: false, status: 500, error: "missing_d1_binding" };
    if (!aiSigningKey(env)) return { ok: false, status: 500, error: "missing_secret" };
    const auth = await authenticateAccount(request, env, kv, db, now);
    if (!auth.ok) return { ok: false, status: auth.status, error: auth.error };
    return { ok: true, source: "outrec_session", identityId: auth.account.id, account: auth.account };
  }

  if (accessJwt) {
    const payload = await verifyCfAccessJwt(env, accessJwt, now);
    const subject = normalizeText(payload?.sub || payload?.email || payload?.identity_nonce);
    if (!payload || !subject) return { ok: false, status: 401, error: "unauthorized" };
    return { ok: true, source: "cf_access", identityId: safeId(subject) || shaIdentity(subject) };
  }

  return { ok: false, status: 401, error: "unauthorized" };
}

async function verifyCfAccessJwt(env, token, now) {
  const keys = cfAccessSigningKeys(env);
  if (keys.length === 0) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }

  if (!payload.exp || payload.exp < Math.floor(now / 1000)) return null;
  const expectedAud = normalizeText(env.OUTREC_CF_ACCESS_AUD || env.CF_ACCESS_AUD);
  if (expectedAud) {
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(expectedAud)) return null;
  }

  for (const key of keys) {
    if (header.alg === "HS256" && (await verifyJwtSignature(token, key))) return payload;
    if (header.alg === "RS256" && (await verifyRsaJwtSignature(token, key))) return payload;
  }
  return null;
}

function cfAccessSigningKeys(env) {
  const values = [
    env.OUTREC_CF_ACCESS_JWT_SIGNING_KEYS,
    env.OUTREC_CF_ACCESS_JWT_SIGNING_KEY,
    env.CF_ACCESS_JWT_SIGNING_KEYS,
    env.CF_ACCESS_JWT_SIGNING_KEY
  ];
  const keys = [];
  for (const value of values) {
    const text = normalizeText(value);
    if (!text) continue;
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) keys.push(...parsed);
      else keys.push(parsed);
    } catch {
      keys.push(text);
    }
  }
  return keys;
}

async function verifyJwtSignature(token, key) {
  const parts = token.split(".");
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(key, unsigned);
  return constantTimeEqual(parts[2], expected);
}

async function verifyRsaJwtSignature(token, keyValue) {
  const parts = token.split(".");
  const unsigned = `${parts[0]}.${parts[1]}`;
  const key = await importRsaPublicKey(keyValue);
  if (!key) return false;
  const signature = Uint8Array.from(base64UrlDecode(parts[2]), (char) => char.charCodeAt(0));
  return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, new TextEncoder().encode(unsigned));
}

async function importRsaPublicKey(keyValue) {
  try {
    if (typeof keyValue === "object") {
      return await crypto.subtle.importKey("jwk", keyValue, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    }
    const pem = normalizeText(keyValue);
    if (!pem.includes("BEGIN PUBLIC KEY")) return null;
    const body = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\s/g, "");
    const binary = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
    return await crypto.subtle.importKey("spki", binary, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  } catch {
    return null;
  }
}

function sourceIpKey(request) {
  return safeId(
    request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      "unknown"
  );
}

function shaIdentity(value) {
  return base64UrlEncode(new TextEncoder().encode(value)).slice(0, 80);
}

async function passwordHash(password) {
  return await sha256Hex(password);
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function reportHazard(request, kv, now) {
  const ipKey = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  const body = await readJson(request);
  const coords = parseCoords(body);
  const type = normalizeType(body.type);

  if (!coords.ok) return json({ error: "invalid_coordinates", details: coords.error }, 400);
  if (!type) return json({ error: "invalid_hazard_type", allowedTypes: [...HAZARD_TYPES] }, 400);

  const actor = body.createdByUserId || body.userId || ipKey;
  const rate = await checkRateLimit(kv, `report:${actor}:${minuteBucket(now)}`, 6, 90);
  if (!rate.allowed) return json({ error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds }, 429);

  if (body.clientReportId) {
    const dedupeKey = `${DEDUPE_PREFIX}${actor}:${body.clientReportId}`;
    const existingId = await kv.get(dedupeKey);
    if (existingId) {
      const existing = await getHazard(kv, existingId, now);
      if (existing) return json({ hazard: publicHazard(existing, now), deduped: true });
    }
  }

  const id = body.id ? safeId(String(body.id)) : randomId();
  const hazard = {
    id,
    type,
    lat: coords.lat,
    lon: coords.lon,
    source: normalizeSource(body.source),
    note: typeof body.note === "string" ? body.note.slice(0, 240) : "",
    reportedAt: iso(now),
    updatedAt: iso(now),
    expiresAt: iso(now + ttlForType(type)),
    active: true,
    confidence: 0.58,
    confirmations: 0,
    nonConfirmations: 0,
    lastConfirmedAt: null,
    createdByUserId: typeof body.createdByUserId === "string" ? body.createdByUserId.slice(0, 96) : null,
    languageSafetyLabel: safetyLabel(type),
    duplicateSuppressionKey: duplicateSuppressionKey(type, coords.lat, coords.lon)
  };

  await putJson(kv, `${HAZARD_PREFIX}${id}`, hazard);
  await appendEvent(kv, now, {
    hazardId: id,
    type,
    action: "report",
    lat: coords.lat,
    lon: coords.lon,
    source: hazard.source,
    actorId: hazard.createdByUserId
  });
  await refreshRiskZone(kv, type, coords.lat, coords.lon, now);

  if (body.clientReportId) {
    await kv.put(`${DEDUPE_PREFIX}${actor}:${body.clientReportId}`, id, { expirationTtl: 24 * 60 * 60 });
  }

  return json({ hazard: publicHazard(hazard, now), deduped: false }, 201);
}

async function nearbyHazards(url, kv, now) {
  const query = parseQueryCoords(url);
  if (!query.ok) return json({ error: "invalid_query", details: query.error }, 400);

  const hazards = await listJson(kv, HAZARD_PREFIX);
  const active = [];
  let expiredCount = 0;

  for (const hazard of hazards) {
    const refreshed = decayHazard(hazard, now);
    if (!refreshed.active) {
      expiredCount += 1;
      await putJson(kv, `${HAZARD_PREFIX}${hazard.id}`, refreshed);
      continue;
    }
    const distanceM = distanceMeters(query.lat, query.lon, refreshed.lat, refreshed.lon);
    if (distanceM <= query.radiusM) {
      active.push({ ...publicHazard(refreshed, now), distanceM: Math.round(distanceM) });
    }
  }

  active.sort((a, b) => a.distanceM - b.distanceM);
  const zones = await zonesWithin(kv, query.lat, query.lon, query.radiusM, now);

  return json({
    hazards: active,
    riskZones: zones,
    metadata: {
      radiusM: query.radiusM,
      expiredCount,
      duplicateSuppressionWindowSeconds: 20 * 60
    }
  });
}

async function updateHazardSignal(request, kv, now, rawId, action) {
  const id = safeId(rawId);
  const hazard = await getHazard(kv, id, now);
  if (!hazard) return json({ error: "hazard_not_found" }, 404);

  const body = await readJson(request);
  const actor = body.userId || body.confirmedByUserId || body.clearedByUserId || "anonymous";
  const rate = await checkRateLimit(kv, `${action}:${actor}:${minuteBucket(now)}`, 20, 90);
  if (!rate.allowed) return json({ error: "rate_limited", retryAfterSeconds: rate.retryAfterSeconds }, 429);

  const next = action === "confirm" ? confirmHazard(hazard, now) : clearHazard(hazard, now);
  await putJson(kv, `${HAZARD_PREFIX}${id}`, next);
  await appendEvent(kv, now, {
    hazardId: id,
    type: next.type,
    action,
    lat: next.lat,
    lon: next.lon,
    actorId: actor
  });
  await refreshRiskZone(kv, next.type, next.lat, next.lon, now);

  return json({ hazard: publicHazard(next, now), action });
}

async function nearbyRiskZones(url, kv, now) {
  const query = parseQueryCoords(url);
  if (!query.ok) return json({ error: "invalid_query", details: query.error }, 400);
  const riskZones = await zonesWithin(kv, query.lat, query.lon, query.radiusM, now);
  return json({ riskZones, metadata: { radiusM: query.radiusM } });
}

function confirmHazard(hazard, now) {
  const confidence = clamp(round2(hazard.confidence + 0.18), 0, 1);
  return {
    ...hazard,
    active: true,
    confidence,
    confirmations: hazard.confirmations + 1,
    updatedAt: iso(now),
    expiresAt: iso(now + Math.max(ttlForType(hazard.type), 45 * 60 * 1000)),
    lastConfirmedAt: iso(now)
  };
}

function clearHazard(hazard, now) {
  const confidence = clamp(round2(hazard.confidence - 0.28), 0, 1);
  return {
    ...hazard,
    active: confidence >= 0.25,
    confidence,
    nonConfirmations: hazard.nonConfirmations + 1,
    updatedAt: iso(now),
    expiresAt: confidence >= 0.25 ? hazard.expiresAt : iso(now)
  };
}

function decayHazard(hazard, now) {
  if (!hazard.active || Date.parse(hazard.expiresAt) <= now) {
    return { ...hazard, active: false, confidence: Math.min(hazard.confidence, 0.2), updatedAt: iso(now) };
  }

  const ageHours = Math.max(0, (now - Date.parse(hazard.reportedAt)) / 3_600_000);
  const decayed = clamp(round2(hazard.confidence - ageHours * 0.015), 0, 1);
  if (decayed < 0.2) return { ...hazard, active: false, confidence: decayed, updatedAt: iso(now), expiresAt: iso(now) };
  return { ...hazard, confidence: decayed };
}

async function refreshRiskZone(kv, type, lat, lon, now) {
  if (!RISK_ZONE_TYPES.has(type)) return null;

  const cell = cellKey(lat, lon);
  const events = await listJson(kv, `${HAZARD_EVENT_PREFIX}${cell}:${type}:`);
  const recent = events.filter((event) => now - Date.parse(event.at) <= 14 * 24 * 60 * 60 * 1000);
  const reports = recent.filter((event) => event.action === "report" || event.action === "confirm");
  if (reports.length < 2) return null;

  const centroid = reports.reduce(
    (acc, event) => ({ lat: acc.lat + event.lat, lon: acc.lon + event.lon }),
    { lat: 0, lon: 0 }
  );
  centroid.lat /= reports.length;
  centroid.lon /= reports.length;

  const zone = {
    id: `${cell}:${type}`,
    cell,
    type,
    categories: [type],
    centroidLat: round6(centroid.lat),
    centroidLon: round6(centroid.lon),
    radiusM: Math.max(250, Math.min(1500, Math.round(maxDistanceFrom(centroid, reports) + 150))),
    reportCount: reports.length,
    confidence: clamp(round2(0.35 + reports.length * 0.08), 0, 0.95),
    firstSeenAt: reports[0].at,
    lastSeenAt: reports[reports.length - 1].at,
    languageSafetyLabel: safetyLabel(type)
  };

  await putJson(kv, `${RISK_ZONE_PREFIX}${zone.id}`, zone);
  return zone;
}

async function zonesWithin(kv, lat, lon, radiusM, now) {
  const zones = await listJson(kv, RISK_ZONE_PREFIX);
  return zones
    .filter((zone) => now - Date.parse(zone.lastSeenAt) <= 14 * 24 * 60 * 60 * 1000)
    .map((zone) => ({ ...zone, distanceM: Math.round(distanceMeters(lat, lon, zone.centroidLat, zone.centroidLon)) }))
    .filter((zone) => zone.distanceM <= radiusM + zone.radiusM)
    .sort((a, b) => a.distanceM - b.distanceM);
}

async function appendEvent(kv, now, event) {
  const record = {
    id: randomId(),
    at: iso(now),
    ...event
  };
  await putJson(kv, `${HAZARD_EVENT_PREFIX}${cellKey(event.lat, event.lon)}:${event.type}:${now}:${record.id}`, record);
}

async function checkRateLimit(kv, key, limit, ttlSeconds) {
  const storageKey = `${RATE_PREFIX}${key}`;
  const current = Number((await kv.get(storageKey)) ?? "0");
  if (current >= limit) return { allowed: false, retryAfterSeconds: ttlSeconds };
  await kv.put(storageKey, String(current + 1), { expirationTtl: ttlSeconds });
  return { allowed: true };
}

async function getHazard(kv, id, now) {
  const hazard = await getJson(kv, `${HAZARD_PREFIX}${safeId(id)}`);
  if (!hazard) return null;
  return decayHazard(hazard, now);
}

async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function parseCoords(body) {
  const lat = Number(body.lat);
  const lon = Number(body.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { ok: false, error: "lat_lon_required" };
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return { ok: false, error: "lat_lon_out_of_bounds" };
  return { ok: true, lat: round6(lat), lon: round6(lon) };
}

function parseQueryCoords(url) {
  const coords = parseCoords({ lat: url.searchParams.get("lat"), lon: url.searchParams.get("lon") });
  if (!coords.ok) return coords;
  const radiusM = Number(url.searchParams.get("radiusM") ?? "2500");
  if (!Number.isFinite(radiusM) || radiusM <= 0 || radiusM > 50000) {
    return { ok: false, error: "radiusM_must_be_1_to_50000" };
  }
  return { ...coords, radiusM };
}

function normalizeType(value) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "police" || normalized === "cop") return "police_activity";
  return HAZARD_TYPES.has(normalized) ? normalized : null;
}

function normalizeSource(value) {
  const source = String(value ?? "typed").trim().toLowerCase();
  if (["voice", "typed", "passive", "group_ride"].includes(source)) return source;
  return "typed";
}

function safetyLabel(type) {
  if (type === "police_activity") return "Roadway awareness report";
  return "Road hazard reported";
}

function ttlForType(type) {
  return TYPE_TTL_MS[type] ?? TYPE_TTL_MS.other;
}

function publicHazard(hazard, now) {
  const expiresAt = Date.parse(hazard.expiresAt);
  return {
    id: hazard.id,
    type: hazard.type,
    lat: hazard.lat,
    lon: hazard.lon,
    source: hazard.source,
    note: hazard.note,
    reportedAt: hazard.reportedAt,
    updatedAt: hazard.updatedAt,
    expiresAt: hazard.expiresAt,
    active: hazard.active,
    confidence: hazard.confidence,
    confirmations: hazard.confirmations,
    nonConfirmations: hazard.nonConfirmations,
    lastConfirmedAt: hazard.lastConfirmedAt,
    languageSafetyLabel: hazard.languageSafetyLabel,
    duplicateSuppressionKey: hazard.duplicateSuppressionKey,
    secondsUntilExpiry: Math.max(0, Math.round((expiresAt - now) / 1000))
  };
}

async function listJson(kv, prefix) {
  const values = [];
  let cursor;
  do {
    const page = await kv.list({ prefix, cursor });
    for (const key of page.keys ?? []) {
      const value = await getJson(kv, key.name);
      if (value) values.push(value);
    }
    cursor = page.list_complete === false ? page.cursor : undefined;
  } while (cursor);
  return values;
}

async function getJson(kv, key) {
  const text = await kv.get(key);
  return text ? JSON.parse(text) : null;
}

async function putJson(kv, key, value) {
  await kv.put(key, JSON.stringify(value));
}

function json(body, status = 200, options = {}) {
  const headers = { "content-type": "application/json; charset=utf-8" };
  if (options.cookie) headers["set-cookie"] = options.cookie;
  return cors(new Response(JSON.stringify(body), { status, headers }));
}

function sessionCookie(name, token) {
  return `${name}=${token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${ACCESS_TOKEN_TTL_SECONDS}`;
}

function expiredSessionCookie(name) {
  return `${name}=; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=0`;
}

function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(/\s+/);
  return scheme?.toLowerCase() === "bearer" ? token : "";
}

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  for (const entry of cookie.split(";")) {
    const [rawName, ...parts] = entry.trim().split("=");
    if (rawName === name) return parts.join("=");
  }
  return "";
}

async function verifyJwt(env, token, key) {
  if (!key) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = await hmacSha256(key, unsigned);
  if (!constantTimeEqual(parts[2], expected)) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

async function hmacSha256(key, value) {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

function aiSigningKey(env) {
  return normalizeText(env.OUTREC_AI_JWT_SIGNING_KEY);
}

function base64UrlJson(value) {
  return base64UrlEncode(new TextEncoder().encode(JSON.stringify(value)));
}

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}

function normalizeApiPath(pathname) {
  if (pathname.startsWith("/dashboard/api/dp360/")) return `/dp360/${pathname.slice("/dashboard/api/dp360/".length)}`;
  if (pathname.startsWith("/dashboard/api/")) return pathname.slice("/dashboard/api".length);
  if (pathname.startsWith("/api/outrec/")) return pathname.slice("/api/outrec".length);
  if (pathname.startsWith("/api/")) return pathname.slice("/api".length);
  return null;
}

function normalizeEmail(value) {
  const email = normalizeText(value).toLowerCase();
  return email.includes("@") ? email : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function truncate(value, maxLength) {
  return normalizeText(value).slice(0, maxLength);
}

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  headers.set("access-control-allow-headers", "content-type,authorization,idempotency-key,x-lead-correlation-id,cf-access-jwt-assertion");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function distanceMeters(lat1, lon1, lat2, lon2) {
  const earthM = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function maxDistanceFrom(centroid, events) {
  return events.reduce((max, event) => Math.max(max, distanceMeters(centroid.lat, centroid.lon, event.lat, event.lon)), 0);
}

function cellKey(lat, lon) {
  return `${Math.round(lat * 100) / 100}:${Math.round(lon * 100) / 100}`;
}

function duplicateSuppressionKey(type, lat, lon) {
  return `${type}:${Math.round(lat * 1000) / 1000}:${Math.round(lon * 1000) / 1000}`;
}

function minuteBucket(now) {
  return Math.floor(now / 60000);
}

function tenMinuteBucket(now) {
  return Math.floor(now / (10 * 60000));
}

function safeId(id) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function randomId() {
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function iso(now) {
  return new Date(now).toISOString();
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function round6(value) {
  return Math.round(value * 1_000_000) / 1_000_000;
}
