import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { SearchDocumentsInput, SearchDocumentsResult } from '@mcp-expedition/shared-schemas';
import { AppError } from '@mcp-expedition/shared-schemas';

import { SUPPORTED_EXTENSIONS } from '../config.js';
import { logger } from '../logger.js';
import {
  assertSupportedExtension,
  ensureInsideWorkspace,
  resolveSafePath,
  toWorkspaceRelative,
} from './path-safety.js';

export interface WorkspaceSearchOptions {
  workspaceRoot: string;
  maxFileSizeBytes: number;
}

async function walkSupportedFiles(
  workspaceRoot: string,
  currentDir: string,
  maxFileSizeBytes: number,
): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = join(currentDir, entry.name);
    if (entry.isSymbolicLink()) {
      continue;
    }
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }
      files.push(...(await walkSupportedFiles(workspaceRoot, absolutePath, maxFileSizeBytes)));
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    const extension = extname(entry.name).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(extension as (typeof SUPPORTED_EXTENSIONS)[number])) {
      continue;
    }
    const fileStats = await stat(absolutePath);
    if (fileStats.size > maxFileSizeBytes) {
      logger.warn(
        { path: toWorkspaceRelative(workspaceRoot, absolutePath) },
        'Skipping oversized file',
      );
      continue;
    }
    files.push(absolutePath);
  }

  return files;
}

export async function searchDocuments(
  input: SearchDocumentsInput,
  options: WorkspaceSearchOptions,
): Promise<SearchDocumentsResult> {
  const { workspaceRoot, maxFileSizeBytes } = options;
  const query = input.query;
  const maxResults = input.maxResults;
  const matches: SearchDocumentsResult['matches'] = [];

  let candidateFiles: string[];
  if (input.paths && input.paths.length > 0) {
    candidateFiles = [];
    for (const pathValue of input.paths) {
      const absolute = await resolveSafePath(workspaceRoot, pathValue);
      assertSupportedExtension(absolute);
      const fileStats = await stat(absolute);
      if (!fileStats.isFile()) {
        throw new AppError('TOOL_VALIDATION_FAILURE', 'Search path is not a file.', {
          path: pathValue,
        });
      }
      if (fileStats.size > maxFileSizeBytes) {
        continue;
      }
      candidateFiles.push(absolute);
    }
  } else {
    candidateFiles = await walkSupportedFiles(workspaceRoot, workspaceRoot, maxFileSizeBytes);
  }

  for (const absolutePath of candidateFiles) {
    ensureInsideWorkspace(workspaceRoot, absolutePath);
    const content = await readFile(absolutePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const relativePath = toWorkspaceRelative(workspaceRoot, absolutePath);

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? '';
      if (!line.toLowerCase().includes(query.toLowerCase())) {
        continue;
      }
      matches.push({
        path: relativePath,
        line: index + 1,
        excerpt: line.trim().slice(0, 240),
      });
      if (matches.length >= maxResults) {
        return {
          query,
          totalMatches: matches.length,
          matches,
        };
      }
    }
  }

  return {
    query,
    totalMatches: matches.length,
    matches,
  };
}
