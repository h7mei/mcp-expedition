import { readdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

import type { WorkspaceSummary } from '@mcp-expedition/shared-schemas';

import { REPORTS_DIRECTORY_NAME, SUPPORTED_EXTENSIONS } from '../config.js';

async function countFiles(
  directory: string,
): Promise<{ fileCount: number; supportedFileCount: number }> {
  let fileCount = 0;
  let supportedFileCount = 0;
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      continue;
    }
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      const nested = await countFiles(absolutePath);
      fileCount += nested.fileCount;
      supportedFileCount += nested.supportedFileCount;
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    fileCount += 1;
    const extension = extname(entry.name).toLowerCase();
    if (SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
      supportedFileCount += 1;
    }
  }

  return { fileCount, supportedFileCount };
}

export async function getWorkspaceSummary(workspaceRoot: string): Promise<WorkspaceSummary> {
  const stats = await stat(workspaceRoot);
  if (!stats.isDirectory()) {
    throw new Error('Workspace root is not a directory');
  }

  const counts = await countFiles(workspaceRoot);

  return {
    root: basename(workspaceRoot),
    fileCount: counts.fileCount,
    supportedFileCount: counts.supportedFileCount,
    supportedExtensions: [...SUPPORTED_EXTENSIONS],
    reportsDirectory: REPORTS_DIRECTORY_NAME,
  };
}
