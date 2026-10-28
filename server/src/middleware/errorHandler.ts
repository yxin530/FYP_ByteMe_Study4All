import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../errors/apiError.js';
import { logger } from '../logging/logger.js';
import type { RequestWithId } from '../types/http.js';

interface BodyParserError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = (req as RequestWithId).requestId;

  // Handle JSON parse errors from express.json()
  const bodyParserErr = err as BodyParserError;
  if (
    bodyParserErr instanceof SyntaxError &&
    (bodyParserErr.status === 400 || bodyParserErr.statusCode === 400) &&
    'body' in bodyParserErr
  ) {
    res.status(400).json({
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON in request body.',
      },
      requestId,
    });
    return;
  }

  // Handle request body size limit exceeded
  if (bodyParserErr.type === 'entity.too.large') {
    res.status(413).json({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeds the configured limit.',
      },
      requestId,
    });
    return;
  }

  // Handle ApiError
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error(`Server error: ${err.message}`, {
        requestId,
        code: err.code,
        statusCode: err.statusCode,
        details: err.details,
      });
    }

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details === undefined ? {} : { details: err.details }),
      },
      requestId,
    });
    return;
  }

  // Unhandled / Internal server error
  logger.error('Unhandled server exception', {
    requestId,
    error: {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    },
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.',
    },
    requestId,
  });
};
