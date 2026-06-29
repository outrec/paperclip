import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { ProviderQuotaResult, QuotaWindow } from "@paperclipai/adapter-utils";

const execFileAsync = promisify(execFile);

const CLAUDE_USAGE_SOURCE_OAUTH = "anthropic-oauth";
const CLAUDE_USAGE_SOURCE_CLI = "claude-cli";

export function claudeConfigDir(): string {
  const fromEnv = process.env.CLAUDE_CONFIG_DIR;
  if (typeof fromEnv === "string" && fromEnv.trim().length > 0) return fromEnv.trim();
  return path.join(os.homedir(), ".claude");
}

function hasNonEmptyProcessEnv(key: string): boolean {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

function createClaudeQuotaEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value !== "string") continue;
    if (key.startsWith("ANTHROPIC_")) continue;
    env[key] = value;
  }
  return env;
}

function stripBackspaces(text: string): string {
  let out = "";
  for (const char of text) {
    if (char === "\b") {
      out = out.slice(0, -1);
    } else {
      out += char;
    }
  }
  return out;
}

function stripAnsi(text: string): string {
  return text
    .replace(/\u001B\][^\u0007]*(?:\u0007|\u001B\\)/g, "")
    .replace(/\u001B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

function cleanTerminalText(text: string): string {
  return stripAnsi(stripBackspaces(text))
    .replace(/\u0000/g, "")
    .replace(/\r/g, "\n");
}

function normalizeForLabelSearch(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function trimToLatestUsagePanel(text: string): string | null {
  const lower = text.toLowerCase();
  const settingsIndex = lower.lastIndexOf("settings:");
  if (settingsIndex < 0) return null;
  let tail = text.slice(settingsIndex);
  const tailLower = tail.toLowerCase();
  if (!tailLower.includes("usage")) return null;
  if (!tailLower.includes("current session") && !tailLower.includes("loading usage")) return null;
  const stopMarkers = [
    "status dialog dismissed",
    "checking for updates",
    "press ctrl-c again to exit",
  ];
  let stopIndex = -1;
  for (const marker of stopMarkers) {
    const markerIndex = tailLower.indexOf(marker);
    if (markerIndex >= 0 && (stopIndex === -1 || markerIndex < stopIndex)) {
      stopIndex = markerIndex;
    }
  }
  if (stopIndex >= 0) {
    tail = tail.slice(0, stopIndex);
  }
  return tail;
}

// ---------------------------------------------------------------------------
// OAuth credentials — read, refresh, and write back
// ---------------------------------------------------------------------------

/** Exponential backoff delays (ms) for Anthropic OAuth refresh endpoint failures.
 *  Total maximum delay: 2 + 5 + 15 + 45 = 67 s (well under the 90 s budget). */
export const CLAUDE_OAUTH_REFRESH_BACKOFF_MS = [2_000, 5_000, 15_000, 45_000] as const;

/** Anthropic Claude.ai OAuth token endpoint used for refresh-token exchanges. */
export const ANTHROPIC_OAUTH_TOKEN_URL = "https://auth.anthropic.com/oauth2/token";

export interface ClaudeOAuthCredentials {
  accessToken: string;
  refreshToken: string | null;
  /** Unix epoch milliseconds (undefined means unknown / never expires in our store). */
  expiresAt: number | null;
  /** Path of the credentials file this was read from (for writes). */
  credPath: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readClaudeCredentialsFile(
  credPath: string,
): Promise<{ raw: string; obj: Record<string, unknown> } | null> {
  let raw: string;
  try {
    raw = await fs.readFile(credPath, "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  return { raw, obj: parsed as Record<string, unknown> };
}

async function readClaudeTokenFromFile(credPath: string): Promise<string | null> {
  const result = await readClaudeCredentialsFile(credPath);
  if (!result) return null;
  const oauth = result.obj["claudeAiOauth"];
  if (typeof oauth !== "object" || oauth === null) return null;
  const token = (oauth as Record<string, unknown>)["accessToken"];
  return typeof token === "string" && token.length > 0 ? token : null;
}

/** Reads the full OAuth credentials block including refresh token and expiry.
 *  Returns null when no valid credentials file is found. */
export async function readClaudeOAuthCredentials(): Promise<ClaudeOAuthCredentials | null> {
  const configDir = claudeConfigDir();
  for (const filename of [".credentials.json", "credentials.json"]) {
    const credPath = path.join(configDir, filename);
    const result = await readClaudeCredentialsFile(credPath);
    if (!result) continue;
    const oauth = result.obj["claudeAiOauth"];
    if (typeof oauth !== "object" || oauth === null) continue;
    const oauthObj = oauth as Record<string, unknown>;
    const accessToken = typeof oauthObj["accessToken"] === "string" && oauthObj["accessToken"].trim().length > 0
      ? oauthObj["accessToken"].trim()
      : null;
    if (!accessToken) continue;
    const refreshToken = typeof oauthObj["refreshToken"] === "string" && oauthObj["refreshToken"].trim().length > 0
      ? oauthObj["refreshToken"].trim()
      : null;
    const rawExpiry = oauthObj["expiresAt"];
    const expiresAt = typeof rawExpiry === "number" && Number.isFinite(rawExpiry) ? rawExpiry : null;
    return { accessToken, refreshToken, expiresAt, credPath };
  }
  return null;
}

/** Writes the refreshed access token (and optional new expiry/refresh) back to
 *  the credentials file, preserving all other fields. */
export async function writeClaudeOAuthAccessToken(
  credPath: string,
  newAccessToken: string,
  newExpiresAt: number | null,
  newRefreshToken?: string | null,
): Promise<void> {
  const result = await readClaudeCredentialsFile(credPath);
  if (!result) {
    throw new Error(`Cannot update credentials: file not readable at ${credPath}`);
  }
  const obj = result.obj;
  const existingOauth =
    typeof obj["claudeAiOauth"] === "object" && obj["claudeAiOauth"] !== null
      ? (obj["claudeAiOauth"] as Record<string, unknown>)
      : {};
  obj["claudeAiOauth"] = {
    ...existingOauth,
    accessToken: newAccessToken,
    ...(newExpiresAt !== null ? { expiresAt: newExpiresAt } : {}),
    ...(newRefreshToken !== undefined && newRefreshToken !== null ? { refreshToken: newRefreshToken } : {}),
  };
  await fs.writeFile(credPath, JSON.stringify(obj, null, 2), "utf8");
}

/** Return value from a successful Anthropic OAuth token refresh. */
export interface OAuthRefreshResult {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;
}

/** Error thrown when the OAuth refresh endpoint returns a terminal failure (not retriable). */
export class OAuthRefreshTerminalError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "OAuthRefreshTerminalError";
  }
}

/** Error thrown when the OAuth refresh endpoint returns a transient 401/429 that exhausted all retries. */
export class OAuthRefreshUnavailableError extends Error {
  constructor(
    public readonly attempts: number,
    message: string,
  ) {
    super(message);
    this.name = "OAuthRefreshUnavailableError";
  }
}

interface OAuthRefreshOptions {
  /** Override the token endpoint URL (useful for tests). */
  tokenUrl?: string;
  /** Override the backoff schedule in ms. */
  backoffMs?: readonly number[];
  /** Structured log callback — called on each attempt. */
  onLog?: (stream: "stdout" | "stderr", chunk: string) => Promise<void>;
}

/** Calls the Anthropic OAuth token refresh endpoint once and returns the new tokens.
 *  Throws OAuthRefreshTerminalError for non-retriable failures, or re-throws the
 *  raw error for unexpected network errors. */
export async function refreshClaudeAccessToken(
  refreshToken: string,
  options?: Pick<OAuthRefreshOptions, "tokenUrl">,
): Promise<OAuthRefreshResult> {
  const tokenUrl = options?.tokenUrl ?? ANTHROPIC_OAUTH_TOKEN_URL;
  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", refreshToken);

  const resp = await fetchWithTimeout(
    tokenUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    },
    15_000,
  );

  if (!resp.ok) {
    throw new OAuthRefreshTerminalError(
      resp.status,
      `Anthropic OAuth refresh returned ${resp.status}`,
    );
  }

  const json = (await resp.json()) as Record<string, unknown>;
  const accessToken = typeof json["access_token"] === "string" ? json["access_token"] : null;
  if (!accessToken) {
    throw new OAuthRefreshTerminalError(0, "Anthropic OAuth refresh response missing access_token");
  }
  const newRefreshToken = typeof json["refresh_token"] === "string" ? json["refresh_token"] : null;
  const expiresIn = typeof json["expires_in"] === "number" ? json["expires_in"] : null;
  const expiresAt = expiresIn !== null ? Date.now() + expiresIn * 1000 : null;

  return { accessToken, refreshToken: newRefreshToken, expiresAt };
}

/** Retries `refreshClaudeAccessToken` with exponential backoff on transient 401/429 responses.
 *  Emits a structured log line on each attempt.
 *  Throws `OAuthRefreshUnavailableError` if all retries are exhausted. */
export async function refreshClaudeAccessTokenWithRetry(
  refreshToken: string,
  opts: OAuthRefreshOptions = {},
): Promise<OAuthRefreshResult> {
  const backoff = opts.backoffMs ?? CLAUDE_OAUTH_REFRESH_BACKOFF_MS;
  const onLog = opts.onLog ?? (async () => {});
  const tokenUrl = opts.tokenUrl ?? ANTHROPIC_OAUTH_TOKEN_URL;

  let lastStatus: number | null = null;

  for (let attempt = 0; attempt <= backoff.length; attempt++) {
    const isRetry = attempt > 0;
    await onLog(
      "stdout",
      JSON.stringify({
        event: "adapter.claude_local.oauth_refresh_attempt",
        attempt: attempt + 1,
        maxAttempts: backoff.length + 1,
        isRetry,
      }) + "\n",
    );

    try {
      const result = await refreshClaudeAccessToken(refreshToken, { tokenUrl });
      await onLog(
        "stdout",
        JSON.stringify({
          event: "adapter.claude_local.oauth_refresh_success",
          attempt: attempt + 1,
        }) + "\n",
      );
      return result;
    } catch (err) {
      if (err instanceof OAuthRefreshTerminalError) {
        lastStatus = err.status;
        const isTransient = err.status === 401 || err.status === 429;
        await onLog(
          "stdout",
          JSON.stringify({
            event: "adapter.claude_local.oauth_refresh_failed",
            attempt: attempt + 1,
            status: err.status,
            isTransient,
            message: err.message,
          }) + "\n",
        );
        if (!isTransient || attempt >= backoff.length) break;
        const delayMs = backoff[attempt]!;
        await onLog(
          "stdout",
          JSON.stringify({
            event: "adapter.claude_local.oauth_refresh_backoff",
            attempt: attempt + 1,
            delayMs,
          }) + "\n",
        );
        await sleep(delayMs);
        continue;
      }
      // Non-terminal error (network, timeout) — propagate immediately
      throw err;
    }
  }

  throw new OAuthRefreshUnavailableError(
    backoff.length + 1,
    `Anthropic OAuth refresh endpoint unavailable after ${backoff.length + 1} attempt(s)` +
      (lastStatus !== null ? ` (last HTTP status: ${lastStatus})` : ""),
  );
}

interface ClaudeAuthStatus {
  loggedIn: boolean;
  authMethod: string | null;
  subscriptionType: string | null;
}

export async function readClaudeAuthStatus(): Promise<ClaudeAuthStatus | null> {
  try {
    const { stdout } = await execFileAsync("claude", ["auth", "status"], {
      env: process.env,
      timeout: 5_000,
      maxBuffer: 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    return {
      loggedIn: parsed.loggedIn === true,
      authMethod: typeof parsed.authMethod === "string" ? parsed.authMethod : null,
      subscriptionType: typeof parsed.subscriptionType === "string" ? parsed.subscriptionType : null,
    };
  } catch {
    return null;
  }
}

function describeClaudeSubscriptionAuth(status: ClaudeAuthStatus | null): string | null {
  if (!status?.loggedIn || status.authMethod !== "claude.ai") return null;
  return status.subscriptionType
    ? `Claude is logged in via claude.ai (${status.subscriptionType})`
    : "Claude is logged in via claude.ai";
}

export async function readClaudeToken(): Promise<string | null> {
  const configDir = claudeConfigDir();
  for (const filename of [".credentials.json", "credentials.json"]) {
    const token = await readClaudeTokenFromFile(path.join(configDir, filename));
    if (token) return token;
  }
  return null;
}

interface AnthropicUsageWindow {
  utilization?: number | null;
  resets_at?: string | null;
}

interface AnthropicExtraUsage {
  is_enabled?: boolean | null;
  monthly_limit?: number | null;
  used_credits?: number | null;
  utilization?: number | null;
  currency?: string | null;
}

interface AnthropicUsageResponse {
  five_hour?: AnthropicUsageWindow | null;
  seven_day?: AnthropicUsageWindow | null;
  seven_day_sonnet?: AnthropicUsageWindow | null;
  seven_day_opus?: AnthropicUsageWindow | null;
  extra_usage?: AnthropicExtraUsage | null;
}

function formatCurrencyAmount(value: number, currency: string | null | undefined): string {
  const code = typeof currency === "string" && currency.trim().length > 0 ? currency.trim().toUpperCase() : "USD";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatExtraUsageLabel(extraUsage: AnthropicExtraUsage): string | null {
  const monthlyLimit = extraUsage.monthly_limit;
  const usedCredits = extraUsage.used_credits;
  if (
    typeof monthlyLimit !== "number" ||
    !Number.isFinite(monthlyLimit) ||
    typeof usedCredits !== "number" ||
    !Number.isFinite(usedCredits)
  ) {
    return null;
  }
  // API returns values in cents — convert to dollars for display
  return `${formatCurrencyAmount(usedCredits / 100, extraUsage.currency)} / ${formatCurrencyAmount(monthlyLimit / 100, extraUsage.currency)}`;
}

/** Convert a utilization value to a 0-100 integer percent. Returns null for null/undefined input.
 *  Handles both 0-1 fractions (legacy) and 0-100 percentages (current API). */
export function toPercent(utilization: number | null | undefined): number | null {
  if (utilization == null) return null;
  return Math.min(100, Math.round(utilization < 1 ? utilization * 100 : utilization));
}

/** fetch with an abort-based timeout so a hanging provider api doesn't block the response indefinitely */
export async function fetchWithTimeout(url: string, init: RequestInit, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchClaudeQuota(token: string): Promise<QuotaWindow[]> {
  const resp = await fetchWithTimeout("https://api.anthropic.com/api/oauth/usage", {
    headers: {
      Authorization: `Bearer ${token}`,
      "anthropic-beta": "oauth-2025-04-20",
    },
  });
  if (!resp.ok) throw new Error(`anthropic usage api returned ${resp.status}`);
  const body = (await resp.json()) as AnthropicUsageResponse;
  const windows: QuotaWindow[] = [];

  if (body.five_hour != null) {
    windows.push({
      label: "Current session",
      usedPercent: toPercent(body.five_hour.utilization),
      resetsAt: body.five_hour.resets_at ?? null,
      valueLabel: null,
      detail: null,
    });
  }
  if (body.seven_day != null) {
    windows.push({
      label: "Current week (all models)",
      usedPercent: toPercent(body.seven_day.utilization),
      resetsAt: body.seven_day.resets_at ?? null,
      valueLabel: null,
      detail: null,
    });
  }
  if (body.seven_day_sonnet != null) {
    windows.push({
      label: "Current week (Sonnet only)",
      usedPercent: toPercent(body.seven_day_sonnet.utilization),
      resetsAt: body.seven_day_sonnet.resets_at ?? null,
      valueLabel: null,
      detail: null,
    });
  }
  if (body.seven_day_opus != null) {
    windows.push({
      label: "Current week (Opus only)",
      usedPercent: toPercent(body.seven_day_opus.utilization),
      resetsAt: body.seven_day_opus.resets_at ?? null,
      valueLabel: null,
      detail: null,
    });
  }
  if (body.extra_usage != null) {
    windows.push({
      label: "Extra usage",
      usedPercent: body.extra_usage.is_enabled === false ? null : toPercent(body.extra_usage.utilization),
      resetsAt: null,
      valueLabel:
        body.extra_usage.is_enabled === false
          ? "Not enabled"
          : formatExtraUsageLabel(body.extra_usage),
      detail:
        body.extra_usage.is_enabled === false
          ? "Extra usage not enabled"
          : "Monthly extra usage pool",
    });
  }
  return windows;
}

function usageOutputLooksRelevant(text: string): boolean {
  const normalized = normalizeForLabelSearch(text);
  return normalized.includes("currentsession")
    || normalized.includes("currentweek")
    || normalized.includes("loadingusage")
    || normalized.includes("failedtoloadusagedata")
    || normalized.includes("tokenexpired")
    || normalized.includes("authenticationerror")
    || normalized.includes("ratelimited");
}

function usageOutputLooksComplete(text: string): boolean {
  const normalized = normalizeForLabelSearch(text);
  if (
    normalized.includes("failedtoloadusagedata")
    || normalized.includes("tokenexpired")
    || normalized.includes("authenticationerror")
    || normalized.includes("ratelimited")
  ) {
    return true;
  }
  return normalized.includes("currentsession")
    && (normalized.includes("currentweek") || normalized.includes("extrausage"))
    && /[0-9]{1,3}(?:\.[0-9]+)?%/i.test(text);
}

function extractUsageError(text: string): string | null {
  const lower = text.toLowerCase();
  const compact = lower.replace(/\s+/g, "");
  if (lower.includes("token_expired") || lower.includes("token has expired")) {
    return "Claude CLI token expired. Run `claude login` to refresh.";
  }
  if (lower.includes("authentication_error")) {
    return "Claude CLI authentication error. Run `claude login`.";
  }
  if (lower.includes("rate_limit_error") || lower.includes("rate limited") || compact.includes("ratelimited")) {
    return "Claude CLI usage endpoint is rate limited right now. Please try again later.";
  }
  if (lower.includes("failed to load usage data") || compact.includes("failedtoloadusagedata")) {
    return "Claude CLI could not load usage data. Open the CLI and retry `/usage`.";
  }
  return null;
}

function percentFromLine(line: string): number | null {
  const match = line.match(/([0-9]{1,3}(?:\.[0-9]+)?)\s*%/i);
  if (!match) return null;
  const rawValue = Number(match[1]);
  if (!Number.isFinite(rawValue)) return null;
  const clamped = Math.min(100, Math.max(0, rawValue));
  const lower = line.toLowerCase();
  if (lower.includes("remaining") || lower.includes("left") || lower.includes("available")) {
    return Math.max(0, Math.min(100, Math.round(100 - clamped)));
  }
  return Math.round(clamped);
}

function isQuotaLabel(line: string): boolean {
  const normalized = normalizeForLabelSearch(line);
  return normalized === "currentsession"
    || normalized === "currentweekallmodels"
    || normalized === "currentweeksonnetonly"
    || normalized === "currentweeksonnet"
    || normalized === "currentweekopusonly"
    || normalized === "currentweekopus"
    || normalized === "extrausage";
}

function canonicalQuotaLabel(line: string): string {
  switch (normalizeForLabelSearch(line)) {
    case "currentsession":
      return "Current session";
    case "currentweekallmodels":
      return "Current week (all models)";
    case "currentweeksonnetonly":
    case "currentweeksonnet":
      return "Current week (Sonnet only)";
    case "currentweekopusonly":
    case "currentweekopus":
      return "Current week (Opus only)";
    case "extrausage":
      return "Extra usage";
    default:
      return line;
  }
}

function formatClaudeCliDetail(label: string, lines: string[]): string | null {
  const normalizedLabel = normalizeForLabelSearch(label);
  if (normalizedLabel === "extrausage") {
    const compact = lines.join(" ").replace(/\s+/g, "").toLowerCase();
    if (compact.includes("extrausagenotenabled")) {
      return "Extra usage not enabled • /extra-usage to enable";
    }
    const firstLine = lines.find((line) => line.trim().length > 0) ?? null;
    return firstLine;
  }

  const resetLine = lines.find((line) => /^resets/i.test(line) || normalizeForLabelSearch(line).startsWith("resets"));
  if (!resetLine) return null;
  return resetLine
    .replace(/^Resets/i, "Resets ")
    .replace(/([A-Z][a-z]{2})(\d)/g, "$1 $2")
    .replace(/(\d)at(\d)/g, "$1 at $2")
    .replace(/(am|pm)\(/gi, "$1 (")
    .replace(/([A-Za-z])\(/g, "$1 (")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseClaudeCliUsageText(text: string): QuotaWindow[] {
  const cleaned = trimToLatestUsagePanel(cleanTerminalText(text)) ?? cleanTerminalText(text);
  const usageError = extractUsageError(cleaned);
  if (usageError) throw new Error(usageError);

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const sections: Array<{ label: string; lines: string[] }> = [];
  let current: { label: string; lines: string[] } | null = null;

  for (const line of lines) {
    if (isQuotaLabel(line)) {
      if (current) sections.push(current);
      current = { label: canonicalQuotaLabel(line), lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) sections.push(current);

  const windows = sections.map<QuotaWindow>((section) => {
    const usedPercent = section.lines.map(percentFromLine).find((value) => value != null) ?? null;
    return {
      label: section.label,
      usedPercent,
      resetsAt: null,
      valueLabel: null,
      detail: formatClaudeCliDetail(section.label, section.lines),
    };
  });

  if (!windows.some((window) => normalizeForLabelSearch(window.label) === "currentsession")) {
    throw new Error("Could not parse Claude CLI usage output.");
  }
  return windows;
}

function quoteForShell(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function buildClaudeCliShellProbeCommand(): string {
  const feed = "(sleep 2; printf '/usage\\r'; sleep 6; printf '\\033'; sleep 1; printf '\\003')";
  const claudeCommand = "claude --tools \"\"";
  if (process.platform === "darwin") {
    return `${feed} | script -q /dev/null ${claudeCommand}`;
  }
  return `${feed} | script -q -e -f -c ${quoteForShell(claudeCommand)} /dev/null`;
}

export async function captureClaudeCliUsageText(timeoutMs = 12_000): Promise<string> {
  const command = buildClaudeCliShellProbeCommand();
  try {
    const { stdout, stderr } = await execFileAsync("sh", ["-c", command], {
      env: createClaudeQuotaEnv(),
      timeout: timeoutMs,
      maxBuffer: 8 * 1024 * 1024,
    });
    const output = `${stdout}${stderr}`;
    const cleaned = cleanTerminalText(output);
    if (usageOutputLooksComplete(cleaned)) return output;
    throw new Error("Claude CLI usage probe ended before rendering usage.");
  } catch (error) {
    const stdout =
      typeof error === "object" && error !== null && "stdout" in error && typeof error.stdout === "string"
        ? error.stdout
        : "";
    const stderr =
      typeof error === "object" && error !== null && "stderr" in error && typeof error.stderr === "string"
        ? error.stderr
        : "";
    const output = `${stdout}${stderr}`;
    const cleaned = cleanTerminalText(output);
    if (usageOutputLooksComplete(cleaned)) return output;
    if (usageOutputLooksRelevant(cleaned)) {
      throw new Error("Claude CLI usage probe ended before rendering usage.");
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function fetchClaudeCliQuota(): Promise<QuotaWindow[]> {
  const rawText = await captureClaudeCliUsageText();
  return parseClaudeCliUsageText(rawText);
}

function formatProviderError(source: string, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return `${source}: ${message}`;
}

export async function getQuotaWindows(): Promise<ProviderQuotaResult> {
  if (
    process.env.CLAUDE_CODE_USE_BEDROCK === "1" ||
    process.env.CLAUDE_CODE_USE_BEDROCK === "true" ||
    hasNonEmptyProcessEnv("ANTHROPIC_BEDROCK_BASE_URL")
  ) {
    return { provider: "anthropic", source: "bedrock", ok: true, windows: [] };
  }

  const authStatus = await readClaudeAuthStatus();
  const authDescription = describeClaudeSubscriptionAuth(authStatus);
  const token = await readClaudeToken();

  const errors: string[] = [];

  if (token) {
    try {
      const windows = await fetchClaudeQuota(token);
      return { provider: "anthropic", source: CLAUDE_USAGE_SOURCE_OAUTH, ok: true, windows };
    } catch (error) {
      errors.push(formatProviderError("Anthropic OAuth usage", error));
    }
  }

  try {
    const windows = await fetchClaudeCliQuota();
    return { provider: "anthropic", source: CLAUDE_USAGE_SOURCE_CLI, ok: true, windows };
  } catch (error) {
    errors.push(formatProviderError("Claude CLI /usage", error));
  }

  if (hasNonEmptyProcessEnv("ANTHROPIC_API_KEY") && !authDescription) {
    return {
      provider: "anthropic",
      ok: false,
      error:
        errors[0]
        ?? "ANTHROPIC_API_KEY is set and no local Claude subscription session is available for quota polling",
      windows: [],
    };
  }

  if (authDescription) {
    return {
      provider: "anthropic",
      ok: false,
      error:
        errors.length > 0
          ? `${authDescription}, but quota polling failed (${errors.join("; ")})`
          : `${authDescription}, but Paperclip could not load subscription quota data`,
      windows: [],
    };
  }

  return {
    provider: "anthropic",
    ok: false,
    error: errors[0] ?? "no local claude auth token",
    windows: [],
  };
}
