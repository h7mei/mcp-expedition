import { ExpeditionMcpClient } from '@mcp-expedition/mcp-client';
import { InMemoryTraceCollector } from '@mcp-expedition/protocol-tracer';
import { loadAppConfig } from '@mcp-expedition/shared-config';

import { extractTextContent, printHeading, printKeyValue } from '../presentation/output.js';
import {
  assertServerBuildExists,
  assertWorkspacePath,
  createWorkspaceServerLaunchEnv,
  getRepoRoot,
  resolveWorkspaceServerEntry,
} from '../presentation/paths.js';

export async function runWorkspaceInspect(workspacePath: string): Promise<void> {
  const config = loadAppConfig();
  const repoRoot = getRepoRoot();
  const absoluteWorkspace = await assertWorkspacePath(workspacePath);
  const serverEntry = resolveWorkspaceServerEntry(repoRoot);
  await assertServerBuildExists(serverEntry);

  const tracer = config.traceEnabled ? new InMemoryTraceCollector() : undefined;
  const client = new ExpeditionMcpClient({
    clientName: 'expedition-cli',
    ...(tracer ? { tracer } : {}),
  });

  try {
    await client.connectStdio({
      name: 'workspace-server',
      command: process.execPath,
      args: [serverEntry],
      cwd: repoRoot,
      env: createWorkspaceServerLaunchEnv(absoluteWorkspace),
    });

    const capabilities = await client.listCapabilities();
    const serverInfo = client.getServerInfo();

    printHeading('Discovered capabilities');
    printKeyValue('Server', `${serverInfo.name ?? 'unknown'}@${serverInfo.version ?? 'unknown'}`);
    printKeyValue('Tools', capabilities.tools.join(', '));
    printKeyValue('Resources', capabilities.resources.join(', '));
    printKeyValue('Prompts', capabilities.prompts.join(', '));

    printHeading('Workspace summary');
    const summary = await client.readResource('workspace://summary');
    const summaryText = summary.contents
      .map((content) => ('text' in content ? content.text : ''))
      .join('\n');
    console.log(summaryText);

    printHeading('search_documents("risk")');
    const searchResult = await client.callTool('search_documents', {
      query: 'risk',
      maxResults: 20,
    });
    const searchText = extractTextContent(searchResult);
    console.log(searchText);

    if (searchResult.isError) {
      throw new Error('search_documents returned an error result');
    }

    printHeading('Inspect complete');
    printKeyValue('Workspace', absoluteWorkspace);
    if (tracer) {
      printKeyValue('Trace events', String(tracer.list().length));
    }
  } finally {
    await client.close();
  }
}
