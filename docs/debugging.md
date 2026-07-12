# Debugging

## Useful commands

```bash
pnpm doctor
pnpm expedition server list-capabilities
pnpm expedition workspace inspect ./examples/sample-workspace
```

## Tips

- Enable `MCP_DEBUG=true` for stack traces in the CLI
- Workspace server logs are on `stderr`
- Use `@mcp-expedition/protocol-tracer` for sanitized request summaries
- Confirm `pnpm build` produced `servers/workspace-server/dist/main.js` before running the CLI

## MCP Inspector

Inspector compatibility is planned. The local server should already be launchable as a stdio process once build artifacts exist.
