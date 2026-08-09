/**
 * Configuration for the Leapd MCP server.
 *
 * The server reads exactly two environment variables and nothing else. It does
 * not load `.env` files, read credential stores, or inherit secrets from any
 * other tool. A Leapd API key is the only credential it will ever send.
 */

export const DEFAULT_API_BASE = "https://api.leapd.ai";

/** Hosts the API key may be transmitted to. */
const ALLOWED_HOST_PATTERNS: readonly RegExp[] = [
  /^(?:[a-z0-9-]+\.)*leapd\.ai$/i,
  /^localhost$/i,
  /^127\.0\.0\.1$/,
];

/** API keys issued by Leapd carry this prefix. */
const API_KEY_PREFIX = "leapd_";

export interface LeapdConfig {
  readonly apiKey: string;
  readonly apiBase: string;
  readonly timeoutMs: number;
}

export class ConfigError extends Error {
  override readonly name = "ConfigError";
}

/**
 * Resolves the base URL for the Leapd API.
 *
 * `LEAPD_API_BASE` exists so self-hosted and staging deployments work, but the
 * host is allowlisted: a misconfigured or attacker-supplied base URL must never
 * become a channel for sending the user's API key somewhere else.
 */
export function resolveApiBase(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return DEFAULT_API_BASE;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ConfigError(`LEAPD_API_BASE is not a valid URL: ${value}`);
  }

  const isLoopback = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !isLoopback) {
    throw new ConfigError(
      `LEAPD_API_BASE must use https (got "${url.protocol}//"). ` +
        "Plain http would transmit your API key in the clear.",
    );
  }

  if (!ALLOWED_HOST_PATTERNS.some((pattern) => pattern.test(url.hostname))) {
    throw new ConfigError(
      `LEAPD_API_BASE host "${url.hostname}" is not a Leapd host. ` +
        "Only *.leapd.ai (or localhost for development) is allowed, so your " +
        "API key cannot be sent to a third party.",
    );
  }

  return url.origin + url.pathname.replace(/\/+$/, "");
}

function resolveTimeout(raw: string | undefined): number {
  const value = Number.parseInt(raw?.trim() ?? "", 10);
  if (!Number.isFinite(value) || value <= 0) return 120_000;
  return Math.min(value, 600_000);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): LeapdConfig {
  const apiKey = env["LEAPD_API_KEY"]?.trim();

  if (!apiKey) {
    throw new ConfigError(
      "LEAPD_API_KEY is not set.\n\n" +
        "Create a key at https://leapd.ai/settings/api and pass it to the MCP server:\n" +
        "  claude mcp add leapd --env LEAPD_API_KEY=leapd_xxx -- npx -y @leapd/mcp\n\n" +
        "Don't have an account yet? Sign up at https://leapd.ai",
    );
  }

  if (!apiKey.startsWith(API_KEY_PREFIX)) {
    throw new ConfigError(
      `LEAPD_API_KEY does not look like a Leapd API key (expected it to start with "${API_KEY_PREFIX}").\n` +
        "Find yours at https://leapd.ai/settings/api",
    );
  }

  return {
    apiKey,
    apiBase: resolveApiBase(env["LEAPD_API_BASE"]),
    timeoutMs: resolveTimeout(env["LEAPD_TIMEOUT_MS"]),
  };
}
