import { access, constants, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AppError } from '@mcp-expedition/shared-schemas';

const require = createRequire(import.meta.url);

export function getRepoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
}

export function resolveWorkspaceServerEntry(repoRoot: string = getRepoRoot()): string {
  return join(repoRoot, 'servers/workspace-server/dist/main.js');
}

export async function assertWorkspacePath(pathValue: string): Promise<string> {
  const absolute = resolve(pathValue);
  try {
    const stats = await stat(absolute);
    if (!stats.isDirectory()) {
      throw new AppError('INVALID_WORKSPACE_PATH', 'Workspace path is not a directory.', {
        path: absolute,
      });
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('INVALID_WORKSPACE_PATH', 'Workspace path does not exist.', {
      path: absolute,
    });
  }
  return absolute;
}

export async function assertServerBuildExists(entryPath: string): Promise<void> {
  try {
    await access(entryPath, constants.F_OK);
  } catch {
    throw new AppError(
      'SERVER_STARTUP_FAILURE',
      'Workspace server build artifact is missing. Run `pnpm build` first.',
      { entryPath },
    );
  }
}

export function createWorkspaceServerLaunchEnv(
  workspaceRoot: string,
  baseEnv: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const env: Record<string, string> = {
    MCP_WORKSPACE_ROOT: workspaceRoot,
    NODE_ENV: baseEnv.NODE_ENV ?? 'development',
    LOG_LEVEL: baseEnv.LOG_LEVEL ?? 'info',
  };

  for (const [key, value] of Object.entries(baseEnv)) {
    if (value !== undefined && !(key in env)) {
      env[key] = value;
    }
  }

  return env;
}

export function resolvePackageBin(packageName: string): string | undefined {
  try {
    return require.resolve(packageName);
  } catch {
    return undefined;
  }
}
