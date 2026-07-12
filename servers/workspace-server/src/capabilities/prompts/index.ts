import { reviewProjectPromptArgsSchema } from '@mcp-expedition/shared-schemas';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerPrompts(server: McpServer): void {
  server.prompt(
    'review_project',
    'Generate a careful project review prompt grounded in workspace sources.',
    {
      projectName: reviewProjectPromptArgsSchema.shape.projectName,
      focus: reviewProjectPromptArgsSchema.shape.focus.optional(),
    },
    (args) => {
      const parsed = reviewProjectPromptArgsSchema.parse(args);
      const focusLine = parsed.focus
        ? `Focus especially on: ${parsed.focus}.`
        : 'Cover overall delivery health.';

      const text = [
        `You are reviewing the project "${parsed.projectName}".`,
        focusLine,
        'Using only the available workspace context:',
        '1. Summarize current project status.',
        '2. Identify risks.',
        '3. Identify unresolved decisions.',
        '4. Extract concrete action items.',
        'Rules:',
        '- Do not invent facts.',
        '- If information is missing, say so explicitly.',
        '- Reference source file paths wherever possible.',
      ].join('\n');

      return {
        description: `Review prompt for ${parsed.projectName}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text,
            },
          },
        ],
      };
    },
  );
}
