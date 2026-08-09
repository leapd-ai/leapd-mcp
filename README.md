<div align="center">

# Leapd MCP

**AI that builds and runs your business — 24/7.**

The official [Model Context Protocol](https://modelcontextprotocol.io) server for [Leapd](https://leapd.ai). Connect Claude Code, Codex, or any MCP client to a Leapd account and drive an AI co-founder from your editor: start from an idea or bring an existing business, and AI builds and runs it while you sleep.

[![CI](https://github.com/leapd-ai/leapd-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/leapd-ai/leapd-mcp/actions/workflows/ci.yml)
[![node](https://img.shields.io/badge/node-%E2%89%A520-111827)](https://nodejs.org)
[![license](https://img.shields.io/badge/license-MIT-111827)](./LICENSE)

[**leapd.ai**](https://leapd.ai) · [Get an API key](https://leapd.ai) · [What is an AI-run business?](https://www.leapd.ai/resources/what-is-an-ai-run-business) · [State of AI-Run Businesses 2026](https://www.leapd.ai/resources/state-of-ai-run-businesses-2026)

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

## Contents

- [Requirements](#requirements) · [Install](#install) · [Tools](#tools) · [Configuration](#configuration)
- [What Leapd is](#what-leapd-is) · [What an AI-run business is](#what-an-ai-run-business-is) · [Why MCP](#why-an-mcp-server)
- [FAQ](#faq) · [Further reading](#further-reading) · [Security](#security)

## Requirements

- **Node.js 20+**
- A **Leapd account with an active plan** — [sign up at leapd.ai](https://leapd.ai)
- A **Leapd API key** from your [Leapd dashboard](https://leapd.ai)

## Install

### Claude Code

```bash
claude mcp add leapd \
  --env LEAPD_API_KEY=leapd_your_key \
  -- npx -y github:leapd-ai/leapd-mcp
```

Then `/mcp` inside Claude Code to confirm `leapd` is connected.

To share the server with your team, commit a `.mcp.json` at the repo root instead:

```json
{
  "mcpServers": {
    "leapd": {
      "command": "npx",
      "args": ["-y", "github:leapd-ai/leapd-mcp"],
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
args = ["-y", "github:leapd-ai/leapd-mcp"]
env = { LEAPD_API_KEY = "leapd_your_key" }
```

### Any other MCP client

The server speaks MCP over stdio. Run it with `npx -y github:leapd-ai/leapd-mcp`
and `LEAPD_API_KEY` in the environment.

## Tools

| Tool | What it does |
| --- | --- |
| `launch_business` | Turn an idea into a live business — positioning, deployed landing page, day-one plan |
| `get_workspace` | Live URL, deployment and domain status, current plan day |
| `list_tasks` | The plan: what's queued, running, blocked (with the reason), or done |
| `create_task` | Add work to the plan — a page to build, research to run, a fix to make |
| `run_task` | Start a queued task immediately instead of waiting for its slot |
| `list_documents` | Artifacts Leapd produced — positioning, ICP, roadmap, research |
| `get_document` | Read one document in full |

Tasks execute on Leapd, not on your machine. `run_task` dispatches and returns; poll `list_tasks` for the outcome.

No tool takes a workspace, account, or user identifier — scope is derived from your API key, so a caller can only ever reach its own business.

## Configuration

| Variable | Required | Default | Notes |
| --- | :---: | --- | --- |
| `LEAPD_API_KEY` | yes | — | Your key from your [Leapd dashboard](https://leapd.ai) |
| `LEAPD_API_BASE` | no | `https://api.leapd.ai` | Must be an `https://` Leapd host, or `localhost` for development |
| `LEAPD_TIMEOUT_MS` | no | `120000` | Per-request timeout, capped at 10 minutes |

No other environment variable is read.

---

## What Leapd is

[Leapd](https://leapd.ai) is an **AI co-founder that builds and runs your business 24/7**. It does the work of an entire startup team: building your product, launching growth campaigns, generating leads, booking meetings, and growing your visibility across search and AI platforms.

Point Leapd at an idea or an existing business, and its specialized AI agents take over engineering, marketing, sales, and operations. They write and deploy real code, run ad campaigns and personalized email outreach, publish and engage on LinkedIn, create content, and help your brand get cited across AI search.

Leapd keeps working around the clock, then sends a clear morning report showing exactly what was completed, what is running, and what happens next.

Built for founders, solo operators, and small teams that want to launch and grow something real without hiring a full team or raising capital first. Leapd exists so **anyone** can build a business — not just the funded, the connected, or those who can afford agencies and headcount.

### The team behind the tools

The seven tools in this server are the interface to four specialized agents:

| Agent | Role |
| --- | --- |
| **Jack** | The AI co-founder. Researches the market, drafts positioning, builds the product and landing page, plans and runs the daily engine. |
| **Milo** | Customer acquisition. Email outreach to verified buyer inboxes, Meta ad campaigns including video creative. |
| **Cassy** | LinkedIn. Voice-trained posts, tracks conversations and competitors, engages buyer threads, qualifies every engager against your ICP, books meetings. |
| **Alex** | AI search visibility. Audits your site the way language models read it, ships schema-marked citation-rich content, tracks where your brand is cited. |

`launch_business` and the task tools drive Jack directly; the work Jack plans pulls in the others as the business needs them.

### What it produces

- A customizable **Next.js frontend and backend**, built for SEO and AEO, live in under 10 minutes
- **Stripe checkout** wired in minutes — a functional business in under an hour
- A **daily plan of real tasks**, executed and reported on each morning
- **Positioning, ICP, roadmap, and research documents** you can read via `list_documents` / `get_document`

Hundreds of businesses run on Leapd.

## What an AI-run business is

An AI-run business is one where the day-to-day execution — building the product, finding customers, publishing content, tracking visibility — is carried out by autonomous agents rather than a hired team, with the founder setting direction and approving anything consequential.

The distinction that matters is between **assistance** and **execution**. An AI assistant drafts something you then act on. An AI-run business closes the loop: the agent plans the work, does it, ships it, and reports what happened. That difference is what makes an MCP server useful here — an agent in your editor can hand work to another agent that will actually complete it, rather than returning text for you to paste somewhere.

Anything public or costly waits for your approval. Ad spend, outreach, and anything customer-facing arrives as a plain-English morning brief you approve in one reply.

Two primers worth reading:

- [**What is an AI-run business?**](https://www.leapd.ai/resources/what-is-an-ai-run-business) — the concept, the operating model, and what changes when execution is autonomous
- [**The State of AI-Run Businesses 2026**](https://www.leapd.ai/resources/state-of-ai-run-businesses-2026) — where the category actually is: what agents reliably do today, what they don't, and where the economics land

## Why an MCP server

Model Context Protocol is an open standard for connecting AI clients to external systems. It matters for this use case specifically:

- **The agent you're already talking to can start a business.** No context switch to a dashboard, no copy-paste between tools.
- **Composability.** An agent that can read your repo can also read your positioning document, see what's blocked, and queue the fix.
- **Long-running work belongs elsewhere.** Building a landing page and running a campaign take minutes to hours. This server dispatches and reports; execution stays on Leapd's infrastructure where it can survive your laptop closing.

## FAQ

**Is Leapd an AI agent, an app builder, or a marketing tool?**
All three, which is the point. It writes and deploys code, and it runs acquisition. Tools that only build leave you with a product nobody knows about; tools that only market need a product to point at.

**Do I need to be able to code?**
No. The dominant Leapd user has little or no coding experience and wants to start a business. This MCP server is for people who *do* live in an editor and would rather drive from there.

**Can I connect an existing business?**
Yes. Pass your current site to `launch_business` via the `website` argument and Leapd works from what's already there instead of starting cold.

**Does it work with prototypes from other builders?**
Yes — Leapd plugs into app prototypes built on platforms like Replit, Lovable, or Bolt.

**What does the agent do while I'm asleep?**
Runs the day's plan: ships code, publishes and engages, sends outreach, runs campaigns, tracks visibility. You get a morning report of what completed, what's running, and what's next.

**Which AI search engines does Alex track?**
The major answer engines — ChatGPT, Gemini, Claude, Perplexity, Google AI Overviews and AI Mode, plus Grok and Meta AI. Each sources answers differently, so visibility is reported per engine.

**Is there a free tier?**
Leapd is free to start with usage-based scaling, and setup takes 60 seconds. MCP access requires an active plan.

**What happens if I call a tool without a valid key?**
The server refuses to start without `LEAPD_API_KEY`, and returns an actionable error — not a stack trace — if the key is rejected or your plan doesn't cover the action.

## Further reading

**AI co-founders and building**
- [The first one-person unicorn will be AI-run](https://www.leapd.ai/blog/ai-co-founder/the-first-one-person-unicorn-will-be-ai-run)
- [12 best AI co-founder tools in 2026 — what separates the real ones](https://www.leapd.ai/blog/ai-co-founder/12-best-ai-co-founder-tools-in-2026-what-separates-the-real-ones)
- [10 best no-code tools for first-time founders to build a business and get customers](https://www.leapd.ai/blog/ai-co-founder/10-best-no-code-tools-for-first-time-founders-to-build-a-business-and-get-customers-2026)
- [10 best no-code app builders to launch your app in 2026](https://www.leapd.ai/blog/ai-co-founder/10-best-no-code-app-builder-tools-to-launch-your-app-in-2026)

**AI search visibility**
- [How ChatGPT, Google AI Overviews, and Perplexity source information in 2026](https://www.leapd.ai/blog/ai-visibility/how-chatgpt-google-ai-overviews-and-perplexity-source-information-in-2026)
- [Why AI cites certain brands over others — 13 factors that matter](https://www.leapd.ai/blog/ai-visibility/why-ai-cites-certain-brands-over-others-13-factors-that-matter)
- [10 proven tactics to increase AI search citations](https://www.leapd.ai/blog/ai-visibility/10-proven-tactics-to-increase-ai-search-citations)
- [Free AI visibility checker — track your brand in AI search](https://www.leapd.ai/blog/ai-visibility/free-ai-visibility-checker-track-your-brand-in-ai-search-leapd)

**Growth and go-to-market**
- [The real cost of a LinkedIn lead-generation stack in 2026](https://www.leapd.ai/blog/linkedin-content/real-cost-of-linkedin-lead-generation-stack-2026)
- [Top 15 GTM leaders to follow on LinkedIn in 2026](https://www.leapd.ai/blog/linkedin-content/top-15-gtm-leaders-to-follow-on-linkedin-in-2026)

Machine-readable overview: [leapd.ai/llms.txt](https://www.leapd.ai/llms.txt)

## Security

This server is deliberately small, and its credential handling is the reason.

- **One credential, ever.** `LEAPD_API_KEY` is the only secret it accepts. It does not read `.env` files, keychains, cloud metadata, or any other variable on your environment — so no key belonging to another tool can be picked up and forwarded.
- **The key can only go to Leapd.** `LEAPD_API_BASE` is host-allowlisted to `*.leapd.ai` (plus `localhost`) over HTTPS. A wrong or hostile base URL is rejected at startup rather than becoming an exfiltration path.
- **The key never appears in output.** Errors, logs, and tool results are asserted in the test suite to exclude it.
- **No caller-supplied scope.** No tool accepts a workspace, account, or user id, so a caller cannot address a business it does not own.
- **No local execution, no local writes.** Every tool is one authenticated HTTPS call. The server runs no commands, opens no files, and fetches no arbitrary URLs.

Found a vulnerability? See [SECURITY.md](./SECURITY.md).

## Development

```bash
npm install
npm run build      # compile to dist/
npm test           # build + run the test suite
npm run typecheck  # types only
```

## License

MIT © [Leapd](https://leapd.ai) — [leapd.ai](https://leapd.ai)
