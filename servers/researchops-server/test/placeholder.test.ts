import { describe, expect, it } from 'vitest';

import { RESEARCHOPS_SERVER_STATUS, describeResearchOpsServer } from '../src/index.js';

describe('researchops-server placeholder', () => {
  it('exposes placeholder status', () => {
    expect(RESEARCHOPS_SERVER_STATUS).toBe('placeholder');
    expect(describeResearchOpsServer()).toContain('Streamable HTTP');
  });
});
