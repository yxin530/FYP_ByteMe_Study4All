import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/apiError.js';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 60_000;
const LIMIT = 120;

export function rateLimit(req: Request, _res: Response, next: NextFunction): void {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else if (++bucket.count > LIMIT) { next(new ApiError(429, 'RATE_LIMITED', 'Too many requests. Please try again shortly.')); return; }
  next();
}

export function clearRateLimitState(): void { buckets.clear(); }
