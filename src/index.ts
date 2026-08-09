#!/usr/bin/env node
/**
 * Leapd MCP server — stdio transport.
 *
 * Connects an MCP client (Claude Code, Codex, or any other) to a Leapd account
 * so an agent can build and run a business end to end.
 *
 * Requires LEAPD_API_KEY. See https://leapd.ai
 */

import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { LeapdClient } from "./client.js";
import { ConfigError, loadConfig } from "./config.js";
import { registerTools } from "./tools.js";

export const SERVER_NAME = "leapd";
export const SERVER_VERSION = "1.0.0";

export { LeapdClient } from "./client.js";
export { loadConfig, type LeapdConfig } from "./config.js";

export function createServer(client: LeapdClient): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Leapd builds and runs businesses. Use launch_business to turn an idea into a live " +
        "workspace, then list_tasks / run_task to drive the daily plan and list_documents / " +
        "get_document to read what Leapd produced. Task execution happens on Leapd — these " +
        "tools dispatch and report, they do not run the work locally.",
    },
  );

  registerTools(server, client);
  return server;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const server = createServer(new LeapdClient(config));

  // stdout is the MCP channel — diagnostics must go to stderr.
  await server.connect(new StdioServerTransport());
  process.stderr.write(`leapd-mcp ${SERVER_VERSION} ready (${config.apiBase})\n`);
}

/**
 * True when this module was invoked as the process entrypoint.
 *
 * `process.argv[1]` is a symlink when the CLI runs through `npx` or a
 * `node_modules/.bin` shim, so the path has to be resolved before comparing —
 * a naive string compare silently skips `main()` and the server exits 0
 * without ever speaking MCP.
 */
function isEntrypoint(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(entry)).href;
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  main().catch((error: unknown) => {
    const message =
      error instanceof ConfigError
        ? error.message
        : error instanceof Error
          ? error.stack ?? error.message
          : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  });
}
