import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { CreateReportInput, CreateReportResult } from '@mcp-expedition/shared-schemas';
import { AppError } from '@mcp-expedition/shared-schemas';

import { REPORTS_DIRECTORY_NAME } from '../config.js';
import {
  ensureInsideWorkspace,
  sanitizeReportFileName,
  toWorkspaceRelative,
} from './path-safety.js';

export async function createReport(
  input: CreateReportInput,
  workspaceRoot: string,
): Promise<CreateReportResult> {
  const reportsDirectory = join(workspaceRoot, REPORTS_DIRECTORY_NAME);
  ensureInsideWorkspace(workspaceRoot, reportsDirectory);
  await mkdir(reportsDirectory, { recursive: true });

  const fileName = sanitizeReportFileName(input.title, input.fileName);
  const absolutePath = join(reportsDirectory, fileName);
  ensureInsideWorkspace(workspaceRoot, absolutePath);

  try {
    await access(absolutePath);
    throw new AppError(
      'TOOL_EXECUTION_FAILURE',
      'Report already exists and overwrite is disabled.',
      {
        path: toWorkspaceRelative(workspaceRoot, absolutePath),
      },
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
  }

  const body = `# ${input.title}\n\n${input.content}\n`;
  const bytes = Buffer.from(body, 'utf8');
  await writeFile(absolutePath, bytes, { flag: 'wx' });

  return {
    path: toWorkspaceRelative(workspaceRoot, absolutePath),
    createdAt: new Date().toISOString(),
    byteSize: bytes.byteLength,
  };
}
