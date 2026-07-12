# Contributing

Thanks for helping improve MCP Expedition.

## Development setup

```bash
pnpm install
pnpm build
pnpm check
```

`pnpm install` enables Husky git hooks. On every commit, the pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files) and `pnpm typecheck`. The commit-msg hook enforces Conventional Commits via commitlint.

Skip hooks only when necessary: `HUSKY=0 git commit ...`.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/).

Suggested scopes: `cli`, `workspace-server`, `researchops-server`, `client`, `schemas`, `config`, `permissions`, `tracer`, `docs`, `ci`, `repo`.

Examples:

- `feat(workspace-server): add search_documents tool`
- `fix(cli): handle missing build artifacts`
- `docs(repo): clarify demo output`

## Pull requests

- Keep PRs focused
- Include tests for behavior changes
- Do not commit secrets
- Ensure `pnpm check` passes

## Architecture rules

- Apps/servers may depend on packages
- Packages must not depend on apps/servers
- Keep CLI rendering out of `mcp-client`
- Keep domain schemas free of MCP SDK types
