import dotenv from 'dotenv';

// Support running from either the repository root or the server directory.
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '../.env.local' });
dotenv.config();

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: positiveInteger(process.env.PORT, 3000),
  apiJsonLimit: process.env.API_JSON_LIMIT ?? '1mb',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  llmProvider: process.env.LLM_PROVIDER ?? 'openai',
  llmApiKey: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY,
  llmModel: process.env.LLM_MODEL ?? 'gpt-4o-mini',
  llmBaseUrl: (process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
};
