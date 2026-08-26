import { MediaAnalyzer } from './analyzer.js';
import { AnalyzeResult } from './types.js';
import { YouTubeAnalyzer } from './youtube.js';

export class MediaAnalyzerService {
  private analyzers: MediaAnalyzer[] = [];

  constructor() {
    // Register analyzers in order of priority
    this.analyzers.push(new YouTubeAnalyzer());
    // Future: this.analyzers.push(new VimeoAnalyzer());
  }

  /**
   * Add a custom analyzer to the pipeline
   */
  registerAnalyzer(analyzer: MediaAnalyzer): void {
    this.analyzers.push(analyzer);
  }

  /**
   * Analyze media from the given URL
   * Tries each registered analyzer until one can handle the URL
   */
  async analyze(url: string): Promise<AnalyzeResult> {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL é obrigatória.',
        },
      };
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL inválida.',
        },
      };
    }

    // Only allow HTTP/HTTPS
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL inválida. Use um endereço HTTP ou HTTPS.',
        },
      };
    }

    // Find an analyzer that can handle this URL
    const analyzer = this.analyzers.find((a) => a.canHandle(trimmedUrl));

    if (!analyzer) {
      return {
        success: false,
        error: {
          code: 'UNSUPPORTED_SOURCE',
          message: 'Fonte não suportada. Use uma URL do YouTube.',
        },
      };
    }

    // Delegate to the analyzer
    try {
      return await analyzer.analyze(trimmedUrl);
    } catch (error) {
      console.error('Error analyzing media:', error);
      return {
        success: false,
        error: {
          code: 'SOURCE_UNAVAILABLE',
          message: 'Não foi possível acessar a fonte. Tente novamente mais tarde.',
        },
      };
    }
  }
}
