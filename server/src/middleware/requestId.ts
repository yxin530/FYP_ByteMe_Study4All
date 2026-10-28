import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { RequestWithId } from '../types/http.js';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.header('x-request-id')?.trim() || randomUUID();
  (req as RequestWithId).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
