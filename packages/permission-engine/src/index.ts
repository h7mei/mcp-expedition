import type { ToolRiskLevel } from '@mcp-expedition/shared-schemas';

export interface ToolPermissionDecision {
  toolName: string;
  riskLevel: ToolRiskLevel;
  requiresApproval: boolean;
  reason: string;
}

export interface PermissionPolicyOptions {
  generateRequiresApproval?: boolean;
}

const DEFAULT_TOOL_RISKS = {
  search_documents: 'read',
  create_report: 'write',
} as const satisfies Record<string, ToolRiskLevel>;

export function classifyToolRisk(toolName: string): ToolRiskLevel {
  const known = DEFAULT_TOOL_RISKS[toolName as keyof typeof DEFAULT_TOOL_RISKS];
  return known ?? 'external';
}

export function evaluateToolPermission(
  toolName: string,
  options: PermissionPolicyOptions = {},
): ToolPermissionDecision {
  const riskLevel = classifyToolRisk(toolName);
  const generateRequiresApproval = options.generateRequiresApproval ?? false;

  switch (riskLevel) {
    case 'read':
      return {
        toolName,
        riskLevel,
        requiresApproval: false,
        reason: 'Read-only tools do not require approval.',
      };
    case 'generate':
      return {
        toolName,
        riskLevel,
        requiresApproval: generateRequiresApproval,
        reason: generateRequiresApproval
          ? 'Generate tools require approval under the active policy.'
          : 'Generate tools are allowed without approval under the active policy.',
      };
    case 'write':
      return {
        toolName,
        riskLevel,
        requiresApproval: true,
        reason: 'Write tools mutate the workspace and require approval.',
      };
    case 'destructive':
      return {
        toolName,
        riskLevel,
        requiresApproval: true,
        reason: 'Destructive tools can delete or overwrite data and require approval.',
      };
    case 'external':
      return {
        toolName,
        riskLevel,
        requiresApproval: true,
        reason: 'External or unknown tools require approval.',
      };
  }
}

export function listKnownToolRisks(): Readonly<Record<string, ToolRiskLevel>> {
  return DEFAULT_TOOL_RISKS;
}
