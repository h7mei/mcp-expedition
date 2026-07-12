import { describe, expect, it } from 'vitest';

import { ExpeditionMcpClient } from '../src/index.js';

describe('mcp-client', () => {
  it('creates a client instance without connecting', () => {
    const client = new ExpeditionMcpClient({ clientName: 'test-client' });
    expect(client.rawClient).toBeDefined();
  });
});
