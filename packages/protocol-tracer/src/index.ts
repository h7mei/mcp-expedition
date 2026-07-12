export type TraceDirection = 'client->server' | 'server->client';

export type TraceMessageType = 'request' | 'response' | 'notification' | 'error' | 'lifecycle';

export interface TraceEvent {
  timestamp: string;
  direction: TraceDirection;
  serverId: string;
  messageType: TraceMessageType;
  method?: string;
  requestId?: string | number;
  durationMs?: number;
  success?: boolean;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEY_PATTERN =
  /(authorization|password|secret|token|api[_-]?key|cookie|credential|content|fileContents)/i;

export function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) {
    return undefined;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeMetadata(value as Record<string, unknown>);
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export class InMemoryTraceCollector {
  readonly #events: TraceEvent[] = [];

  record(event: Omit<TraceEvent, 'timestamp'> & { timestamp?: string }): TraceEvent {
    const recorded: TraceEvent = {
      timestamp: event.timestamp ?? new Date().toISOString(),
      direction: event.direction,
      serverId: event.serverId,
      messageType: event.messageType,
    };

    if (event.method !== undefined) {
      recorded.method = event.method;
    }
    if (event.requestId !== undefined) {
      recorded.requestId = event.requestId;
    }
    if (event.durationMs !== undefined) {
      recorded.durationMs = event.durationMs;
    }
    if (event.success !== undefined) {
      recorded.success = event.success;
    }
    if (event.metadata !== undefined) {
      const sanitized = sanitizeMetadata(event.metadata);
      if (sanitized !== undefined) {
        recorded.metadata = sanitized;
      }
    }

    this.#events.push(recorded);
    return recorded;
  }

  list(): readonly TraceEvent[] {
    return this.#events;
  }

  clear(): void {
    this.#events.length = 0;
  }

  toJSON(): string {
    return JSON.stringify(this.#events, null, 2);
  }

  formatPretty(): string {
    if (this.#events.length === 0) {
      return '(no trace events)';
    }

    return this.#events
      .map((event) => {
        const method = event.method ?? '-';
        const requestId = event.requestId !== undefined ? String(event.requestId) : '-';
        const duration = event.durationMs !== undefined ? `${event.durationMs}ms` : '-';
        const success = event.success === undefined ? '-' : event.success ? 'ok' : 'error';
        return `${event.timestamp} ${event.direction} ${event.serverId} ${event.messageType} method=${method} id=${requestId} duration=${duration} result=${success}`;
      })
      .join('\n');
  }
}
