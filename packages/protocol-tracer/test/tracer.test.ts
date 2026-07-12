import { describe, expect, it } from 'vitest';

import { InMemoryTraceCollector, sanitizeMetadata } from '../src/index.js';

describe('protocol-tracer', () => {
  it('redacts sensitive metadata keys', () => {
    const sanitized = sanitizeMetadata({
      authorization: 'Bearer secret',
      toolName: 'search_documents',
      nested: {
        apiKey: 'abc',
        count: 2,
      },
    });

    expect(sanitized).toEqual({
      authorization: '[REDACTED]',
      toolName: 'search_documents',
      nested: {
        apiKey: '[REDACTED]',
        count: 2,
      },
    });
  });

  it('records and serializes events', () => {
    const collector = new InMemoryTraceCollector();
    collector.record({
      direction: 'client->server',
      serverId: 'workspace',
      messageType: 'request',
      method: 'tools/call',
      requestId: 1,
      success: true,
      metadata: {
        password: 'nope',
        queryLength: 4,
      },
    });

    const json = collector.toJSON();
    expect(json).toContain('"method": "tools/call"');
    expect(json).toContain('[REDACTED]');
    expect(json).not.toContain('nope');
    expect(collector.formatPretty()).toContain('tools/call');
  });
});
