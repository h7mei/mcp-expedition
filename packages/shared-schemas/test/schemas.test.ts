import { describe, expect, it } from 'vitest';

import {
  createReportInputSchema,
  searchDocumentsInputSchema,
  toolRiskLevelSchema,
  workspaceSummarySchema,
} from '../src/index.js';

describe('shared-schemas', () => {
  it('rejects empty search queries', () => {
    const result = searchDocumentsInputSchema.safeParse({ query: '   ' });
    expect(result.success).toBe(false);
  });

  it('applies default maxResults', () => {
    const result = searchDocumentsInputSchema.parse({ query: 'risk' });
    expect(result.maxResults).toBe(20);
  });

  it('rejects maxResults outside bounds', () => {
    expect(searchDocumentsInputSchema.safeParse({ query: 'risk', maxResults: 0 }).success).toBe(
      false,
    );
    expect(searchDocumentsInputSchema.safeParse({ query: 'risk', maxResults: 101 }).success).toBe(
      false,
    );
  });

  it('validates create report input', () => {
    const result = createReportInputSchema.parse({
      title: 'Status',
      content: '# Status\n\nAll clear.',
    });
    expect(result.title).toBe('Status');
    expect(result.fileName).toBeUndefined();
  });

  it('validates workspace summary shape', () => {
    const summary = workspaceSummarySchema.parse({
      root: 'sample-workspace',
      fileCount: 6,
      supportedFileCount: 6,
      supportedExtensions: ['.md', '.txt', '.json'],
      reportsDirectory: 'reports',
    });
    expect(summary.supportedFileCount).toBe(6);
  });

  it('accepts known risk levels', () => {
    expect(toolRiskLevelSchema.parse('write')).toBe('write');
  });
});
