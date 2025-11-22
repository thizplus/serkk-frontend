import pLimit from 'p-limit';
import {
  requestPresignedURL,
  requestBatchPresignedURLs,
  uploadToR2,
  confirmUpload,
  confirmBatchUpload
} from '@/lib/api/r2-upload.service';
import type { UploadProgress, UploadOptions, UploadResult } from './types';
import { FORM_LIMITS } from '@/config';
import { extractMediaMetadata } from './extractMetadata';

/**
 * Upload หลายไฟล์พร้อมกัน (concurrent) ด้วย p-limit + Batch API
 *
 * ✅ ใช้ Batch Presigned URL API → เร็วกว่า 25×
 * ✅ รองรับ 1-200 ไฟล์
 * ✅ Upload concurrent ไป R2 (5 files ต่อครั้ง)
 *
 * @param files - Array of File objects to upload (max 200)
 * @param options - Upload options (concurrency, callbacks)
 * @returns UploadResult with all upload statuses
 *
 * @example
 * ```typescript
 * const result = await uploadMultipleFiles(files, {
 *   concurrency: 5,
 *   onProgress: (progress) => {
 *     console.log(`File ${progress.fileIndex}: ${progress.progress}%`);
 *   },
 * });
 * ```
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    concurrency = FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS,
    onProgress,
    onComplete,
    onError
  } = options;

  // Track progress for all files
  const progressMap: Map<number, UploadProgress> = new Map();

  // ✅ Track individual file progress (0-100 for each file)
  const fileProgressMap: Map<number, number> = new Map();

  // Initialize progress for all files
  files.forEach((file, index) => {
    const initialProgress: UploadProgress = {
      fileIndex: index,
      fileName: file.name,
      progress: 0,
      status: 'pending',
    };
    progressMap.set(index, initialProgress);
    fileProgressMap.set(index, 0); // Individual file progress
  });

  // ✅ Helper function to calculate overall progress from all files
  const calculateOverallProgress = (): number => {
    let totalProgress = 0;
    fileProgressMap.forEach(progress => {
      totalProgress += progress;
    });
    return Math.round(totalProgress / files.length);
  };

  // ⏱️ Track total upload time
  const totalStartTime = Date.now();

  try {
    // ============================================================================
    // STEP 1: Get Batch Presigned URLs (1 API call for all files)
    // ============================================================================
    // ⚡ เร็วกว่า 25× เมื่อเทียบกับ single API!
    const step1Start = Date.now();
    const batchPresignedData = await requestBatchPresignedURLs(files);
    const step1Duration = ((Date.now() - step1Start) / 1000).toFixed(2);
    console.log(`⏱️ STEP 1 (Presigned URLs): ${step1Duration}s for ${files.length} files`);

    // 🔍 Debug: Show batch response from backend
    console.log('\n📦 Batch Presigned Response from Backend:', {
      total: batchPresignedData.total,
      uploadsCount: batchPresignedData.uploads.length,
      firstUpload: batchPresignedData.uploads[0],
      fullResponse: batchPresignedData,
    });

    // ============================================================================
    // STEP 2: Upload files to R2 concurrently (p-limit)
    // ============================================================================
    const limit = pLimit(concurrency);

    // Track successful uploads for batch confirm
    const successfulUploads: Array<{
      mediaId: string;
      fileKey: string;
      fileSize: number;
      contentType: string;
      width?: number;
      height?: number;
      duration?: number;
      index: number;
    }> = [];

    const uploadTasks = files.map((file, index) =>
      limit(async () => {
        const fileUploadStart = Date.now();
        try {
          // Update status: uploading
          const uploadingProgress = {
            ...progressMap.get(index)!,
            status: 'uploading' as const,
            progress: calculateOverallProgress(),
          };
          progressMap.set(index, uploadingProgress);
          onProgress?.(uploadingProgress);

          const presignedData = batchPresignedData.uploads[index];

          // 🔍 Debug: Show presigned data from backend
          console.log(`\n📦 Presigned Data [${index + 1}/${files.length}]:`, {
            mediaId: presignedData.mediaId,
            fileUrl: presignedData.fileUrl,
            fileKey: presignedData.fileKey,
            uploadUrl: presignedData.uploadUrl.substring(0, 50) + '...',
            expiresAt: presignedData.expiresAt,
            fullData: presignedData, // ✅ Show complete object
          });

          // Upload to R2 with progress tracking
          await uploadToR2(
            presignedData.uploadUrl,
            file,
            (fileProgress) => {
              // ✅ Update individual file progress
              fileProgressMap.set(index, fileProgress);

              // ✅ Calculate overall progress from all files
              const overallProgress = calculateOverallProgress();

              const updatedProgress = {
                ...progressMap.get(index)!,
                progress: overallProgress,
              };
              progressMap.set(index, updatedProgress);
              onProgress?.(updatedProgress);
            }
          );

          // ⏱️ Log individual file upload time
          const fileUploadDuration = ((Date.now() - fileUploadStart) / 1000).toFixed(2);
          const speedMBps = (file.size / 1024 / 1024 / parseFloat(fileUploadDuration)).toFixed(2);
          console.log(
            `✅ Upload success [${index + 1}/${files.length}]: ${file.name} | ` +
            `Size: ${(file.size / 1024 / 1024).toFixed(2)}MB | ` +
            `Time: ${fileUploadDuration}s | ` +
            `Speed: ${speedMBps} MB/s`
          );

          // ✅ Extract metadata from image/video files
          const metadataStartTime = Date.now();
          const metadata = await extractMediaMetadata(file);
          const metadataTime = ((Date.now() - metadataStartTime) / 1000).toFixed(3);

          // 🔍 Debug: Show extracted metadata
          console.log(`\n📊 Extracted Metadata [${index + 1}/${files.length}] (${metadataTime}s):`, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            mediaId: presignedData.mediaId,
            fileUrl: presignedData.fileUrl,
            fileKey: presignedData.fileKey,
            // ✅ Extracted metadata:
            width: metadata.width || 'N/A',
            height: metadata.height || 'N/A',
            duration: metadata.duration ? `${metadata.duration.toFixed(2)}s` : 'N/A',
          });

          // ✅ Mark this file as 100% complete
          fileProgressMap.set(index, 100);

          // ✅ เก็บข้อมูลสำหรับ batch confirm (พร้อม metadata)
          successfulUploads.push({
            mediaId: presignedData.mediaId,
            fileKey: presignedData.fileKey,
            fileSize: file.size,
            contentType: file.type,
            width: metadata.width,
            height: metadata.height,
            duration: metadata.duration,
            index,
          });

          // Update status: completed (but not confirmed yet)
          const completedProgress: UploadProgress = {
            ...progressMap.get(index)!,
            status: 'completed',
            progress: calculateOverallProgress(),
            mediaId: presignedData.mediaId,
            url: presignedData.fileUrl,
          };
          progressMap.set(index, completedProgress);
          onProgress?.(completedProgress);

          return completedProgress;
        } catch (error) {
          // ⏱️ Log failed upload time
          const fileUploadDuration = ((Date.now() - fileUploadStart) / 1000).toFixed(2);
          console.error(
            `❌ Upload failed [${index + 1}/${files.length}]: ${file.name} | ` +
            `Time: ${fileUploadDuration}s | ` +
            `Error:`, error
          );

          // ✅ Mark failed file as 100% (failed)
          fileProgressMap.set(index, 100);

          // Update status: failed
          const failedProgress: UploadProgress = {
            ...progressMap.get(index)!,
            status: 'failed',
            progress: calculateOverallProgress(),
            error: error instanceof Error ? error.message : 'Upload failed',
          };
          progressMap.set(index, failedProgress);
          onProgress?.(failedProgress);
          onError?.(error instanceof Error ? error : new Error('Upload failed'), index);

          return failedProgress;
        }
      })
    );

    // Wait for all uploads
    const step2Start = Date.now();
    const results = await Promise.allSettled(uploadTasks);
    const step2Duration = ((Date.now() - step2Start) / 1000).toFixed(2);
    console.log(`⏱️ STEP 2 (Upload to R2): ${step2Duration}s total for ${files.length} files`);

    // Extract results
    const finalResults: UploadProgress[] = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return progressMap.get(index)!;
      }
    });

    // ============================================================================
    // STEP 3: Batch Confirm Uploads (1 API call for all successful files)
    // ============================================================================
    // ⚡ เร็วกว่า 200× เมื่อเทียบกับ single confirm!
    if (successfulUploads.length > 0) {
      try {
        const step3Start = Date.now();

        // 🔍 Debug: Show what metadata we're sending to backend
        console.log('\n📤 Sending metadata to backend (confirmBatchUpload):', {
          totalFiles: successfulUploads.length,
          sampleFile: successfulUploads[0],
          allUploads: successfulUploads.map(u => ({
            fileName: files[u.index].name,
            width: u.width,
            height: u.height,
            duration: u.duration,
          })),
        });

        await confirmBatchUpload(
          successfulUploads.map(upload => ({
            mediaId: upload.mediaId,
            fileKey: upload.fileKey,
            fileSize: upload.fileSize,
            contentType: upload.contentType,
            width: upload.width,      // ✅ Send metadata to backend
            height: upload.height,    // ✅ Send metadata to backend
            duration: upload.duration, // ✅ Send metadata to backend
          }))
        );
        const step3Duration = ((Date.now() - step3Start) / 1000).toFixed(2);
        console.log(`⏱️ STEP 3 (Confirm Upload): ${step3Duration}s for ${successfulUploads.length} files`);
      } catch (error) {
        console.error('❌ Batch confirm failed:', error);
        // Mark all as failed if confirm failed
        successfulUploads.forEach(({ index }) => {
          const failedProgress: UploadProgress = {
            ...progressMap.get(index)!,
            status: 'failed',
            error: 'Failed to confirm upload',
          };
          finalResults[index] = failedProgress;
        });
      }
    }

    // Call onComplete callback
    onComplete?.(finalResults);

    // Calculate success/failed counts
    const successCount = finalResults.filter(r => r.status === 'completed').length;
    const failedCount = finalResults.filter(r => r.status === 'failed').length;

    // ⏱️ Log summary
    const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(2);
    const totalSizeMB = files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024;
    const avgSpeedMBps = (totalSizeMB / parseFloat(totalDuration)).toFixed(2);
    console.log(
      `\n📊 UPLOAD SUMMARY:\n` +
      `   Files: ${successCount}/${files.length} successful\n` +
      `   Total Size: ${totalSizeMB.toFixed(2)}MB\n` +
      `   Total Time: ${totalDuration}s\n` +
      `   Avg Speed: ${avgSpeedMBps} MB/s\n` +
      `   Concurrency: ${concurrency} files at a time\n`
    );

    return {
      success: successCount > 0,
      results: finalResults,
      successCount,
      failedCount,
    };

  } catch (error) {
    // ❌ Batch presigned URL request failed
    // Mark all files as failed
    const allFailed: UploadProgress[] = files.map((file, index) => ({
      fileIndex: index,
      fileName: file.name,
      progress: 0,
      status: 'failed' as const,
      error: error instanceof Error ? error.message : 'Failed to get presigned URLs',
    }));

    onComplete?.(allFailed);

    return {
      success: false,
      results: allFailed,
      successCount: 0,
      failedCount: files.length,
    };
  }
}

/**
 * Calculate overall upload progress from individual file progresses
 */
export function calculateOverallProgress(progresses: UploadProgress[]): number {
  if (progresses.length === 0) return 0;

  const totalProgress = progresses.reduce((sum, p) => sum + p.progress, 0);
  return Math.round(totalProgress / progresses.length);
}
