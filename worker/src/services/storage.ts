import { mkdir, rm, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { env } from '../config/env.js';
import { log } from '../lib/logger.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface StoredFile {
  path: string;
  size: number;
}

export class StorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || env.STORAGE_DIR;
  }

  private validateId(id: string, name: string): void {
    if (!UUID_REGEX.test(id)) {
      throw new Error(`Invalid ${name}: must be a valid UUID`);
    }
  }

  private assertPathWithinBase(filePath: string): void {
    const resolved = resolve(filePath);
    const base = resolve(this.baseDir);
    if (!resolved.startsWith(base)) {
      throw new Error('Path traversal detected');
    }
  }

  async ensureDir(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
  }

  getOutputPath(jobId: string, itemId: string, format: 'mp3' | 'mp4'): string {
    this.validateId(jobId, 'jobId');
    this.validateId(itemId, 'itemId');
    const ext = format === 'mp3' ? 'mp3' : 'mp4';
    const filePath = join(this.baseDir, jobId, `${itemId}.${ext}`);
    this.assertPathWithinBase(filePath);
    return filePath;
  }

  async fileExists(filePath: string): Promise<boolean> {
    this.assertPathWithinBase(filePath);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async removeFile(filePath: string): Promise<void> {
    this.assertPathWithinBase(filePath);
    try {
      await rm(filePath, { force: true });
      log.debug('storage:removed', { path: filePath });
    } catch {
      // ignore
    }
  }

  async removeJobDir(jobId: string): Promise<void> {
    this.validateId(jobId, 'jobId');
    const dir = join(this.baseDir, jobId);
    this.assertPathWithinBase(dir);
    try {
      await rm(dir, { recursive: true, force: true });
      log.debug('storage:removed_dir', { jobId });
    } catch {
      // ignore
    }
  }
}

export const storage = new StorageService();
