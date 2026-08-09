<div align="center">

# Leapd MCP

**Build and run a business from your terminal.**

The official [Model Context Protocol](https://modelcontextprotocol.io) server for [Leapd](https://leapd.ai) — connect Claude Code or Codex to a Leapd account and ship a real business: positioning, a live site, and a daily plan that executes itself.

[![npm](https://img.shields.io/npm/v/%40leapd%2Fmcp?color=111827&labelColor=111827)](https://www.npmjs.com/package/@leapd/mcp)
[![node](https://img.shields.io/node/v/%40leapd%2Fmcp?color=111827&labelColor=111827)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/%40leapd%2Fmcp?color=111827&labelColor=111827)](./LICENSE)

[**leapd.ai**](https://leapd.ai) · [Get an API key](https://leapd.ai/settings/api) · [Docs](https://leapd.ai/docs)

</div>

---

```
you    ▸  launch a business that sells CO₂-sensor calibration kits to labs
leapd  ▸  positioning + ICP written
          landing page deployed → https://calibra.leapd.app
          day 1 plan: 6 tasks queued
you    ▸  run the pricing-page task now
leapd  ▸  done — pricing page live, 3 tiers
```

Everything above happens inside your editor. Leapd does the work; this server is the wire.

## Requirements

- **Node.js 20+**
- A **Leapd account with an active plan** — [sign up at leapd.ai](https://leapd.ai)
- A **Leapd API key** from [leapd.ai/settings/api](https://leapd.ai/settings/api)

## Install

### Claude Code

```bash
claude mcp add leapd --env LEAPD_API_KEY=leapd_your_key -- npx -y @leapd/mcp
```

Then `/mcp` inside Claude Code to confirm `leapd` is connected.

To share the server with your team, commit a `.mcp.json` at the repo root instead:

```json
{
  "mcpServers": {
    "leapd": {
      "command": "npx",
      "args": ["-y", "@leapd/mcp"],
      "env": { "LEAPD_API_KEY": "${LEAPD_API_KEY}" }
    }
  }
}
```

### Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.leapd]
command = "npx"
args = ["-y", "@leapd/mcp"]
env = { LEAPD_API_KEY = "leapd_your_key" }
```

### Any other MCP client

The server speaks MCP over stdio. Run it with `npx -y @leapd/mcp` and `LEAPD_API_KEY` in the environment.

## Tools

| Tool | What it does |
| --- | --- |
| `launch_business` | Turn an idea into a live workspace — positioning, deployed landing page, day-one plan |
| `get_workspace` | Live URL, deployment and domain status, current plan day |
| `list_tasks` | The plan: what's queued, running, blocked (with the reason), or done |
| `create_task` | Add work to the plan — a page to build, research to run, a fix to make |
| `run_task` | Start a queued task immediately instead of waiting for its slot |
| `list_documents` | Artifacts Leapd produced — positioning, ICP, roadmap, research |
| `get_document` | Read one document in full |

Tasks execute on Leapd, not on your machine. `run_task` dispatches and returns; poll `list_tasks` for the outcome.

## Configuration

| Variable | Required | Default | Notes |
| --- | :---: | --- | --- |
| `LEAPD_API_KEY` | yes | — | Your key from [leapd.ai/settings/api](https://leapd.ai/settings/api) |
| `LEAPD_API_BASE` | no | `https://api.leapd.ai` | Must be an `https://` Leapd host, or `localhost` for development |
| `LEAPD_TIMEOUT_MS` | no | `120000` | Per-request timeout, capped at 10 minutes |

No other environment variable is read.

## Security

This server is deliberately small, and its credential handling is the reason.

- **One credential, ever.** `LEAPD_API_KEY` is the only secret it accepts. It does not read `.env` files, keychains, cloud metadata, or any other variable on your environment — so no key belonging to another tool can be picked up and forwarded.
- **The key can only go to Leapd.** `LEAPD_API_BASE` is host-allowlisted to `*.leapd.ai` (plus `localhost`) over HTTPS. A wrong or hostile base URL is rejected at startup rather than becoming an exfiltration path.
- **The key never appears in output.** Errors, logs, and tool results are asserted in the test suite to exclude it.
- **No local execution, no local writes.** Every tool is one authenticated HTTPS call. The server runs no commands, opens no files, and fetches no arbitrary URLs.
- **Scoped by your plan.** Authorization lives server-side on your Leapd account; this client cannot widen it.

Found a vulnerability? See [SECURITY.md](./SECURITY.md).

## Development

```bash
npm install
npm run build      # compile to dist/
npm test           # build + run the test suite
npm run typecheck  # types only
```

## License

MIT © [Leapd](https://leapd.ai)
