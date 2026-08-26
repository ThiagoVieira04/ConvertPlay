import { AnalyzeResult } from './types.js';

export interface MediaAnalyzer {
  /**
   * Check if this analyzer can handle the given URL
   */
  canHandle(url: string): boolean;

  /**
   * Analyze media content from the given URL
   * Returns structured information about the video or playlist
   */
  analyze(url: string): Promise<AnalyzeResult>;
}
