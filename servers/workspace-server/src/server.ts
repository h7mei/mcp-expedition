import { loadAppConfig } from '@mcp-expedition/shared-config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { registerPrompts } from './capabilities/prompts/index.js';
import { registerResources } from './capabilities/resources/index.js';
import { registerTools } from './capabilities/tools/index.js';
import { SERVER_NAME, SERVER_VERSION } from './config.js';
import { logger } from './logger.js';
import { resolveWorkspaceRoot } from './services/path-safety.js';

export interface CreateWorkspaceServerOptions {
  workspaceRoot?: string;
}

export async function createWorkspaceServer(
  options: CreateWorkspaceServerOptions = {},
): Promise<{ server: McpServer; workspaceRoot: string }> {
  const config = loadAppConfig();
  const workspaceRoot = await resolveWorkspaceRoot(options.workspaceRoot ?? config.workspaceRoot);

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerTools(server, {
    workspaceRoot,
    maxFileSizeBytes: config.maxFileSizeBytes,
  });
  registerResources(server, workspaceRoot);
  registerPrompts(server);

  logger.info({ workspaceRoot: workspaceRoot.split('/').at(-1) }, 'Workspace server configured');

  return { server, workspaceRoot };
}
