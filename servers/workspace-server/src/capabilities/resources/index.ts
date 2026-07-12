import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { WORKSPACE_SUMMARY_URI } from '../../config.js';
import { getWorkspaceSummary } from '../../services/workspace-summary.js';

export function registerResources(server: McpServer, workspaceRoot: string): void {
  server.resource(
    'workspace-summary',
    WORKSPACE_SUMMARY_URI,
    {
      description: 'Structured summary of the active workspace',
      mimeType: 'application/json',
    },
    async (uri) => {
      const summary = await getWorkspaceSummary(workspaceRoot);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    },
  );
}
