export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AnalyzeRequest {
  url: string;
}

export interface AnalyzeData {
  url: string;
  type: 'video' | 'playlist' | 'unknown';
  domain: string;
  analyzedAt: string;
}

export type AnalyzeResponse = ApiResponse<AnalyzeData>;
