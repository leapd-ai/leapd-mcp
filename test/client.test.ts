import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { LeapdApiError, LeapdClient } from "../src/client.js";
import type { LeapdConfig } from "../src/config.js";

const CONFIG: LeapdConfig = {
  apiKey: "leapd_live_secret_value",
  apiBase: "https://api.leapd.ai",
  timeoutMs: 1000,
};

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(
  handler: (url: string, init: RequestInit) => Response,
): { calls: Array<{ url: string; init: RequestInit }> } {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init: init ?? {} });
    return handler(url, init ?? {});
  }) as typeof fetch;
  return { calls };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("LeapdClient.call", () => {
  it("posts to the MCP route with bearer auth", async () => {
    const { calls } = stubFetch(() => json({ workspace_id: "ws_1" }));

    const result = await new LeapdClient(CONFIG).call("launch-business", { idea: "x" });

    assert.deepEqual(result, { workspace_id: "ws_1" });
    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.url, "https://api.leapd.ai/api/mcp/v1/launch-business");
    assert.equal(calls[0]!.init.method, "POST");

    const headers = calls[0]!.init.headers as Record<string, string>;
    assert.equal(headers["authorization"], `Bearer ${CONFIG.apiKey}`);
    assert.equal(calls[0]!.init.body, JSON.stringify({ idea: "x" }));
  });

  it("sends the key to the configured Leapd host only", async () => {
    const { calls } = stubFetch(() => json({}));
    await new LeapdClient(CONFIG).call("get-workspace");
    assert.equal(new URL(calls[0]!.url).hostname, "api.leapd.ai");
  });

  it("maps 401 to an actionable credential message", async () => {
    stubFetch(() => json({ error: "unauthorized" }, 401));

    await assert.rejects(
      () => new LeapdClient(CONFIG).call("get-workspace"),
      (error: unknown) => {
        assert.ok(error instanceof LeapdApiError);
        assert.equal(error.status, 401);
        assert.match(error.message, /LEAPD_API_KEY/);
        assert.match(error.message, /leapd\.ai\/settings\/api/);
        return true;
      },
    );
  });

  it("maps 402 to a plan message", async () => {
    stubFetch(() => json({}, 402));

    await assert.rejects(
      () => new LeapdClient(CONFIG).call("launch-business", {}),
      (error: unknown) => {
        assert.ok(error instanceof LeapdApiError);
        assert.match(error.message, /active Leapd plan/);
        return true;
      },
    );
  });

  it("never puts the API key in an error message", async () => {
    const cases: Array<() => Response> = [
      () => json({ error: "unauthorized" }, 401),
      () => json({ error: "boom" }, 500),
      () => json({ error: "nope" }, 403),
    ];

    for (const responder of cases) {
      stubFetch(responder);
      const error = await new LeapdClient(CONFIG)
        .call("get-workspace")
        .then(() => null)
        .catch((e: unknown) => e as Error);

      assert.ok(error);
      assert.ok(
        !error.message.includes(CONFIG.apiKey),
        `API key leaked into: ${error.message}`,
      );
    }
  });

  it("does not leak the key when the network fails", async () => {
    globalThis.fetch = (async () => {
      throw new Error("ECONNREFUSED");
    }) as typeof fetch;

    const error = await new LeapdClient(CONFIG)
      .call("get-workspace")
      .then(() => null)
      .catch((e: unknown) => e as Error);

    assert.ok(error);
    assert.ok(!error.message.includes(CONFIG.apiKey));
    assert.match(error.message, /Could not reach the Leapd API/);
  });

  it("tolerates a non-JSON body", async () => {
    stubFetch(() => new Response("<html>gateway</html>", { status: 502 }));

    await assert.rejects(
      () => new LeapdClient(CONFIG).call("get-workspace"),
      (error: unknown) => {
        assert.ok(error instanceof LeapdApiError);
        assert.equal(error.status, 502);
        return true;
      },
    );
  });

  it("surfaces the request id when the API provides one", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ error: "nope" }), {
          status: 500,
          headers: { "content-type": "application/json", "x-request-id": "req_42" },
        }),
    );

    await assert.rejects(
      () => new LeapdClient(CONFIG).call("get-workspace"),
      (error: unknown) => {
        assert.ok(error instanceof LeapdApiError);
        assert.equal(error.requestId, "req_42");
        return true;
      },
    );
  });
});
