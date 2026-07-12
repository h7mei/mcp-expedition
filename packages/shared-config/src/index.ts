import { resolve } from 'node:path';

import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value !== 'string') {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return value;
}, z.boolean());

const numberFromEnv = z.preprocess((value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number());

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  MCP_WORKSPACE_ROOT: z.string().default('./examples/sample-workspace'),
  MCP_MAX_FILE_SIZE_BYTES: numberFromEnv.pipe(z.number().int().positive()).default(1_048_576),
  MCP_MAX_SEARCH_RESULTS: numberFromEnv.pipe(z.number().int().min(1).max(100)).default(100),
  MCP_REPORT_APPROVAL_REQUIRED: booleanFromEnv.default(true),
  MCP_TRACE_ENABLED: booleanFromEnv.default(true),
  MCP_DEBUG: booleanFromEnv.default(false),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export interface AppConfig {
  nodeEnv: AppEnv['NODE_ENV'];
  logLevel: AppEnv['LOG_LEVEL'];
  workspaceRoot: string;
  maxFileSizeBytes: number;
  maxSearchResults: number;
  reportApprovalRequired: boolean;
  traceEnabled: boolean;
  debug: boolean;
}

export function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }
  return booleanFromEnv.parse(value);
}

export function parseNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  return numberFromEnv.pipe(z.number()).parse(value);
}

export function normalizeWorkspacePath(pathValue: string, cwd: string = process.cwd()): string {
  return resolve(cwd, pathValue);
}

export function loadAppConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): AppConfig {
  const parsed = appEnvSchema.parse(env);
  return {
    nodeEnv: parsed.NODE_ENV,
    logLevel: parsed.LOG_LEVEL,
    workspaceRoot: normalizeWorkspacePath(parsed.MCP_WORKSPACE_ROOT, cwd),
    maxFileSizeBytes: parsed.MCP_MAX_FILE_SIZE_BYTES,
    maxSearchResults: parsed.MCP_MAX_SEARCH_RESULTS,
    reportApprovalRequired: parsed.MCP_REPORT_APPROVAL_REQUIRED,
    traceEnabled: parsed.MCP_TRACE_ENABLED,
    debug: parsed.MCP_DEBUG,
  };
}

export function getDevelopmentDefaults(): AppConfig {
  return loadAppConfig({
    NODE_ENV: 'development',
    LOG_LEVEL: 'debug',
    MCP_WORKSPACE_ROOT: './examples/sample-workspace',
    MCP_MAX_FILE_SIZE_BYTES: '1048576',
    MCP_MAX_SEARCH_RESULTS: '100',
    MCP_REPORT_APPROVAL_REQUIRED: 'true',
    MCP_TRACE_ENABLED: 'true',
  });
}

export function getTestDefaults(): AppConfig {
  return loadAppConfig({
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MCP_WORKSPACE_ROOT: './examples/sample-workspace',
    MCP_MAX_FILE_SIZE_BYTES: '1048576',
    MCP_MAX_SEARCH_RESULTS: '100',
    MCP_REPORT_APPROVAL_REQUIRED: 'true',
    MCP_TRACE_ENABLED: 'false',
  });
}
