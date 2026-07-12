import { access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const requiredPaths = [
  'package.json',
  'pnpm-workspace.yaml',
  'apps/expedition-cli/package.json',
  'servers/workspace-server/package.json',
  'packages/mcp-client/package.json',
  'packages/shared-schemas/package.json',
  'examples/sample-workspace/README.md',
];

const missing = [];

for (const relativePath of requiredPaths) {
  try {
    await access(join(root, relativePath));
  } catch {
    missing.push(relativePath);
  }
}

if (missing.length > 0) {
  console.error('Workspace verification failed. Missing:');
  for (const path of missing) {
    console.error(`  - ${path}`);
  }
  process.exit(1);
}

console.log('Workspace verification passed.');
