import { z } from 'zod';

export * from './errors.js';

export const toolRiskLevelSchema = z.enum(['read', 'generate', 'write', 'destructive', 'external']);

export type ToolRiskLevel = z.infer<typeof toolRiskLevelSchema>;

export const workspaceConfigSchema = z.object({
  root: z.string().min(1),
  maxFileSizeBytes: z.number().int().positive().default(1_048_576),
  maxSearchResults: z.number().int().min(1).max(100).default(100),
  supportedExtensions: z
    .array(z.string().regex(/^\.[a-z0-9]+$/i))
    .default(['.md', '.txt', '.json']),
  reportsDirectoryName: z.string().min(1).default('reports'),
});

export type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>;

export const searchDocumentsInputSchema = z.object({
  query: z.string().trim().min(1, 'query must not be empty'),
  paths: z.array(z.string().min(1)).optional(),
  maxResults: z.number().int().min(1).max(100).default(20),
});

export type SearchDocumentsInput = z.infer<typeof searchDocumentsInputSchema>;

export const searchDocumentMatchSchema = z.object({
  path: z.string(),
  line: z.number().int().positive(),
  excerpt: z.string(),
});

export type SearchDocumentMatch = z.infer<typeof searchDocumentMatchSchema>;

export const searchDocumentsResultSchema = z.object({
  query: z.string(),
  totalMatches: z.number().int().nonnegative(),
  matches: z.array(searchDocumentMatchSchema),
});

export type SearchDocumentsResult = z.infer<typeof searchDocumentsResultSchema>;

export const createReportInputSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().min(1),
  fileName: z.string().trim().min(1).optional(),
});

export type CreateReportInput = z.infer<typeof createReportInputSchema>;

export const createReportResultSchema = z.object({
  path: z.string(),
  createdAt: z.string().datetime(),
  byteSize: z.number().int().nonnegative(),
});

export type CreateReportResult = z.infer<typeof createReportResultSchema>;

export const workspaceSummarySchema = z.object({
  root: z.string(),
  fileCount: z.number().int().nonnegative(),
  supportedFileCount: z.number().int().nonnegative(),
  supportedExtensions: z.array(z.string()),
  reportsDirectory: z.string(),
});

export type WorkspaceSummary = z.infer<typeof workspaceSummarySchema>;

export const clientServerConfigSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  cwd: z.string().optional(),
  env: z.record(z.string()).optional(),
});

export type ClientServerConfig = z.infer<typeof clientServerConfigSchema>;

export const reviewProjectPromptArgsSchema = z.object({
  projectName: z.string().trim().min(1),
  focus: z.string().trim().min(1).optional(),
});

export type ReviewProjectPromptArgs = z.infer<typeof reviewProjectPromptArgsSchema>;
