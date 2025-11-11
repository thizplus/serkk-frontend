/**
 * Upload Types and Interfaces
 */

export interface UploadProgress {
  fileIndex: number;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  mediaId?: string;
  url?: string;
  thumbnail?: string;
  error?: string;
}

export interface UploadOptions {
  concurrency?: number; // Number of concurrent uploads (default: FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS)
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (results: UploadProgress[]) => void;
  onError?: (error: Error, fileIndex: number) => void;
}

export interface UploadResult {
  success: boolean;
  results: UploadProgress[];
  successCount: number;
  failedCount: number;
}
