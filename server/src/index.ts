import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './logging/logger.js';

app.listen(env.port, () => {
  logger.info(`Study4All API listening on port ${env.port}`, {
    port: env.port,
    environment: env.nodeEnv,
  });
});
