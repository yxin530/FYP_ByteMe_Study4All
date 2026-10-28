import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logging/logger.js';
import type { RequestWithId } from '../types/http.js';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTime = process.hrtime.bigint();
  const requestId = (req as RequestWithId).requestId;

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const statusCode = res.statusCode;

    const meta = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.header('user-agent'),
    };

    const message = `${req.method} ${req.path} ${statusCode} - ${meta.durationMs}ms`;

    if (statusCode >= 500) {
      logger.error(message, meta);
    } else if (statusCode >= 400) {
      logger.warn(message, meta);
    } else {
      logger.info(message, meta);
    }
  });

  next();
}

