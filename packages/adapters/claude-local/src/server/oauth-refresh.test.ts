import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  refreshClaudeAccessToken,
  refreshClaudeAccessTokenWithRetry,
  readClaudeOAuthCredentials,
  writeClaudeOAuthAccessToken,
  OAuthRefreshTerminalError,
  OAuthRefreshUnavailableError,
  CLAUDE_OAUTH_REFRESH_BACKOFF_MS,
} from "./quota.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchOnce(body: unknown, ok: boolean, status: number) {
  return { ok, status, json: async () => body } as Response;
}

// ---------------------------------------------------------------------------
// refreshClaudeAccessToken — single-call tests
// ---------------------------------------------------------------------------

describe("refreshClaudeAccessToken", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns tokens on 200 OK", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockFetchOnce(
        { access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600 },
        true,
        200,
      ),
    );
    const result = await refreshClaudeAccessToken("my-refresh", {
      tokenUrl: "https://example.com/token",
    });
    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
    expect(result.expiresAt).toBeGreaterThan(Date.now());
  });

  it("throws OAuthRefreshTerminalError on 401", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockFetchOnce({}, false, 401),
    );
    await expect(
      refreshClaudeAccessToken("my-refresh", { tokenUrl: "https://example.com/token" }),
    ).rejects.toThrow(OAuthRefreshTerminalError);
  });

  it("throws OAuthRefreshTerminalError on 429", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockFetchOnce({}, false, 429),
    );
    await expect(
      refreshClaudeAccessToken("my-refresh", { tokenUrl: "https://example.com/token" }),
    ).rejects.toThrow(OAuthRefreshTerminalError);
  });

  it("throws OAuthRefreshTerminalError when access_token missing from response", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockFetchOnce({ token_type: "bearer" }, true, 200),
    );
    await expect(
      refreshClaudeAccessToken("my-refresh", { tokenUrl: "https://example.com/token" }),
    ).rejects.toThrow(OAuthRefreshTerminalError);
  });
});

// ---------------------------------------------------------------------------
// refreshClaudeAccessTokenWithRetry — retry-with-backoff tests
// ---------------------------------------------------------------------------

