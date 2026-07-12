import { loadAppConfig } from '@mcp-expedition/shared-config';
import pino from 'pino';

const config = loadAppConfig();

/**
 * MCP stdio servers must never write logs to stdout.
 * All logging is directed to stderr.
 */
export function createLogger(name: string): pino.Logger {
  return pino(
    {
      name,
      level: config.logLevel,
    },
    pino.destination({ dest: 2, sync: true }),
  );
}

export const logger = createLogger('workspace-server');
