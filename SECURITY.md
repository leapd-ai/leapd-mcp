# Security Policy

## Reporting a vulnerability

Email **security@leapd.ai**. Please do not open a public issue for a security
report. Include reproduction steps and the version of `@leapd/mcp` you tested.

We aim to acknowledge within 2 business days.

## Scope

This package is a thin MCP client for the Leapd API. Its security surface is:

- how it reads and stores the `LEAPD_API_KEY`,
- where it is willing to transmit that key,
- what it writes to logs, errors, and tool results.

Design guarantees, all covered by the test suite:

- `LEAPD_API_KEY` is the only credential read; no `.env` loading, no other
  environment variable is consulted.
- `LEAPD_API_BASE` is host-allowlisted to `*.leapd.ai` over HTTPS (with
  `localhost` permitted for development). Anything else fails at startup.
- The API key is never included in an error message, log line, or tool result.
- No shell execution, no filesystem access, no arbitrary URL fetching.

Vulnerabilities in the Leapd platform itself should also go to
security@leapd.ai.

## Supported versions

The latest published `1.x` release receives security fixes.
