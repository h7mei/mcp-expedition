import { ExpeditionMcpClient } from '@mcp-expedition/mcp-client';

import { printHeading, printJson, printKeyValue } from '../presentation/output.js';
import {
  assertServerBuildExists,
  createWorkspaceServerLaunchEnv,
  getRepoRoot,
  resolveWorkspaceServerEntry,
} from '../presentation/paths.js';

export async function runListCapabilities(): Promise<void> {
  const repoRoot = getRepoRoot();
  const serverEntry = resolveWorkspaceServerEntry(repoRoot);
  await assertServerBuildExists(serverEntry);

  const workspaceRoot = joinSampleWorkspace(repoRoot);
  const client = new ExpeditionMcpClient({ clientName: 'expedition-cli' });

  try {
    await client.connectStdio({
      name: 'workspace-server',
      command: process.execPath,
      args: [serverEntry],
      cwd: repoRoot,
      env: createWorkspaceServerLaunchEnv(workspaceRoot),
    });

    const capabilities = await client.listCapabilities();
    const serverInfo = client.getServerInfo();

    printHeading('Workspace server capabilities');
    printKeyValue('Server name', serverInfo.name ?? 'unknown');
    printKeyValue('Server version', serverInfo.version ?? 'unknown');
    printKeyValue('Protocol version', client.getProtocolVersion() ?? 'unknown');
    printKeyValue('Tools', capabilities.tools.join(', ') || '(none)');
    printKeyValue('Resources', capabilities.resources.join(', ') || '(none)');
    printKeyValue('Prompts', capabilities.prompts.join(', ') || '(none)');
    printJson(capabilities);
  } finally {
    await client.close();
  }
}

function joinSampleWorkspace(repoRoot: string): string {
  return `${repoRoot}/examples/sample-workspace`;
}