describe("refreshClaudeAccessTokenWithRetry", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succeeds immediately on first 200 (no retries needed)", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockFetchOnce({ access_token: "tok-1", expires_in: 3600 }, true, 200),
    );
    const logs: string[] = [];
    const result = await refreshClaudeAccessTokenWithRetry("refresh-tok", {
      tokenUrl: "https://example.com/token",
      backoffMs: [10, 10, 10],
      onLog: async (_stream, chunk) => { logs.push(chunk); },
    });
    expect(result.accessToken).toBe("tok-1");
    // Should have logged 1 attempt + 1 success
    const events = logs.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    expect(events.some((e: Record<string, unknown>) => e.event === "adapter.claude_local.oauth_refresh_attempt" && e.attempt === 1)).toBe(true);
    expect(events.some((e: Record<string, unknown>) => e.event === "adapter.claude_local.oauth_refresh_success")).toBe(true);
  });

  it("retries on 429 and succeeds on third call (mocked 429 → 429 → 200 sequence)", async () => {
    const mockFn = fetch as ReturnType<typeof vi.fn>;
    mockFn
      .mockResolvedValueOnce(mockFetchOnce({}, false, 429))
      .mockResolvedValueOnce(mockFetchOnce({}, false, 429))
      .mockResolvedValueOnce(mockFetchOnce({ access_token: "tok-retry", expires_in: 7200 }, true, 200));

    const logs: string[] = [];
    const result = await refreshClaudeAccessTokenWithRetry("refresh-tok", {
      tokenUrl: "https://example.com/token",
      backoffMs: [1, 1, 1, 1],  // minimal delays for test speed
      onLog: async (_stream, chunk) => { logs.push(chunk); },
    });

    expect(result.accessToken).toBe("tok-retry");
    expect(mockFn).toHaveBeenCalledTimes(3);

    const events = logs.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const attempts = events.filter((e: Record<string, unknown>) => e.event === "adapter.claude_local.oauth_refresh_attempt");
    expect(attempts).toHaveLength(3);
    expect(attempts[0]!.attempt).toBe(1);
    expect(attempts[1]!.attempt).toBe(2);
    expect(attempts[2]!.attempt).toBe(3);

    // Two backoff logs
    const backoffs = events.filter((e: Record<string, unknown>) => e.event === "adapter.claude_local.oauth_refresh_backoff");
    expect(backoffs).toHaveLength(2);
  });

  it("retries on 401 and succeeds on second call (mocked 401 → 200 sequence)", async () => {
    const mockFn = fetch as ReturnType<typeof vi.fn>;
    mockFn
      .mockResolvedValueOnce(mockFetchOnce({}, false, 401))
      .mockResolvedValueOnce(mockFetchOnce({ access_token: "tok-ok", expires_in: 3600 }, true, 200));

    const result = await refreshClaudeAccessTokenWithRetry("refresh-tok", {
      tokenUrl: "https://example.com/token",
      backoffMs: [1, 1, 1],
    });
    expect(result.accessToken).toBe("tok-ok");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("throws OAuthRefreshUnavailableError after all retries are exhausted (all 429s)", async () => {
    const mockFn = fetch as ReturnType<typeof vi.fn>;
    // 5 calls all return 429 — exceeds the 4-element default backoff
    mockFn.mockResolvedValue(mockFetchOnce({}, false, 429));

    const logs: string[] = [];
    await expect(
      refreshClaudeAccessTokenWithRetry("refresh-tok", {
        tokenUrl: "https://example.com/token",
        backoffMs: [1, 1, 1],  // 3-element → 4 total attempts
        onLog: async (_stream, chunk) => { logs.push(chunk); },
      }),
    ).rejects.toThrow(OAuthRefreshUnavailableError);

    expect(mockFn).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it("OAuthRefreshUnavailableError carries correct attempt count", async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue(mockFetchOnce({}, false, 429));
    let caught: unknown;
    try {
      await refreshClaudeAccessTokenWithRetry("refresh-tok", {
        tokenUrl: "https://example.com/token",
        backoffMs: [1, 1],  // 2 retries → 3 total attempts
      });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(OAuthRefreshUnavailableError);
    expect((caught as OAuthRefreshUnavailableError).attempts).toBe(3);
  });

  it("uses CLAUDE_OAUTH_REFRESH_BACKOFF_MS by default", () => {
    // Verify the default schedule matches the spec (2s, 5s, 15s, 45s)
    expect(CLAUDE_OAUTH_REFRESH_BACKOFF_MS).toEqual([2_000, 5_000, 15_000, 45_000]);
  });
});

// ---------------------------------------------------------------------------
// readClaudeOAuthCredentials / writeClaudeOAuthAccessToken — filesystem tests
// ---------------------------------------------------------------------------

describe("readClaudeOAuthCredentials", () => {
  const savedEnv = process.env.CLAUDE_CONFIG_DIR;

  afterEach(() => {
    if (savedEnv === undefined) {
      delete process.env.CLAUDE_CONFIG_DIR;
    } else {
      process.env.CLAUDE_CONFIG_DIR = savedEnv;
    }
  });

  it("returns null when no credentials file exists", async () => {
    process.env.CLAUDE_CONFIG_DIR = "/tmp/__no_such_paperclip_dir_oauth__";
    expect(await readClaudeOAuthCredentials()).toBe(null);
  });

  it("returns credentials with refreshToken and expiresAt", async () => {
    const tmpDir = path.join(os.tmpdir(), `paperclip-test-oauth-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const expiresAt = Date.now() + 3600_000;
    await fs.writeFile(
      path.join(tmpDir, "credentials.json"),
      JSON.stringify({
        claudeAiOauth: {
          accessToken: "access-tok",
          refreshToken: "refresh-tok",
          expiresAt,
          subscriptionType: "claude_pro",
        },
      }),
    );
    process.env.CLAUDE_CONFIG_DIR = tmpDir;
    const creds = await readClaudeOAuthCredentials();
    expect(creds).not.toBeNull();
    expect(creds!.accessToken).toBe("access-tok");
    expect(creds!.refreshToken).toBe("refresh-tok");
    expect(creds!.expiresAt).toBe(expiresAt);
    await fs.rm(tmpDir, { recursive: true });
  });

  it("returns credentials with null refreshToken when field is absent", async () => {
    const tmpDir = path.join(os.tmpdir(), `paperclip-test-oauth-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, "credentials.json"),
      JSON.stringify({ claudeAiOauth: { accessToken: "access-only" } }),
    );
    process.env.CLAUDE_CONFIG_DIR = tmpDir;
    const creds = await readClaudeOAuthCredentials();
    expect(creds!.refreshToken).toBe(null);
    expect(creds!.expiresAt).toBe(null);
    await fs.rm(tmpDir, { recursive: true });
  });
});

describe("writeClaudeOAuthAccessToken", () => {
  it("writes the new accessToken and expiresAt while preserving other fields", async () => {
    const tmpDir = path.join(os.tmpdir(), `paperclip-test-oauth-write-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });
    const credPath = path.join(tmpDir, "credentials.json");
    const origExpiry = Date.now() - 1000;
    await fs.writeFile(
      credPath,
      JSON.stringify({
        claudeAiOauth: {
          accessToken: "old-access",
          refreshToken: "existing-refresh",
          expiresAt: origExpiry,
          subscriptionType: "claude_pro",
        },
        otherField: "preserved",
      }),
    );

    const newExpiry = Date.now() + 3600_000;
    await writeClaudeOAuthAccessToken(credPath, "new-access", newExpiry, "new-refresh");

    const updated = JSON.parse(await fs.readFile(credPath, "utf8")) as Record<string, unknown>;
    const oauth = updated.claudeAiOauth as Record<string, unknown>;
    expect(oauth.accessToken).toBe("new-access");
    expect(oauth.refreshToken).toBe("new-refresh");
    expect(oauth.expiresAt).toBe(newExpiry);
    expect(oauth.subscriptionType).toBe("claude_pro"); // preserved
    expect(updated.otherField).toBe("preserved");

    await fs.rm(tmpDir, { recursive: true });
  });
});
