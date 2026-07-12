import {
  createReportInputSchema,
  searchDocumentsInputSchema,
  AppError,
  isAppError,
} from '@mcp-expedition/shared-schemas';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { logger } from '../../logger.js';
import { createReport } from '../../services/create-report.js';
import { searchDocuments } from '../../services/search-documents.js';

export interface ToolRegistrationContext {
  workspaceRoot: string;
  maxFileSizeBytes: number;
}

function formatToolError(error: unknown): {
  content: Array<{ type: 'text'; text: string }>;
  isError: true;
} {
  if (isAppError(error)) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            code: error.code,
            message: error.message,
            details: error.details ?? {},
          }),
        },
      ],
      isError: true,
    };
  }

  logger.error({ err: error }, 'Unhandled tool error');
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          code: 'TOOL_EXECUTION_FAILURE',
          message: 'Tool execution failed.',
        }),
      },
    ],
    isError: true,
  };
}

export function registerTools(server: McpServer, context: ToolRegistrationContext): void {
  server.tool(
    'search_documents',
    'Search approved text files inside the workspace for a query string.',
    searchDocumentsInputSchema.shape,
    async (args) => {
      try {
        const input = searchDocumentsInputSchema.parse(args);
        const result = await searchDocuments(input, {
          workspaceRoot: context.workspaceRoot,
          maxFileSizeBytes: context.maxFileSizeBytes,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return formatToolError(
            new AppError('TOOL_VALIDATION_FAILURE', 'Invalid search_documents input.', {
              issues: error.message,
            }),
          );
        }
        return formatToolError(error);
      }
    },
  );

  server.tool(
    'create_report',
    'Create a Markdown report inside the workspace reports directory. Requires approval.',
    createReportInputSchema.shape,
    async (args) => {
      try {
        const input = createReportInputSchema.parse(args);
        const result = await createReport(input, context.workspaceRoot);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          structuredContent: result,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
          return formatToolError(
            new AppError('TOOL_VALIDATION_FAILURE', 'Invalid create_report input.', {
              issues: error.message,
            }),
          );
        }
        return formatToolError(error);
      }
    },
  );
}
