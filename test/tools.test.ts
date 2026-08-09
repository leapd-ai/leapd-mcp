import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { LeapdClient } from "../src/client.js";
import type { LeapdConfig } from "../src/config.js";
import { createServer, SERVER_NAME, SERVER_VERSION } from "../src/index.js";

const CONFIG: LeapdConfig = {
  apiKey: "leapd_live_secret_value",
  apiBase: "https://api.leapd.ai",
  timeoutMs: 1000,
};

const EXPECTED_TOOLS = [
  "create_task",
  "get_document",
  "get_workspace",
  "launch_business",
  "list_documents",
  "list_tasks",
  "run_task",
];

/** Boots the server against an in-memory client, with `fetch` stubbed out. */
async function connect(
  respond: () => Response = () => new Response("{}", { status: 200 }),
): Promise<{ client: Client; close: () => Promise<void> }> {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => respond()) as typeof fetch;

  const server = createServer(new LeapdClient(CONFIG));
  const client = new Client({ name: "test", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

  return {
    client,
    close: async () => {
      globalThis.fetch = realFetch;
      await client.close();
      await server.close();
    },
  };
}

describe("server", () => {
  it("advertises its identity", async () => {
    const { client, close } = await connect();
    try {
      assert.deepEqual(client.getServerVersion(), {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      });
    } finally {
      await close();
    }
  });

  it("exposes exactly the documented tools", async () => {
    const { client, close } = await connect();
    try {
      const { tools } = await client.listTools();
      assert.deepEqual(
        tools.map((tool) => tool.name).sort(),
        EXPECTED_TOOLS,
      );
    } finally {
      await close();
    }
  });

  it("gives every tool a description and an input schema", async () => {
    const { client, close } = await connect();
    try {
      const { tools } = await client.listTools();
      for (const tool of tools) {
        assert.ok(tool.description, `${tool.name} has no description`);
        assert.ok(
          (tool.description?.length ?? 0) > 40,
          `${tool.name} description is too thin to route on`,
        );
        assert.equal(tool.inputSchema.type, "object", `${tool.name} has no object schema`);
      }
    } finally {
      await close();
    }
  });

  it("rejects arguments that do not match the schema", async () => {
    const { client, close } = await connect();
    try {
      const result = await client.callTool({
        name: "launch_business",
        arguments: { idea: "short" }, // below the 10-character minimum
      });
      assert.equal(result.isError, true);
    } finally {
      await close();
    }
  });

  it("returns an API failure as a tool error rather than throwing", async () => {
    const { client, close } = await connect(
      () => new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 }),
    );
    try {
      const result = await client.callTool({
        name: "get_workspace",
        arguments: {},
      });

      assert.equal(result.isError, true);
      const [block] = result.content as Array<{ type: string; text: string }>;
      assert.match(block!.text, /LEAPD_API_KEY/);
      assert.ok(!block!.text.includes(CONFIG.apiKey));
    } finally {
      await close();
    }
  });

  it("passes a successful payload straight through", async () => {
    const { client, close } = await connect(
      () =>
        new Response(JSON.stringify({ workspace_id: "ws_1", url: "https://acme.leapd.app" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    try {
      const result = await client.callTool({
        name: "get_workspace",
        arguments: {},
      });

      assert.notEqual(result.isError, true);
      const [block] = result.content as Array<{ type: string; text: string }>;
      assert.deepEqual(JSON.parse(block!.text), {
        workspace_id: "ws_1",
        url: "https://acme.leapd.app",
      });
    } finally {
      await close();
    }
  });
});
