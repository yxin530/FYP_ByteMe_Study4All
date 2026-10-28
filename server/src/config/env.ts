import 'dotenv/config';

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: positiveInteger(process.env.PORT, 3000),
  apiJsonLimit: process.env.API_JSON_LIMIT ?? '1mb',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
