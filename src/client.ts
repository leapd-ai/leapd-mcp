/**
 * Thin HTTPS client for the Leapd API.
 *
 * Every tool in this server goes through `LeapdClient.call`. That keeps the
 * credential in exactly one place and makes the failure modes uniform.
 */

import type { LeapdConfig } from "./config.js";

/**
 * Single entry point for every operation.
 *
 * The operation travels in the request body rather than the path, so this
 * client is coupled to the wire format and not to Leapd's internal routing.
 * Server-side routing can change without shipping a new client.
 */
const MCP_ENDPOINT = "/mcp";

export class LeapdApiError extends Error {
  override readonly name = "LeapdApiError";

  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
  }
}

interface ApiErrorBody {
  error?: string;
  message?: string;
  detail?: string;
}

function readErrorMessage(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const { error, message, detail } = body as ApiErrorBody;
  return error ?? message ?? detail;
}

/**
 * Turns an HTTP failure into something the person reading the transcript can
 * act on. Status codes alone are useless inside an agent loop.
 */
function describeFailure(status: number, serverMessage: string | undefined): string {
  switch (status) {
    case 401:
      return (
        "Leapd rejected the API key. Check LEAPD_API_KEY, or create a new key at " +
        "https://leapd.ai/settings/api"
      );
    case 402:
      return (
        "This action needs an active Leapd plan. " +
        "Review your plan at https://leapd.ai/pricing"
      );
    case 403:
      return (
        serverMessage ??
        "Your Leapd account does not have access to this action. " +
          "Manage access at https://leapd.ai/dashboard"
      );
    case 404:
      return serverMessage ?? "Not found. Check the identifier and try again.";
    case 409:
      return serverMessage ?? "That conflicts with the current state of your workspace.";
    case 422:
      return serverMessage ?? "Leapd could not process those arguments.";
    case 429:
      return "Rate limited by Leapd. Wait a moment and retry.";
    default:
      if (status >= 500) {
        return (
          serverMessage ??
          `Leapd returned ${status}. This is usually transient — retry shortly. ` +
            "If it persists, contact support@leapd.ai"
        );
      }
      return serverMessage ?? `Leapd returned ${status}.`;
  }
}

export class LeapdClient {
  constructor(private readonly config: LeapdConfig) {}

  /**
   * Invokes one operation.
   *
   * Scope comes from the API key, not from the arguments — the caller cannot
   * name a workspace it does not own.
   *
   * @param op     Operation name, matching the MCP tool.
   * @param params Tool arguments.
   */
  async call(op: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const url = `${this.config.apiBase}${MCP_ENDPOINT}`;
    const payload = { op, params };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.apiKey}`,
          "content-type": "application/json",
          accept: "application/json",
          "user-agent": USER_AGENT,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (cause) {
      if (controller.signal.aborted) {
        throw new LeapdApiError(
          `Request to Leapd timed out after ${this.config.timeoutMs}ms. ` +
            "Long-running work keeps going on Leapd's side — check your dashboard.",
          408,
        );
      }
      // Never interpolate the request config here; it holds the API key.
      throw new LeapdApiError(
        `Could not reach the Leapd API at ${this.config.apiBase}. ` +
          `${cause instanceof Error ? cause.message : "Network error"}`,
        0,
      );
    } finally {
      clearTimeout(timer);
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;
    const body = await readJson(response);

    if (!response.ok) {
      throw new LeapdApiError(
        describeFailure(response.status, readErrorMessage(body)),
        response.status,
        requestId,
      );
    }

    return body;
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 2000) };
  }
}

const USER_AGENT = "leapd-mcp/1.0.0";
