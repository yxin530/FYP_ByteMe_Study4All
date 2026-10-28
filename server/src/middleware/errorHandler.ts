import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../errors/apiError.js';
import type { RequestWithId } from '../types/http.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const requestId = (req as RequestWithId).requestId;
  const apiError = error instanceof ApiError ? error : undefined;
  const statusCode = apiError?.statusCode ?? 500;

  if (statusCode >= 500) console.error({ requestId, error });

  res.status(statusCode).json({
    error: {
      code: apiError?.code ?? 'INTERNAL_ERROR',
      message: apiError?.message ?? 'An unexpected server error occurred.',
      ...(apiError?.details === undefined ? {} : { details: apiError.details }),
    },
    requestId,
  });
};
