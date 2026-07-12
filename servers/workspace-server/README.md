# Workspace MCP Server

Local `stdio` MCP server for inspecting and searching an approved workspace directory.

## Server name

`io.github.example/mcp-expedition-workspace`

## Capabilities

| Kind     | Name                  | Notes                                                     |
| -------- | --------------------- | --------------------------------------------------------- |
| Tool     | `search_documents`    | Read-only search across `.md`, `.txt`, and `.json`        |
| Tool     | `create_report`       | Write tool that creates Markdown reports under `reports/` |
| Resource | `workspace://summary` | Structured workspace summary                              |
| Prompt   | `review_project`      | Reusable project review prompt                            |

## Run

Package scripts run with cwd set to this package directory, so the default workspace
path is the monorepo fixture at `../../examples/sample-workspace` (repo-root
`examples/sample-workspace`). Override with `MCP_WORKSPACE_ROOT` as needed.

```bash
pnpm --filter @mcp-expedition/workspace-server build
pnpm --filter @mcp-expedition/workspace-server start
# or during development:
pnpm --filter @mcp-expedition/workspace-server dev
```

From the monorepo root (cwd = repo root), you can also launch the built binary with:

```bash
MCP_WORKSPACE_ROOT=./examples/sample-workspace node servers/workspace-server/dist/main.js
```

Logs are always written to `stderr` so MCP `stdio` traffic on `stdout` stays intact.
