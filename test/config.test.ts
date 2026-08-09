import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ConfigError, DEFAULT_API_BASE, loadConfig, resolveApiBase } from "../src/config.js";

const KEY = "leapd_live_abc123";

describe("resolveApiBase", () => {
  it("defaults to the public API", () => {
    assert.equal(resolveApiBase(undefined), DEFAULT_API_BASE);
    assert.equal(resolveApiBase("   "), DEFAULT_API_BASE);
  });

  it("accepts Leapd hosts and strips trailing slashes", () => {
    assert.equal(resolveApiBase("https://api.leapd.ai/"), "https://api.leapd.ai");
    assert.equal(resolveApiBase("https://staging.leapd.ai"), "https://staging.leapd.ai");
  });

  it("accepts loopback over http for local development", () => {
    assert.equal(resolveApiBase("http://localhost:8000"), "http://localhost:8000");
  });

  it("rejects non-Leapd hosts so the key cannot be exfiltrated", () => {
    assert.throws(() => resolveApiBase("https://evil.example.com"), ConfigError);
    // Suffix confusion must not slip through.
    assert.throws(() => resolveApiBase("https://leapd.ai.evil.com"), ConfigError);
    assert.throws(() => resolveApiBase("https://notleapd.ai"), ConfigError);
  });

  it("rejects plaintext http to a remote host", () => {
    assert.throws(() => resolveApiBase("http://api.leapd.ai"), ConfigError);
  });

  it("rejects malformed URLs", () => {
    assert.throws(() => resolveApiBase("not a url"), ConfigError);
  });
});

describe("loadConfig", () => {
  it("requires an API key", () => {
    assert.throws(() => loadConfig({}), ConfigError);
  });

  it("rejects keys that are not Leapd keys", () => {
    assert.throws(() => loadConfig({ LEAPD_API_KEY: "sk-live-something" }), ConfigError);
  });

  it("reads only the documented variables", () => {
    const config = loadConfig({
      LEAPD_API_KEY: KEY,
      LEAPD_API_BASE: "https://staging.leapd.ai",
      LEAPD_TIMEOUT_MS: "5000",
      // Credentials belonging to other tools must never be picked up.
      SOME_OTHER_API_KEY: "must-never-be-read",
      SOME_OTHER_ACCESS_TOKEN: "must-never-be-read",
    });

    assert.deepEqual(config, {
      apiKey: KEY,
      apiBase: "https://staging.leapd.ai",
      timeoutMs: 5000,
    });
  });

  it("falls back to a sane timeout and caps it", () => {
    assert.equal(loadConfig({ LEAPD_API_KEY: KEY }).timeoutMs, 120_000);
    assert.equal(loadConfig({ LEAPD_API_KEY: KEY, LEAPD_TIMEOUT_MS: "0" }).timeoutMs, 120_000);
    assert.equal(
      loadConfig({ LEAPD_API_KEY: KEY, LEAPD_TIMEOUT_MS: "99999999" }).timeoutMs,
      600_000,
    );
  });
});
