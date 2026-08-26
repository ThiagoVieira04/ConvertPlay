import { api } from '@/lib/api';

export interface AnalyzeRequest {
  url: string;
}

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

export type AnalyzeData = VideoInfo | PlaylistInfo;

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function analyzeMedia(url: string): Promise<ApiResponse<AnalyzeData>> {
  const { data } = await api.post<ApiResponse<AnalyzeData>>('/api/media/analyze', { url });
  return data;
}
