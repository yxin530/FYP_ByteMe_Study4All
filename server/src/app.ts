import express, { type Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import featureRoutes from './routes/featureRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
  app.use(express.json({ limit: env.apiJsonLimit }));
  app.use(requestIdMiddleware);
  app.use(requestLogger);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'study4all-api',
      environment: env.nodeEnv,
    });
  });

  app.use('/api', featureRoutes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

