/**
 * Placeholder domain model for the future Streamable HTTP ResearchOps server.
 * Authentication and remote transport are intentionally not implemented yet.
 */

export type RiskStatus = 'open' | 'mitigating' | 'closed';
export type DecisionStatus = 'proposed' | 'accepted' | 'deferred';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Project {
  id: string;
  name: string;
  owner: string;
  targetDate: string;
  summary: string;
}

export interface Risk {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: RiskStatus;
  severity: 'low' | 'medium' | 'high';
}

export interface Decision {
  id: string;
  projectId: string;
  title: string;
  status: DecisionStatus;
  notes: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  owner?: string;
}

export const RESEARCHOPS_SERVER_STATUS = 'placeholder' as const;

export function describeResearchOpsServer(): string {
  return 'ResearchOps MCP server placeholder — Streamable HTTP transport planned for a later milestone.';
}
