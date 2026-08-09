/**
 * Tool surface for the Leapd MCP server.
 *
 * Six tools, one job: let an agent stand up a business on Leapd and drive the
 * daily work it generates. Each tool maps to a single Leapd API endpoint.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { LeapdApiError, type LeapdClient } from "./client.js";

const workspaceId = z
  .string()
  .min(1)
  .describe("Workspace id. Omit to use the default workspace on the account.");

/** Renders a successful API payload for the model. */
function ok(data: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

/** Renders a failure. `isError` lets the client retry or surface it. */
function fail(error: unknown): CallToolResult {
  const message =
    error instanceof LeapdApiError
      ? error.requestId
        ? `${error.message} (request ${error.requestId})`
        : error.message
      : error instanceof Error
        ? error.message
        : "Unknown error";

  return { content: [{ type: "text", text: message }], isError: true };
}

/** Wraps a call so a failed request becomes a tool error, not a crash. */
async function run(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return ok(await fn());
  } catch (error) {
    return fail(error);
  }
}

export function registerTools(server: McpServer, client: LeapdClient): void {
  server.registerTool(
    "launch_business",
    {
      title: "Launch a business",
      description:
        "Turn an idea into a live business on Leapd: positioning, a deployed landing page, " +
        "and a day-one plan of concrete tasks. Returns the workspace id and its public URL. " +
        "Call this once per business — use get_workspace afterwards.",
      inputSchema: {
        idea: z
          .string()
          .min(10)
          .max(4000)
          .describe("What the business does, who it is for, and how it makes money."),
        name: z.string().min(1).max(80).optional().describe("Business name, if you have one."),
        website: z
          .string()
          .url()
          .optional()
          .describe("Existing website, if this business already trades."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async (args) => run(() => client.call("launch-business", args)),
  );

  server.registerTool(
    "get_workspace",
    {
      title: "Get workspace status",
      description:
        "Current state of a business: live URL, deployment and domain status, plan day, " +
        "and a summary of what is in flight.",
      inputSchema: { workspace_id: workspaceId.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => run(() => client.call("get-workspace", args)),
  );

  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description:
        "The current plan for a business — what is queued, running, blocked, or done. " +
        "Blocked tasks include the reason so you know what to unblock.",
      inputSchema: {
        workspace_id: workspaceId.optional(),
        status: z
          .enum(["queued", "running", "blocked", "done", "failed"])
          .optional()
          .describe("Filter by status. Omit for everything on the current plan."),
        limit: z.number().int().min(1).max(100).default(25).describe("Maximum tasks to return."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => run(() => client.call("list-tasks", args)),
  );

  server.registerTool(
    "create_task",
    {
      title: "Create a task",
      description:
        "Add work to a business's plan — a page to build, a piece of research, a fix. " +
        "The task is executed by Leapd, not by this MCP server.",
      inputSchema: {
        workspace_id: workspaceId.optional(),
        title: z.string().min(3).max(200).describe("Short summary of the work."),
        details: z
          .string()
          .max(8000)
          .optional()
          .describe("Full brief: goal, constraints, and what 'done' looks like."),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async (args) => run(() => client.call("create-task", args)),
  );

  server.registerTool(
    "run_task",
    {
      title: "Run a task now",
      description:
        "Start a queued task immediately instead of waiting for its scheduled slot. " +
        "Returns as soon as the task is dispatched — poll list_tasks for the outcome.",
      inputSchema: {
        task_id: z.string().min(1).describe("Task id from list_tasks or create_task."),
        workspace_id: workspaceId.optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    },
    async (args) => run(() => client.call("run-task", args)),
  );

  server.registerTool(
    "list_documents",
    {
      title: "List documents",
      description:
        "Artifacts Leapd has produced for a business — positioning, customer profile, " +
        "roadmap, research. Returns slugs and titles; use get_document to read one.",
      inputSchema: { workspace_id: workspaceId.optional() },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => run(() => client.call("list-documents", args)),
  );

  server.registerTool(
    "get_document",
    {
      title: "Read a document",
      description: "Full contents of one document produced for a business.",
      inputSchema: {
        slug: z.string().min(1).describe("Document slug from list_documents."),
        workspace_id: workspaceId.optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => run(() => client.call("get-document", args)),
  );
}
