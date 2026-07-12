import { lstat, realpath, stat } from 'node:fs/promises';
import { isAbsolute, join, normalize, relative, resolve, sep } from 'node:path';

import { AppError } from '@mcp-expedition/shared-schemas';

import { SUPPORTED_EXTENSIONS } from '../config.js';

export async function resolveWorkspaceRoot(workspaceRoot: string): Promise<string> {
  const absolute = resolve(workspaceRoot);
  try {
    const stats = await stat(absolute);
    if (!stats.isDirectory()) {
      throw new AppError('INVALID_WORKSPACE_PATH', 'Workspace path is not a directory.', {
        workspaceRoot: absolute,
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('INVALID_WORKSPACE_PATH', 'Workspace path does not exist.', {
      workspaceRoot: absolute,
    });
  }

  return realpath(absolute);
}

export function ensureInsideWorkspace(workspaceRoot: string, candidatePath: string): string {
  const absoluteCandidate = isAbsolute(candidatePath)
    ? normalize(candidatePath)
    : resolve(workspaceRoot, candidatePath);
  const relativePath = relative(workspaceRoot, absoluteCandidate);

  if (
    relativePath === '' ||
    (!relativePath.startsWith(`..${sep}`) && relativePath !== '..' && !isAbsolute(relativePath))
  ) {
    return absoluteCandidate;
  }

  throw new AppError('PATH_TRAVERSAL', 'Path escapes the approved workspace root.', {
    path: candidatePath,
  });
}

export async function resolveSafePath(
  workspaceRoot: string,
  candidatePath: string,
): Promise<string> {
  const absoluteCandidate = ensureInsideWorkspace(workspaceRoot, candidatePath);

  try {
    const linkStats = await lstat(absoluteCandidate);
    if (linkStats.isSymbolicLink()) {
      const real = await realpath(absoluteCandidate);
      ensureInsideWorkspace(workspaceRoot, real);
      return real;
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // File may not exist yet (e.g. report creation). Validate parent stays in root.
  }

  return absoluteCandidate;
}

export function assertSupportedExtension(filePath: string): void {
  const lower = filePath.toLowerCase();
  const supported = SUPPORTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
  if (!supported) {
    throw new AppError('UNSUPPORTED_FILE_TYPE', 'Unsupported file type.', {
      path: filePath,
      supportedExtensions: [...SUPPORTED_EXTENSIONS],
    });
  }
}

export function toWorkspaceRelative(workspaceRoot: string, absolutePath: string): string {
  const relativePath = relative(workspaceRoot, absolutePath);
  return relativePath.split(sep).join('/');
}

export function joinWorkspacePath(workspaceRoot: string, ...parts: string[]): string {
  return join(workspaceRoot, ...parts);
}

export function sanitizeReportFileName(title: string, fileName?: string): string {
  const source = fileName?.trim() || title.trim();
  const withoutExtension = source.replace(/\.md$/i, '');
  const sanitized = withoutExtension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  if (!sanitized) {
    throw new AppError(
      'TOOL_VALIDATION_FAILURE',
      'Report file name is invalid after sanitization.',
    );
  }

  return `${sanitized}.md`;
}
