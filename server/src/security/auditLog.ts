import { logger, redactSensitive } from '../logging/logger.js';

export interface AuditActor {
  id?: string;
  ip?: string;
  userAgent?: string;
  role?: string;
}

export interface AuditResource {
  type: string;
  id?: string;
  version?: string;
  materialIds?: string[];
  materialVersionHashes?: string[];
}

export interface AuditEvent {
  event: string;
  action: string;
  actor?: AuditActor;
  resource?: AuditResource;
  decision?: 'allow' | 'deny';
  outcome: 'success' | 'failure' | 'pending';
  requestId?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

export function recordAuditEvent(event: AuditEvent): void {
  const sanitizedDetails = event.details
    ? (redactSensitive(event.details) as Record<string, unknown>)
    : undefined;

  const sanitizedActor = event.actor
    ? (redactSensitive(event.actor) as AuditActor)
    : undefined;

  const payload = {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
    actor: sanitizedActor,
    details: sanitizedDetails,
  };

  logger.audit(`[AUDIT] ${event.action} - ${event.outcome}`, {
    auditEvent: payload,
    requestId: event.requestId,
  });
}

