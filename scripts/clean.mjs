import { rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const targets = [
  'node_modules',
  '.turbo',
  'coverage',
  'apps/expedition-cli/dist',
  'servers/workspace-server/dist',
  'servers/researchops-server/dist',
  'packages/mcp-client/dist',
  'packages/shared-schemas/dist',
  'packages/shared-config/dist',
  'packages/permission-engine/dist',
  'packages/protocol-tracer/dist',
];

await Promise.all(
  targets.map(async (relativePath) => {
    const absolutePath = join(root, relativePath);
    await rm(absolutePath, { recursive: true, force: true });
  }),
);

console.log('Cleaned build artifacts and caches.');
