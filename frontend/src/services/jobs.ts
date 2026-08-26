import { api } from '@/lib/api';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type JobItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CreateJobInput {
  sourceUrl: string;
  type: 'video' | 'playlist';
  format: 'mp3' | 'mp4';
  quality: string;
  items: {
    id: string;
    title: string;
    position: number;
  }[];
}

export interface CreateJobResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  total: number;
  completed: number;
  processing: number;
  queued: number;
  failed: number;
  progress: number;
}

export interface JobItem {
  id: string;
  jobId: string;
  sourceId: string;
  title: string;
  position: number;
  status: JobItemStatus;
  error: string | null;
  outputFilePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobDetails {
  id: string;
  sourceUrl: string;
  type: 'video' | 'playlist';
  format: 'mp3' | 'mp4';
  quality: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  items: JobItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export async function createJob(input: CreateJobInput): Promise<ApiResponse<CreateJobResponse>> {
  const { data } = await api.post<ApiResponse<CreateJobResponse>>('/api/jobs', input);
  return data;
}

export async function getJobProgress(jobId: string): Promise<ApiResponse<JobProgress>> {
  const { data } = await api.get<ApiResponse<JobProgress>>(`/api/jobs/${jobId}`);
  return data;
}

export async function getJobDetails(jobId: string): Promise<ApiResponse<JobDetails>> {
  const { data } = await api.get<ApiResponse<JobDetails>>(`/api/jobs/${jobId}/details`);
  return data;
}

export async function cancelJob(jobId: string): Promise<ApiResponse<{ jobId: string; status: JobStatus }>> {
  const { data } = await api.post<ApiResponse<{ jobId: string; status: JobStatus }>>(
    `/api/jobs/${jobId}/cancel`,
  );
  return data;
}

export async function retryJob(jobId: string): Promise<ApiResponse<{ jobId: string; status: JobStatus; retried: number; skipped: number }>> {
  const { data } = await api.post<ApiResponse<{ jobId: string; status: JobStatus; retried: number; skipped: number }>>(
    `/api/jobs/${jobId}/retry`,
  );
  return data;
}

export function getItemDownloadUrl(itemId: string): string {
  return `/api/items/${itemId}/download`;
}

export function getJobDownloadZipUrl(jobId: string): string {
  return `/api/jobs/${jobId}/download.zip`;
}
