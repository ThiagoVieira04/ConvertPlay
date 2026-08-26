export type ConversionErrorCode =
  | 'CONVERSION_ERROR'
  | 'TIMEOUT'
  | 'DISK_FULL'
  | 'FFMPEG_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_FORMAT';

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;
  readonly ffmpegOutput?: string;
  readonly exitCode?: number;

  constructor(
    code: ConversionErrorCode,
    message: string,
    options?: { ffmpegOutput?: string; exitCode?: number; cause?: unknown },
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ConversionError';
    this.code = code;
    this.ffmpegOutput = options?.ffmpegOutput;
    this.exitCode = options?.exitCode;
  }
}

export class TimeoutError extends ConversionError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, details?: string) {
    super('TIMEOUT', `FFmpeg process timed out after ${timeoutMs}ms${details ? `: ${details}` : ''}`);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

export class DiskFullError extends ConversionError {
  constructor(ffmpegOutput?: string) {
    super('DISK_FULL', 'Disk full or no space left', { ffmpegOutput });
    this.name = 'DiskFullError';
  }
}
