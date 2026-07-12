# Permission model

## Risk levels

```ts
type ToolRiskLevel = 'read' | 'generate' | 'write' | 'destructive' | 'external';
```

## Default approval policy

| Risk        | Requires approval          |
| ----------- | -------------------------- |
| read        | no                         |
| generate    | configurable (default: no) |
| write       | yes                        |
| destructive | yes                        |
| external    | yes                        |

## Tool classification table

| Tool               | Server    | Risk  | Notes                             |
| ------------------ | --------- | ----- | --------------------------------- |
| `search_documents` | workspace | read  | Search only                       |
| `create_report`    | workspace | write | Creates Markdown under `reports/` |

## Future user-configurable policies

- Per-tool allow/deny lists
- Session sticky approvals
- Different policies for local vs remote servers
- Interactive approval prompts in the CLI host
