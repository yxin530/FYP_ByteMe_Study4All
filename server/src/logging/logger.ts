export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'audit';

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /authorization/i,
  /secret/i,
  /api[_-]?key/i,
  /cookie/i,
  /credential/i,
  /private[_-]?key/i,
  /bearer/i,
];

export function redactSensitive(val: unknown): unknown {
  if (val === null || val === undefined) return val;

  if (typeof val === 'string') {
    // Redact bearer tokens if encountered in string
    if (/bearer\s+[a-zA-Z0-9._-]+/i.test(val)) {
      return val.replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [REDACTED]');
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => redactSensitive(item));
  }

  if (typeof val === 'object') {
    const output: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(k));
      if (isSensitiveKey) {
        output[k] = '[REDACTED]';
      } else {
        output[k] = redactSensitive(v);
      }
    }
    return output;
  }

  return val;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

function emitLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const sanitizedMeta = meta ? (redactSensitive(meta) as Record<string, unknown>) : {};
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...sanitizedMeta,
  };

  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emitLog('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emitLog('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emitLog('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emitLog('error', message, meta),
  audit: (message: string, meta?: Record<string, unknown>) => emitLog('audit', message, meta),
};

