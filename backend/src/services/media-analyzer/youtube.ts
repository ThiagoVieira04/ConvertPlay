import { MediaAnalyzer } from './analyzer.js';
import { AnalyzeResult, VideoInfo, PlaylistInfo, MediaInfo } from './types.js';

// Supported platform patterns
const SUPPORTED_PATTERNS = {
  youtube: {
    video: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    playlist: /youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/,
  },
} as const;

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const match = url.match(SUPPORTED_PATTERNS.youtube.video);
  return match?.[1] ?? null;
}

// Extract playlist ID from URL
function extractPlaylistId(url: string): string | null {
  const match = url.match(SUPPORTED_PATTERNS.youtube.playlist);
  return match?.[1] ?? null;
}

/**
 * YouTube Media Analyzer
 *
 * NOTE: This is a placeholder implementation for development.
 * It returns mock data to demonstrate the architecture.
 *
 * Production implementation should use YouTube Data API v3
 * or other official APIs with proper authentication.
 */
export class YouTubeAnalyzer implements MediaAnalyzer {
  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.replace('www.', '');

      return (
        hostname === 'youtube.com' ||
        hostname === 'youtu.be' ||
        hostname === 'm.youtube.com'
      );
    } catch {
      return false;
    }
  }

  async analyze(url: string): Promise<AnalyzeResult> {
    try {
      const parsed = new URL(url);

      // Check for playlist
      const playlistId = extractPlaylistId(url);
      if (playlistId) {
        return this.analyzePlaylist(playlistId);
      }

      // Check for video
      const videoId = extractVideoId(url);
      if (videoId) {
        return this.analyzeVideo(videoId);
      }

      return {
        success: false,
        error: {
          code: 'UNSUPPORTED_SOURCE',
          message: 'Não foi possível identificar o tipo de conteúdo na URL.',
        },
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'URL inválida.',
        },
      };
    }
  }

  private async analyzeVideo(videoId: string): Promise<AnalyzeResult> {
    // Mock implementation - returns simulated video data
    const mockVideo: VideoInfo = {
      type: 'video',
      id: videoId,
      title: `Vídeo ${videoId}`,
      thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      duration: 240,
      available: true,
    };

    return {
      success: true,
      data: mockVideo,
    };
  }

  private async analyzePlaylist(playlistId: string): Promise<AnalyzeResult> {
    // Mock implementation - returns simulated playlist data
    const mockItems = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${playlistId}-${i + 1}`,
      title: `Vídeo ${i + 1} da playlist`,
      duration: 180 + i * 30,
      thumbnail: `https://img.youtube.com/vi/item-${i + 1}/mqdefault.jpg`,
      position: i + 1,
    }));

    const mockPlaylist: PlaylistInfo = {
      type: 'playlist',
      id: playlistId,
      title: `Playlist ${playlistId}`,
      thumbnail: `https://img.youtube.com/vi/item-${playlistId}-1/mqdefault.jpg`,
      itemCount: mockItems.length,
      items: mockItems,
    };

    return {
      success: true,
      data: mockPlaylist,
    };
  }
}
