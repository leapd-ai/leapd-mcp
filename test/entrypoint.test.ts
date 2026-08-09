import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, it } from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const entrypoint = join(here, "..", "src", "index.js");

const workDir = mkdtempSync(join(tmpdir(), "leapd-mcp-entry-"));
after(() => rmSync(workDir, { recursive: true, force: true }));

const INITIALIZE = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "entrypoint-test", version: "1.0.0" },
  },
});

interface Run {
  stdout: string;
  stderr: string;
  code: number | null;
}

/** Spawns the server, writes one request, and collects the reply. */
function launch(command: string, env: NodeJS.ProcessEnv): Promise<Run> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [command], {
      env: { ...process.env, ...env },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    child.on("close", (code) => resolve({ stdout, stderr, code }));

    child.stdin.write(`${INITIALIZE}\n`);
    child.stdin.end();

    setTimeout(() => child.kill(), 10_000).unref();
  });
}

describe("entrypoint", () => {
  it("serves MCP when launched directly", async () => {
    const run = await launch(entrypoint, { LEAPD_API_KEY: "leapd_test_key" });
    const reply = JSON.parse(run.stdout.trim().split("\n")[0] ?? "{}") as {
      result?: { serverInfo?: { name?: string } };
    };
    assert.equal(reply.result?.serverInfo?.name, "leapd");
  });

  it("serves MCP when launched through a symlink, as npx does", async () => {
    // Regression guard: comparing import.meta.url to an unresolved
    // process.argv[1] makes the server exit 0 without ever answering.
    const link = join(workDir, "leapd-mcp");
    symlinkSync(entrypoint, link);

    const run = await launch(link, { LEAPD_API_KEY: "leapd_test_key" });

    assert.ok(
      run.stdout.trim().length > 0,
      `server produced no output when run via symlink (exit ${run.code}, stderr: ${run.stderr})`,
    );
    const reply = JSON.parse(run.stdout.trim().split("\n")[0] ?? "{}") as {
      result?: { serverInfo?: { name?: string } };
    };
    assert.equal(reply.result?.serverInfo?.name, "leapd");
  });

  it("exits non-zero with guidance when the API key is missing", async () => {
    const run = await launch(entrypoint, { LEAPD_API_KEY: "" });
    assert.equal(run.code, 1);
    assert.match(run.stderr, /LEAPD_API_KEY is not set/);
    assert.match(run.stderr, /leapd\.ai/);
    assert.equal(run.stdout, "");
  });
});
