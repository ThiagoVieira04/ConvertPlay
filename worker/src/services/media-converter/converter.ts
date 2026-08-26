import { spawn, type ChildProcess } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { log } from '../../lib/logger.js';
import { ConversionError, TimeoutError, DiskFullError } from './errors.js';
import type {
  ConvertMp3Options,
  ConvertMp4Options,
  ConversionProgress,
  ConversionResult,
  Mp4Quality,
} from './types.js';

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
const DEFAULT_TIMEOUT_MS = 300_000;

const MP4_QUALITY_MAP: Record<Mp4Quality, string> = {
  best: '0',
  good: '23',
  standard: '28',
};

function parseProgressLine(line: string): Partial<ConversionProgress> {
  const progress: Partial<ConversionProgress> = {};

  const timeMatch = line.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
  if (timeMatch) progress.time = timeMatch[1];

  const speedMatch = line.match(/speed=\s*([\d.]+x)/);
  if (speedMatch) progress.speed = speedMatch[1];

  const bitrateMatch = line.match(/bitrate=\s*([\d.]+kbits\/s)/);
  if (bitrateMatch) progress.bitrate = bitrateMatch[1];

  const percentMatch = line.match(/progress=\s*(\w+)/);
  if (percentMatch && percentMatch[1] === 'end') {
    progress.percent = 100;
  }

  return progress;
}

function isDiskFullOutput(output: string): boolean {
  const lower = output.toLowerCase();
  return (
    lower.includes('no space left on device') ||
    lower.includes('disk full') ||
    lower.includes('write error')
  );
}

export class MediaConverterService {
  private runningProcesses = new Set<ChildProcess>();

  async convertToMp3(options: ConvertMp3Options): Promise<ConversionResult> {
    const { inputPath, outputPath, bitrate, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    this.validateInput(inputPath);

    const args = [
      '-y',
      '-i', inputPath,
      '-codec:a', 'libmp3lame',
      '-b:a', `${bitrate}k`,
      '-q:a', '2',
      '-map_metadata', '0',
      '-id3v2_version', '3',
      outputPath,
    ];

    return this.runFfmpeg(args, outputPath, timeoutMs, `mp3@${bitrate}k`);
  }

  async convertToMp4(options: ConvertMp4Options): Promise<ConversionResult> {
    const { inputPath, outputPath, quality, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

    this.validateInput(inputPath);

    const crfValue = MP4_QUALITY_MAP[quality];

    const args = [
      '-y',
      '-i', inputPath,
      '-codec:v', 'libx264',
      '-crf', crfValue,
      '-preset', 'medium',
      '-codec:a', 'aac',
      '-b:a', '192k',
      '-movflags', '+faststart',
      outputPath,
    ];

    return this.runFfmpeg(args, outputPath, timeoutMs, `mp4@${quality}`);
  }

  async probe(inputPath: string): Promise<{ duration: number; format: string }> {
    this.validateInput(inputPath);

    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      inputPath,
    ];

    const output = await this.execFfmpeg(args, 30_000);

    try {
      const probe = JSON.parse(output);
      return {
        duration: parseFloat(probe.format?.duration || '0'),
        format: probe.format?.format_name || 'unknown',
      };
    } catch {
      return { duration: 0, format: 'unknown' };
    }
  }

  async cancel(): Promise<void> {
    const processes = Array.from(this.runningProcesses);
    this.runningProcesses.clear();

    for (const proc of processes) {
      try {
        proc.kill('SIGTERM');
      } catch {
        // process already dead
      }
    }
  }

  private validateInput(inputPath: string): void {
    if (!inputPath || inputPath.trim().length === 0) {
      throw new ConversionError('INVALID_INPUT', 'Input path is empty');
    }
    const dangerous = ['..', '|', ';', '&', '$', '`', '\n', '\r', '\0'];
    for (const char of dangerous) {
      if (inputPath.includes(char)) {
        throw new ConversionError('INVALID_INPUT', `Input path contains dangerous character: ${char}`);
      }
    }
  }

  private runFfmpeg(
    args: string[],
    outputPath: string,
    timeoutMs: number,
    label: string,
  ): Promise<ConversionResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let stderrOutput = '';
      let killed = false;

      log.info('ffmpeg:start', { label, args: args.join(' ') });

      const proc = spawn(FFMPEG_PATH, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.runningProcesses.add(proc);

      const timer = setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
        reject(new TimeoutError(timeoutMs, label));
      }, timeoutMs);

      proc.stdout?.on('data', (chunk: Buffer) => {
        const line = chunk.toString().trim();
        if (line) {
          const progress = parseProgressLine(line);
          if (progress.percent !== undefined || progress.time) {
            log.debug('ffmpeg:progress', { label, ...progress });
          }
        }
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        stderrOutput += chunk.toString();
        const line = chunk.toString().trim();
        if (line) {
          log.debug('ffmpeg:stderr', { label, line: line.substring(0, 200) });
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        this.runningProcesses.delete(proc);

        if (err.message.includes('ENOENT')) {
          reject(new ConversionError('FFMPEG_NOT_FOUND', `FFmpeg not found at: ${FFMPEG_PATH}`));
          return;
        }

        reject(new ConversionError('CONVERSION_ERROR', `FFmpeg process error: ${err.message}`, { cause: err }));
      });

      proc.on('close', async (code) => {
        clearTimeout(timer);
        this.runningProcesses.delete(proc);

        if (killed) return;

        const duration = Date.now() - startTime;

        log.info('ffmpeg:done', { label, exitCode: code, durationMs: duration });

        if (code !== 0) {
          if (isDiskFullOutput(stderrOutput)) {
            reject(new DiskFullError(stderrOutput));
            return;
          }

          reject(
            new ConversionError('CONVERSION_ERROR', `FFmpeg exited with code ${code}`, {
              ffmpegOutput: stderrOutput.substring(0, 2000),
              exitCode: code ?? undefined,
            }),
          );
          return;
        }

        try {
          const stats = await stat(outputPath);
          resolve({
            outputPath,
            duration,
            fileSize: stats.size,
          });
        } catch {
          reject(
            new ConversionError('CONVERSION_ERROR', 'Output file was not created', {
              ffmpegOutput: stderrOutput.substring(0, 2000),
            }),
          );
        }
      });
    });
  }

  private execFfmpeg(args: string[], timeoutMs: number): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const proc = spawn(FFMPEG_PATH, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      const timer = setTimeout(() => {
        proc.kill('SIGKILL');
        reject(new TimeoutError(timeoutMs, 'ffprobe'));
      }, timeoutMs);

      proc.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      proc.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        if (err.message.includes('ENOENT')) {
          reject(new ConversionError('FFMPEG_NOT_FOUND', `FFmpeg not found at: ${FFMPEG_PATH}`));
          return;
        }
        reject(err);
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new ConversionError('CONVERSION_ERROR', `ffprobe exited with code ${code}`, {
            ffmpegOutput: stderr.substring(0, 2000),
            exitCode: code ?? undefined,
          }));
          return;
        }
        resolve(stdout);
      });
    });
  }
}

export const mediaConverter = new MediaConverterService();
