import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { MediaConverterService } from '../services/media-converter/converter.js';
import { ConversionError, TimeoutError, DiskFullError } from '../services/media-converter/errors.js';

const TEST_DIR = join(import.meta.dirname, '..', '__test_tmp__');

describe('MediaConverterService', () => {
  let converter: MediaConverterService;

  beforeEach(async () => {
    converter = new MediaConverterService();
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await converter.cancel();
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('convertToMp3', () => {
    it('should reject empty input path', async () => {
      await assert.rejects(
        () => converter.convertToMp3({ inputPath: '', outputPath: '/tmp/out.mp3', bitrate: '192' }),
        (err: unknown) => {
          assert.ok(err instanceof ConversionError);
          assert.equal(err.code, 'INVALID_INPUT');
          return true;
        },
      );
    });

    it('should reject dangerous input paths', async () => {
      await assert.rejects(
        () => converter.convertToMp3({ inputPath: '../../etc/passwd', outputPath: '/tmp/out.mp3', bitrate: '192' }),
        (err: unknown) => {
          assert.ok(err instanceof ConversionError);
          assert.equal(err.code, 'INVALID_INPUT');
          return true;
        },
      );

      await assert.rejects(
        () => converter.convertToMp3({ inputPath: 'file;rm -rf /', outputPath: '/tmp/out.mp3', bitrate: '192' }),
        (err: unknown) => {
          assert.ok(err instanceof ConversionError);
          assert.equal(err.code, 'INVALID_INPUT');
          return true;
        },
      );
    });
  });

  describe('convertToMp4', () => {
    it('should reject empty input path', async () => {
      await assert.rejects(
        () => converter.convertToMp4({ inputPath: '', outputPath: '/tmp/out.mp4', quality: 'good' }),
        (err: unknown) => {
          assert.ok(err instanceof ConversionError);
          assert.equal(err.code, 'INVALID_INPUT');
          return true;
        },
      );
    });
  });

  describe('probe', () => {
    it('should reject empty input path', async () => {
      await assert.rejects(
        () => converter.probe(''),
        (err: unknown) => {
          assert.ok(err instanceof ConversionError);
          assert.equal(err.code, 'INVALID_INPUT');
          return true;
        },
      );
    });
  });

  describe('cancel', () => {
    it('should be callable even with no processes', async () => {
      await converter.cancel();
    });
  });
});

describe('ConversionError', () => {
  it('should create error with code and message', () => {
    const err = new ConversionError('CONVERSION_ERROR', 'test error');
    assert.equal(err.code, 'CONVERSION_ERROR');
    assert.equal(err.message, 'test error');
    assert.equal(err.name, 'ConversionError');
    assert.equal(err.ffmpegOutput, undefined);
    assert.equal(err.exitCode, undefined);
  });

  it('should accept optional fields', () => {
    const err = new ConversionError('CONVERSION_ERROR', 'test', {
      ffmpegOutput: 'output',
      exitCode: 1,
    });
    assert.equal(err.ffmpegOutput, 'output');
    assert.equal(err.exitCode, 1);
  });
});

describe('TimeoutError', () => {
  it('should create timeout error with duration', () => {
    const err = new TimeoutError(5000, 'mp3@192k');
    assert.equal(err.code, 'TIMEOUT');
    assert.equal(err.timeoutMs, 5000);
    assert.ok(err.message.includes('5000ms'));
    assert.ok(err.message.includes('mp3@192k'));
    assert.equal(err.name, 'TimeoutError');
  });
});

describe('DiskFullError', () => {
  it('should create disk full error', () => {
    const err = new DiskFullError('no space left');
    assert.equal(err.code, 'DISK_FULL');
    assert.equal(err.name, 'DiskFullError');
    assert.ok(err.message.includes('Disk full'));
  });
});
