import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const cliEntry = join(repoRoot, 'apps/expedition-cli/dist/index.js');
const sampleWorkspace = join(repoRoot, 'examples/sample-workspace');

function runCli(args: string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [cliEntry, ...args], {
      cwd: repoRoot,
      env: {
        ...process.env,
        LOG_LEVEL: 'silent',
        MCP_TRACE_ENABLED: 'false',
      },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('close', (code) => {
      resolvePromise({ code, stdout, stderr });
    });
  });
}

describe('expedition CLI integration', () => {
  it('inspects the sample workspace', async () => {
    const result = await runCli(['workspace', 'inspect', sampleWorkspace]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Discovered capabilities');
    expect(result.stdout).toContain('search_documents');
    expect(result.stdout).toContain('workspace://summary');
    expect(result.stdout).toContain('Workspace summary');
    expect(result.stdout).toContain('risks.md');
  }, 30_000);
});
