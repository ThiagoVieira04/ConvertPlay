import dotenv from 'dotenv';
import { join } from 'node:path';

dotenv.config();

const WORKSPACE_ROOT = join(import.meta.dirname, '..', '..', '..');

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: requireEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/convertflow?schema=public'),
  REDIS_URL: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  MAX_CONCURRENT_JOBS: Number(process.env.MAX_CONCURRENT_JOBS) || 2,
  JOB_LOCK_DURATION: Number(process.env.JOB_LOCK_DURATION) || 60_000,
  JOB_STALLED_INTERVAL: Number(process.env.JOB_STALLED_INTERVAL) || 30_000,
  FFMPEG_PATH: process.env.FFMPEG_PATH || 'ffmpeg',
  FFMPEG_TIMEOUT_MS: Number(process.env.FFMPEG_TIMEOUT_MS) || 300_000,
  STORAGE_DIR: process.env.STORAGE_DIR || join(WORKSPACE_ROOT, 'storage', 'output'),
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB) || 500,
  CLEANUP_INTERVAL_MS: Number(process.env.CLEANUP_INTERVAL_MS) || 3_600_000,
  JOB_TTL_HOURS: Number(process.env.JOB_TTL_HOURS) || 72,
  TEMP_FILE_TTL_HOURS: Number(process.env.TEMP_FILE_TTL_HOURS) || 48,
} as const;
