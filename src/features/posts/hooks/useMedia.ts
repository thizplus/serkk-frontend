"use client";

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import mediaService from '@/lib/api/media.service';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/config';

/**
 * Hook สำหรับ upload รูปภาพ
 *
 * @returns Mutation result พร้อม upload progress
 *
 * @example
 * ```tsx
 * const uploadImage = useUploadImage();
 *
 * const handleFileChange = async (file: File) => {
 *   try {
 *     const result = await uploadImage.mutateAsync(file);
 *     console.log('Image URL:', result.url);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 *
 * // Check progress
 * console.log('Progress:', uploadImage.progress);
 * ```
 */
export function useUploadImage() {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('📤 Uploading image:', file.name);
      setProgress(0);

      const response = await mediaService.uploadImage(file, (uploadProgress) => {
        setProgress(uploadProgress);
        console.log(`⏳ Upload progress: ${uploadProgress}%`);
      });

      console.log('📡 Upload image API response:', {
        success: response.success,
        hasData: !!response.data,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to upload image');
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Image uploaded successfully:', {
        id: data.id,
        url: data.url,
      });
      setProgress(100);
      toast.success(TOAST_MESSAGES.MEDIA.UPLOAD_SUCCESS);
    },
    onError: (error: Error) => {
      console.error('❌ Upload image error:', error);
      setProgress(0);
      toast.error(TOAST_MESSAGES.MEDIA.UPLOAD_ERROR);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

/**
 * Hook สำหรับ upload วิดีโอ
 *
 * @returns Mutation result พร้อม upload progress
 *
 * @example
 * ```tsx
 * const uploadVideo = useUploadVideo();
 *
 * const handleFileChange = async (file: File) => {
 *   try {
 *     const result = await uploadVideo.mutateAsync(file);
 *     console.log('Video URL:', result.url);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 * ```
 */
export function useUploadVideo() {
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      console.log('📤 Uploading video:', file.name);
      setProgress(0);

      const response = await mediaService.uploadVideo(file, (uploadProgress) => {
        setProgress(uploadProgress);
        console.log(`⏳ Upload progress: ${uploadProgress}%`);
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to upload video');
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('✅ Video uploaded successfully:', {
        id: data.id,
        url: data.url,
      });
      setProgress(100);
      toast.success(TOAST_MESSAGES.MEDIA.UPLOAD_SUCCESS);
    },
    onError: (error: Error) => {
      console.error('❌ Upload video error:', error);
      setProgress(0);
      toast.error(TOAST_MESSAGES.MEDIA.UPLOAD_ERROR);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

/**
 * Hook สำหรับลบ media
 *
 * @returns Mutation result
 *
 * @example
 * ```tsx
 * const deleteMedia = useDeleteMedia();
 *
 * const handleDelete = async (id: string) => {
 *   try {
 *     await deleteMedia.mutateAsync(id);
 *   } catch (error) {
 *     console.error('Delete failed:', error);
 *   }
 * };
 * ```
 */
export function useDeleteMedia() {
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('🗑️ Deleting media:', id);
      const response = await mediaService.delete(id);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete media');
      }

      return response;
    },
    onSuccess: () => {
      console.log('✅ Media deleted successfully');
      toast.success(TOAST_MESSAGES.MEDIA.DELETE_SUCCESS);
    },
    onError: (error: Error) => {
      console.error('❌ Delete media error:', error);
      toast.error(TOAST_MESSAGES.MEDIA.DELETE_ERROR);
    },
  });
}

/**
 * Hook สำหรับ upload หลายไฟล์พร้อมกัน (สำหรับสร้างโพสต์)
 *
 * @returns Object with uploadMultiple function and upload state
 *
 * @example
 * ```tsx
 * const { uploadMultiple, isUploading, progress } = useUploadMultipleMedia();
 *
 * const handleUpload = async (files: File[]) => {
 *   try {
 *     const mediaIds = await uploadMultiple(files);
 *     console.log('Uploaded media IDs:', mediaIds);
 *   } catch (error) {
 *     console.error('Upload failed:', error);
 *   }
 * };
 * ```
 */
export function useUploadMultipleMedia() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [overallProgress, setOverallProgress] = useState(0);

  const uploadMultiple = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) {
      return [];
    }

    setIsUploading(true);
    setProgress({});
    setOverallProgress(0);

    try {
      console.log(`📤 Uploading ${files.length} files...`);

      // Upload all files in parallel
      const uploadPromises = files.map(async (file, index) => {
        const fileName = `file-${index}`;
        const isImage = file.type.startsWith('image/');

        // Create progress tracker for this file
        const onProgress = (fileProgress: number) => {
          setProgress((prev) => {
            const updated = { ...prev, [fileName]: fileProgress };

            // Calculate overall progress
            const total = Object.values(updated).reduce((sum, p) => sum + p, 0);
            const avg = total / files.length;
            setOverallProgress(Math.round(avg));

            return updated;
          });
        };

        // Upload based on file type
        const response = isImage
          ? await mediaService.uploadImage(file, onProgress)
          : await mediaService.uploadVideo(file, onProgress);

        if (!response.success || !response.data) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        console.log(`✅ Uploaded ${file.name}:`, response.data.id);
        return response.data.id;
      });

      // Wait for all uploads to complete
      const mediaIds = await Promise.all(uploadPromises);

      console.log('✅ All files uploaded successfully:', mediaIds);
      toast.success(TOAST_MESSAGES.MEDIA.UPLOAD_SUCCESS);

      return mediaIds;
    } catch (error) {
      console.error('❌ Upload multiple media error:', error);
      toast.error(TOAST_MESSAGES.MEDIA.UPLOAD_ERROR);
      throw error;
    } finally {
      setIsUploading(false);
      setProgress({});
      setOverallProgress(0);
    }
  };

  return {
    uploadMultiple,
    isUploading,
    progress,
    overallProgress,
  };
}
