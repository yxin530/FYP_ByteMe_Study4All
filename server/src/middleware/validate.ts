import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';
import { ApiError } from '../errors/apiError.js';
import type { RequestWithId } from '../types/http.js';
import { recordAuditEvent } from '../security/auditLog.js';

export interface RequestValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export interface FormattedValidationIssue {
  path: string;
  message: string;
  code: string;
}

export function validateRequest(schemas: RequestValidationSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const requestId = (req as RequestWithId).requestId;
    const issues: FormattedValidationIssue[] = [];

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (result.success) {
        req.params = result.data as Record<string, string>;
      } else {
        issues.push(...formatIssues('params', result.error));
      }
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (result.success) {
        req.query = result.data as Record<string, any>;
      } else {
        issues.push(...formatIssues('query', result.error));
      }
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (result.success) {
        req.body = result.data;
      } else {
        issues.push(...formatIssues('body', result.error));
      }
    }

    if (issues.length > 0) {
      recordAuditEvent({
        event: 'request.validation_failed',
        action: 'VALIDATE_REQUEST',
        actor: { ip: req.ip, userAgent: req.header('user-agent') },
        resource: { type: 'route', id: `${req.method} ${req.path}` },
        decision: 'deny',
        outcome: 'failure',
        requestId,
        details: { issues },
      });

      next(new ApiError(400, 'VALIDATION_ERROR', 'Request validation failed', issues));
      return;
    }

    next();
  };
}

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return validateRequest({ body: schema });
}

function formatIssues(target: 'body' | 'query' | 'params', error: z.ZodError): FormattedValidationIssue[] {
  return error.issues.map((issue) => {
    const fieldPath = issue.path.length > 0 ? issue.path.join('.') : target;
    return {
      path: target === 'body' && issue.path.length > 0 ? fieldPath : `${target}.${fieldPath}`,
      message: issue.message,
      code: issue.code,
    };
  });
}
