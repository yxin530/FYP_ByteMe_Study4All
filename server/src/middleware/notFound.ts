import type { RequestHandler } from 'express';
import { ApiError } from '../errors/apiError.js';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, 'ROUTE_NOT_FOUND', `Route ${req.method} ${req.path} was not found.`));
};
