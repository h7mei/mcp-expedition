import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { createReport } from '../../src/services/create-report.js';
import { ensureInsideWorkspace, sanitizeReportFileName } from '../../src/services/path-safety.js';
import { searchDocuments } from '../../src/services/search-documents.js';

describe('path safety', () => {
  it('rejects path traversal', () => {
    expect(() => ensureInsideWorkspace('/tmp/workspace', '../etc/passwd')).toThrowError(
      /escapes the approved workspace root/,
    );
  });

  it('sanitizes report file names', () => {
    expect(sanitizeReportFileName('Weekly Status!!')).toBe('weekly-status.md');
    expect(sanitizeReportFileName('Title', 'Custom Name.MD')).toBe('custom-name.md');
  });
});

describe('searchDocuments', () => {
  it('filters by extension and formats matches', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcp-search-'));
    await writeFile(join(root, 'notes.md'), 'line1\nrisk appears here\nline3\n');
    await writeFile(join(root, 'skip.bin'), 'risk should be ignored');

    const result = await searchDocuments(
      { query: 'risk', maxResults: 10 },
      { workspaceRoot: root, maxFileSizeBytes: 10_000 },
    );

    expect(result.totalMatches).toBe(1);
    expect(result.matches[0]?.path).toBe('notes.md');
    expect(result.matches[0]?.line).toBe(2);
    expect(result.matches[0]?.excerpt).toContain('risk');
  });

  it('rejects escaping search paths', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcp-search-'));
    await expect(
      searchDocuments(
        { query: 'risk', paths: ['../secret.md'], maxResults: 5 },
        { workspaceRoot: root, maxFileSizeBytes: 10_000 },
      ),
    ).rejects.toThrow(/escapes the approved workspace root/);
  });
});

describe('createReport', () => {
  it('writes only under reports and does not overwrite', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mcp-report-'));
    await mkdir(join(root, 'reports'), { recursive: true });

    const first = await createReport({ title: 'Status', content: 'All clear' }, root);
    expect(first.path).toBe('reports/status.md');

    await expect(createReport({ title: 'Status', content: 'Again' }, root)).rejects.toThrow(
      /already exists/,
    );
  });
});
