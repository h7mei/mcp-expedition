import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const cliEntry = join(repoRoot, 'apps/expedition-cli/dist/index.js');

describe('end-to-end demo command', () => {
  it('runs pnpm expedition workspace inspect against the sample workspace', async () => {
    const result = await new Promise<{ code: number | null; stdout: string }>((resolvePromise) => {
      const child = spawn(
        process.execPath,
        [cliEntry, 'workspace', 'inspect', './examples/sample-workspace'],
        {
          cwd: repoRoot,
          env: {
            ...process.env,
            LOG_LEVEL: 'warn',
          },
        },
      );

      let stdout = '';
      child.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.on('close', (code) => resolvePromise({ code, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('sample-workspace');
    expect(result.stdout).toContain('risks.md');
  }, 30_000);
});
