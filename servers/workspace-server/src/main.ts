#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { logger } from './logger.js';
import { createWorkspaceServer } from './server.js';

async function main(): Promise<void> {
  const { server } = await createWorkspaceServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('Workspace MCP server connected over stdio');
}

main().catch((error: unknown) => {
  logger.error({ err: error }, 'Workspace MCP server failed to start');
  process.exit(1);
});
