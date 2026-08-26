import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  HOST: process.env.HOST || '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/convertflow?schema=public'),
  REDIS_URL: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 30,
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS) || 30000,
  MAX_URL_LENGTH: Number(process.env.MAX_URL_LENGTH) || 2048,
  MAX_ITEMS_PER_JOB: Number(process.env.MAX_ITEMS_PER_JOB) || 50,
  JOB_TTL_HOURS: Number(process.env.JOB_TTL_HOURS) || 72,
  TEMP_FILE_TTL_HOURS: Number(process.env.TEMP_FILE_TTL_HOURS) || 48,
  ZIP_FILE_TTL_HOURS: Number(process.env.ZIP_FILE_TTL_HOURS) || 24,
} as const;
