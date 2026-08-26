export interface ConversionJobData {
  jobId: string;
  itemId: string;
  sourceId: string;
  title: string;
  format: 'mp3' | 'mp4';
  quality: string;
}
