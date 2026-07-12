import { describe, expect, it } from 'vitest';

import { evaluateToolPermission } from '../src/index.js';

describe('permission-engine', () => {
  it('allows read tools without approval', () => {
    const decision = evaluateToolPermission('search_documents');
    expect(decision.requiresApproval).toBe(false);
    expect(decision.riskLevel).toBe('read');
  });

  it('requires approval for write tools', () => {
    const decision = evaluateToolPermission('create_report');
    expect(decision.requiresApproval).toBe(true);
    expect(decision.riskLevel).toBe('write');
  });

  it('treats unknown tools as external', () => {
    const decision = evaluateToolPermission('unknown_tool');
    expect(decision.riskLevel).toBe('external');
    expect(decision.requiresApproval).toBe(true);
  });

  it('honors generate approval configuration', () => {
    expect(evaluateToolPermission('draft_summary').requiresApproval).toBe(true);
    const configured = evaluateToolPermission('search_documents', {
      generateRequiresApproval: true,
    });
    expect(configured.riskLevel).toBe('read');
  });
});
