// ============================================================================
// useFileUpload Hook
// Custom hook สำหรับ Upload ไฟล์ไป Cloudflare R2
// ============================================================================

'use client';

import { useState, useCallback } from 'react';
import {
  uploadFileWithRetry,
  validateFile,
  getUploadErrorMessage,
} from '@/lib/api/r2-upload.service';
import type { UploadAdditionalData } from '@/types/upload';

/**
 * Hook Options
 */
export interface UseFileUploadOptions {
  maxRetries?: number;
  onSuccess?: (fileUrl: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook Return Type
 */
export interface UseFileUploadReturn {
  isUploading: boolean;
  progress: number;
  fileUrl: string | null;
  error: Error | null;
  upload: (file: File, additionalData?: UploadAdditionalData) => Promise<string | null>;
  reset: () => void;
}

/**
 * Custom Hook for File Upload
 */
export function useFileUpload(options?: UseFileUploadOptions): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const { maxRetries = 3, onSuccess, onError } = options || {};

  /**
   * Upload file
   */
  const upload = useCallback(
    async (file: File, additionalData?: UploadAdditionalData): Promise<string | null> => {
      // Reset state
      setIsUploading(true);
      setProgress(0);
      setFileUrl(null);
      setError(null);

      try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        // Upload with retry
        const url = await uploadFileWithRetry(
          file,
          maxRetries,
          (progressValue) => {
            setProgress(Math.round(progressValue));
          },
          additionalData
        );

        // Success
        setFileUrl(url);
        setProgress(100);
        onSuccess?.(url);

        return url;
      } catch (err) {
        const uploadError = err as Error;
        setError(uploadError);
        onError?.(uploadError);

        // Show user-friendly error message
        console.error('Upload error:', getUploadErrorMessage(uploadError));

        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [maxRetries, onSuccess, onError]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setFileUrl(null);
    setError(null);
  }, []);

  return {
    isUploading,
    progress,
    fileUrl,
    error,
    upload,
    reset,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useFileUpload;
