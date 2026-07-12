import { describe, expect, it } from 'vitest';

import {
  getTestDefaults,
  loadAppConfig,
  normalizeWorkspacePath,
  parseBoolean,
  parseNumber,
} from '../src/index.js';

describe('shared-config', () => {
  it('parses booleans safely', () => {
    expect(parseBoolean('true', false)).toBe(true);
    expect(parseBoolean('0', true)).toBe(false);
    expect(parseBoolean(undefined, true)).toBe(true);
  });

  it('parses numbers safely', () => {
    expect(parseNumber('42', 1)).toBe(42);
    expect(parseNumber(undefined, 7)).toBe(7);
  });

  it('normalizes workspace paths', () => {
    const normalized = normalizeWorkspacePath('./examples/sample-workspace', '/tmp/repo');
    expect(normalized).toBe('/tmp/repo/examples/sample-workspace');
  });

  it('loads typed configuration from env', () => {
    const config = loadAppConfig(
      {
        NODE_ENV: 'test',
        LOG_LEVEL: 'warn',
        MCP_WORKSPACE_ROOT: './fixtures/ws',
        MCP_MAX_FILE_SIZE_BYTES: '2048',
        MCP_MAX_SEARCH_RESULTS: '50',
        MCP_REPORT_APPROVAL_REQUIRED: 'false',
        MCP_TRACE_ENABLED: '1',
      },
      '/repo',
    );

    expect(config.nodeEnv).toBe('test');
    expect(config.maxFileSizeBytes).toBe(2048);
    expect(config.reportApprovalRequired).toBe(false);
    expect(config.workspaceRoot).toBe('/repo/fixtures/ws');
  });

  it('provides test defaults', () => {
    expect(getTestDefaults().nodeEnv).toBe('test');
  });
});
