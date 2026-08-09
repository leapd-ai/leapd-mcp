# Changelog

## 1.0.0

Initial release.

- MCP server over stdio for the Leapd API.
- Seven tools: `launch_business`, `get_workspace`, `list_tasks`, `create_task`,
  `run_task`, `list_documents`, `get_document`.
- `LEAPD_API_KEY` is the only credential read; `LEAPD_API_BASE` is
  host-allowlisted to Leapd over HTTPS.
