export type AppErrorCode =
  | 'INVALID_CONFIGURATION'
  | 'INVALID_WORKSPACE_PATH'
  | 'PATH_TRAVERSAL'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'TOOL_VALIDATION_FAILURE'
  | 'SERVER_STARTUP_FAILURE'
  | 'MCP_CONNECTION_FAILURE'
  | 'MCP_REQUEST_FAILURE'
  | 'TOOL_EXECUTION_FAILURE';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(code: AppErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
