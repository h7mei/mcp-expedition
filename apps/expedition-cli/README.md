# Expedition CLI

Command-line host for the MCP Expedition ResearchOps Assistant.

## Commands

```bash
pnpm expedition workspace inspect ./examples/sample-workspace
pnpm expedition server list-capabilities
pnpm expedition doctor
```

The CLI validates the workspace path, spawns the local Workspace MCP server over `stdio`, negotiates capabilities, reads `workspace://summary`, and calls `search_documents`.
