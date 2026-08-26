export interface ConvertOptions {
  inputPath: string;
  outputPath: string;
  timeoutMs?: number;
}

export interface ConvertMp3Options extends ConvertOptions {
  bitrate: '128' | '192' | '256' | '320';
}

export type Mp4Quality = 'best' | 'good' | 'standard';

export interface ConvertMp4Options extends ConvertOptions {
  quality: Mp4Quality;
}

export interface ConversionProgress {
  percent: number;
  time?: string;
  speed?: string;
  bitrate?: string;
}

export interface ConversionResult {
  outputPath: string;
  duration: number;
  fileSize: number;
}
