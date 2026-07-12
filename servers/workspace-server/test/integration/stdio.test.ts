import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const serverEntry = join(repoRoot, 'servers/workspace-server/dist/main.js');
const workspaceRoot = join(repoRoot, 'examples/sample-workspace');

describe('workspace-server stdio integration', () => {
  let client: Client;
  let transport: StdioClientTransport;

  beforeAll(async () => {
    client = new Client({ name: 'workspace-integration-test', version: '0.1.0' });
    transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverEntry],
      cwd: repoRoot,
      env: {
        ...process.env,
        MCP_WORKSPACE_ROOT: workspaceRoot,
        LOG_LEVEL: 'silent',
        NODE_ENV: 'test',
      } as Record<string, string>,
      stderr: 'pipe',
    });
    await client.connect(transport);
  }, 30_000);

  afterAll(async () => {
    await client.close();
  });

  it('lists tools, resources, and prompts', async () => {
    const tools = await client.listTools();
    const resources = await client.listResources();
    const prompts = await client.listPrompts();

    expect(tools.tools.map((tool) => tool.name).sort()).toEqual([
      'create_report',
      'search_documents',
    ]);
    expect(resources.resources.some((resource) => resource.uri === 'workspace://summary')).toBe(
      true,
    );
    expect(prompts.prompts.some((prompt) => prompt.name === 'review_project')).toBe(true);
  });

  it('reads workspace://summary', async () => {
    const result = await client.readResource({ uri: 'workspace://summary' });
    const text = result.contents.map((item) => ('text' in item ? item.text : '')).join('');
    const summary = JSON.parse(text) as { supportedExtensions: string[]; root: string };
    expect(summary.root).toBe('sample-workspace');
    expect(summary.supportedExtensions).toContain('.md');
  });

  it('searches documents for risk', async () => {
    const result = await client.callTool({
      name: 'search_documents',
      arguments: { query: 'risk', maxResults: 20 },
    });
    expect(result.isError).toBeFalsy();
    const text = Array.isArray(result.content)
      ? result.content
          .filter((item) => item.type === 'text')
          .map((item) => ('text' in item ? item.text : ''))
          .join('')
      : '';
    expect(text).toContain('risks.md');
  });

  it('rejects malformed tool input', async () => {
    const result = await client.callTool({
      name: 'search_documents',
      arguments: { query: '' },
    });
    expect(result.isError).toBe(true);
  });

  it('rejects escaping paths', async () => {
    const result = await client.callTool({
      name: 'search_documents',
      arguments: { query: 'risk', paths: ['../package.json'] },
    });
    expect(result.isError).toBe(true);
    const text = Array.isArray(result.content)
      ? result.content
          .filter((item) => item.type === 'text')
          .map((item) => ('text' in item ? item.text : ''))
          .join('')
      : '';
    expect(text).toContain('PATH_TRAVERSAL');
  });
});
