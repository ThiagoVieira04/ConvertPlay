export interface VideoInfo {
  type: 'video';
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  available: boolean;
}

export interface PlaylistItem {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  position: number;
}

export interface PlaylistInfo {
  type: 'playlist';
  id: string;
  title: string;
  thumbnail: string;
  itemCount: number;
  items: PlaylistItem[];
}

export type MediaInfo = VideoInfo | PlaylistInfo;

export interface MediaAnalyzerError {
  code: 'UNSUPPORTED_SOURCE' | 'SOURCE_UNAVAILABLE' | 'INVALID_URL';
  message: string;
}

export type AnalyzeResult =
  | { success: true; data: MediaInfo }
  | { success: false; error: MediaAnalyzerError };
