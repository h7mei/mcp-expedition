# Security model

## Assets

- Workspace file contents
- Generated reports
- Process environment and secrets
- Protocol traces and logs
- Host machine path boundaries

## Trust boundaries

1. User shell → CLI
2. CLI → MCP client
3. MCP client → Workspace server (`stdio`)
4. Workspace server → approved workspace root only
5. Future: remote clients → ResearchOps server (auth required)

## Threats

- Path traversal (`../`, symlink escapes)
- Overwriting existing reports
- Logging secrets or file contents
- Tool input that attempts shell execution
- Treating resource text as trusted instructions for a model

## Mitigations

- Resolve and validate workspace roots
- Reject paths outside the approved root
- Ignore symbolic links that escape the workspace
- Extension allowlists (`.md`, `.txt`, `.json`)
- Configurable max file size and max search results
- Stream files/lines instead of loading the whole workspace at once
- Sanitize report names; never overwrite by default
- Never execute shell commands from tool input
- Redact credentials and contents from protocol traces
- Send server logs to `stderr` only

## Workspace isolation

Every file operation is rooted at `MCP_WORKSPACE_ROOT`. Relative paths are resolved and checked with `path.relative` guards before use.

## Tool approval rules

| Tool               | Risk  | Approval     |
| ------------------ | ----- | ------------ |
| `search_documents` | read  | not required |
| `create_report`    | write | required     |

## Logging and trace sanitization

- Pino logs avoid dumping file contents by default
- Trace metadata redacts authorization/password/token/content fields

## Future remote authorization considerations

The ResearchOps server will need authentication, authorization scopes, and transport-level protections before exposing write or external tools remotely.
