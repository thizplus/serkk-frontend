// ============================================================================
// Media Service
// จัดการการเรียก API ที่เกี่ยวกับ Media Upload และการจัดการไฟล์สื่อ
// Updated: ใช้ Cloudflare R2 Direct Upload (Presigned URL)
// ============================================================================

import apiService from '@/shared/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type { GetUserMediaParams } from '@/shared/types/request';
import type {
  UploadImageResponse,
  UploadVideoResponse,
  UploadFileResponse,
  GetMediaResponse,
  GetUserMediaResponse,
  DeleteMediaResponse,
} from '@/shared/types/response';
import {
  uploadFileToR2,
  validateFile as r2ValidateFile,
  detectMediaType,
  requestPresignedURL,
  uploadToR2,
  confirmUpload,
} from '@/shared/lib/api/r2-upload.service';
import type { UploadAdditionalData } from '@/shared/types/upload';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * ขนาดไฟล์สูงสุดที่อนุญาต (ในหน่วย bytes)
 * Updated: เพิ่มขีดจำกัดตามความสามารถของ R2
 */
const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20 MB (เดิม 10 MB)
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB (เดิม 300 MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB (เดิม 50 MB)

/**
 * ประเภทไฟล์ที่อนุญาต
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'text/plain',
  'text/csv',
];

// ============================================================================
// TYPES
// ============================================================================

/**
 * Upload progress callback type
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Media validation error
 */
export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * ตรวจสอบความถูกต้องของไฟล์รูปภาพ
 */
const validateImageFile = (file: File): void => {
  if (!file) {
    throw new MediaValidationError('กรุณาเลือกไฟล์รูปภาพ');
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new MediaValidationError(
      `ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ ${ALLOWED_IMAGE_TYPES.join(', ')}`
    );
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new MediaValidationError(
      `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${MAX_IMAGE_SIZE / 1024 / 1024} MB)`
    );
  }
};

/**
 * ตรวจสอบความถูกต้องของไฟล์วิดีโอ
 */
const validateVideoFile = (file: File): void => {
  if (!file) {
    throw new MediaValidationError('กรุณาเลือกไฟล์วิดีโอ');
  }

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new MediaValidationError(
      `ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ ${ALLOWED_VIDEO_TYPES.join(', ')}`
    );
  }

  if (file.size > MAX_VIDEO_SIZE) {
    throw new MediaValidationError(
      `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${MAX_VIDEO_SIZE / 1024 / 1024} MB)`
    );
  }
};

/**
 * ตรวจสอบความถูกต้องของไฟล์เอกสาร
 */
const validateDocumentFile = (file: File): void => {
  if (!file) {
    throw new MediaValidationError('กรุณาเลือกไฟล์');
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new MediaValidationError(
      `ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP, RAR, TXT, CSV`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new MediaValidationError(
      `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024} MB)`
    );
  }
};

// ============================================================================
// MEDIA SERVICE
// ============================================================================

/**
 * Media Service
 * จัดการการเรียก API ที่เกี่ยวกับการอัพโหลดและจัดการไฟล์สื่อ (รูปภาพ, วิดีโอ)
 * Updated: ใช้ R2 Direct Upload แทน FormData POST
 */
const mediaService = {
  /**
   * อัพโหลดรูปภาพ (ใช้ R2 Direct Upload)
   * @param file - ไฟล์รูปภาพที่ต้องการอัพโหลด
   * @param onProgress - Callback function สำหรับติดตามความคืบหน้า
   * @param additionalData - ข้อมูลเพิ่มเติม (sourceType, sourceId, etc.)
   * @returns Promise<UploadImageResponse>
   * @throws {MediaValidationError} เมื่อไฟล์ไม่ผ่านการตรวจสอบ
   */
  uploadImage: async (
    file: File,
    onProgress?: UploadProgressCallback,
    additionalData?: UploadAdditionalData
  ): Promise<UploadImageResponse> => {
    try {
      // ตรวจสอบความถูกต้องของไฟล์
      validateImageFile(file);

      // Step 1: Get presigned URL (10%)
      onProgress?.(10);
      const presignedData = await requestPresignedURL(file);

      // Step 2: Upload to R2 (10-90%)
      await uploadToR2(presignedData.uploadUrl, file, (progress) => {
        // Map 0-100% to 10-90%
        onProgress?.(10 + (progress * 0.8));
      });

      // Step 3: Confirm upload (90-100%)
      onProgress?.(95);
      await confirmUpload(
        presignedData.mediaId,
        presignedData.fileKey,
        file.size,
        additionalData
      );

      onProgress?.(100);

      // Return response with mediaId from backend
      return {
        id: presignedData.mediaId, // ✅ ใช้ mediaId จาก backend
        url: presignedData.fileUrl,
        mediaType: 'image',
        createdAt: new Date().toISOString(),
      } as UploadImageResponse;
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof MediaValidationError) {
        throw error;
      }

      // Handle API errors
      if (error instanceof Error) {
        throw new Error(`การอัพโหลดรูปภาพล้มเหลว: ${error.message}`);
      }

      throw new Error('การอัพโหลดรูปภาพล้มเหลว');
    }
  },

  /**
   * อัพโหลดวิดีโอ (ใช้ R2 Direct Upload)
   * @param file - ไฟล์วิดีโอที่ต้องการอัพโหลด
   * @param onProgress - Callback function สำหรับติดตามความคืบหน้าการอัพโหลด
   * @param additionalData - ข้อมูลเพิ่มเติม (sourceType, sourceId, width, height, duration, etc.)
   * @returns Promise<UploadVideoResponse>
   * @throws {MediaValidationError} เมื่อไฟล์ไม่ผ่านการตรวจสอบ
   * @note R2 Direct Upload: วิดีโอเล่นได้ทันทีหลังอัพโหลดสำเร็จ (MP4 progressive download)
   */
  uploadVideo: async (
    file: File,
    onProgress?: UploadProgressCallback,
    additionalData?: UploadAdditionalData
  ): Promise<UploadVideoResponse> => {
    try {
      // ตรวจสอบความถูกต้องของไฟล์
      validateVideoFile(file);

      // Step 1: Get presigned URL (10%)
      onProgress?.(10);
      const presignedData = await requestPresignedURL(file);

      // Step 2: Upload to R2 (10-90%)
      await uploadToR2(presignedData.uploadUrl, file, (progress) => {
        // Map 0-100% to 10-90%
        onProgress?.(10 + (progress * 0.8));
      });

      // Step 3: Confirm upload (90-100%)
      onProgress?.(95);
      await confirmUpload(
        presignedData.mediaId,
        presignedData.fileKey,
        file.size,
        additionalData
      );

      onProgress?.(100);

      // Return response with mediaId from backend (no encoding needed - plays immediately)
      return {
        id: presignedData.mediaId, // ✅ ใช้ mediaId จาก backend
        url: presignedData.fileUrl,
        mediaType: 'video',
        createdAt: new Date().toISOString(),
        // No encoding fields needed - video plays immediately
      } as UploadVideoResponse;
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof MediaValidationError) {
        throw error;
      }

      // Handle API errors
      if (error instanceof Error) {
        throw new Error(`การอัพโหลดวิดีโอล้มเหลว: ${error.message}`);
      }

      throw new Error('การอัพโหลดวิดีโอล้มเหลว');
    }
  },

  /**
   * อัพโหลดไฟล์เอกสาร (ใช้ R2 Direct Upload)
   * @param file - ไฟล์เอกสารที่ต้องการอัพโหลด (PDF, DOC, XLS, ZIP, etc.)
   * @param onProgress - Callback function สำหรับติดตามความคืบหน้า
   * @param additionalData - ข้อมูลเพิ่มเติม (sourceType, sourceId, etc.)
   * @returns Promise<UploadFileResponse>
   * @throws {MediaValidationError} เมื่อไฟล์ไม่ผ่านการตรวจสอบ
   */
  uploadFile: async (
    file: File,
    onProgress?: UploadProgressCallback,
    additionalData?: UploadAdditionalData
  ): Promise<UploadFileResponse> => {
    try {
      // ตรวจสอบความถูกต้องของไฟล์
      validateDocumentFile(file);

      // Step 1: Get presigned URL (10%)
      onProgress?.(10);
      const presignedData = await requestPresignedURL(file);

      // Step 2: Upload to R2 (10-90%)
      await uploadToR2(presignedData.uploadUrl, file, (progress) => {
        // Map 0-100% to 10-90%
        onProgress?.(10 + (progress * 0.8));
      });

      // Step 3: Confirm upload (90-100%)
      onProgress?.(95);
      await confirmUpload(
        presignedData.mediaId,
        presignedData.fileKey,
        file.size,
        additionalData
      );

      onProgress?.(100);

      // Return response with mediaId from backend
      return {
        id: presignedData.mediaId, // ✅ ใช้ mediaId จาก backend
        url: presignedData.fileUrl,
        mediaType: 'file',
        filename: file.name,
        size: file.size,
        createdAt: new Date().toISOString(),
      } as UploadFileResponse;
    } catch (error) {
      // Re-throw validation errors
      if (error instanceof MediaValidationError) {
        throw error;
      }

      // Handle API errors
      if (error instanceof Error) {
        throw new Error(`การอัพโหลดไฟล์ล้มเหลว: ${error.message}`);
      }

      throw new Error('การอัพโหลดไฟล์ล้มเหลว');
    }
  },

  /**
   * ดึงข้อมูลสื่อตาม ID
   * @param id - ID ของสื่อ
   * @returns Promise<GetMediaResponse>
   */
  getById: async (id: string): Promise<GetMediaResponse> => {
    try {
      return await apiService.get<GetMediaResponse>(API.MEDIA.GET_BY_ID(id));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงข้อมูลสื่อได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงข้อมูลสื่อได้');
    }
  },

  /**
   * ดึงสื่อทั้งหมดของผู้ใช้
   * @param userId - ID ของผู้ใช้
   * @param params - พารามิเตอร์ (offset, limit, mediaType)
   * @returns Promise<GetUserMediaResponse>
   */
  getUserMedia: async (
    userId: string,
    params?: GetUserMediaParams
  ): Promise<GetUserMediaResponse> => {
    try {
      return await apiService.get<GetUserMediaResponse>(API.MEDIA.GET_BY_USER(userId), params);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถดึงข้อมูลสื่อของผู้ใช้ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถดึงข้อมูลสื่อของผู้ใช้ได้');
    }
  },

  /**
   * ลบสื่อ
   * @param id - ID ของสื่อที่ต้องการลบ
   * @returns Promise<DeleteMediaResponse>
   */
  delete: async (id: string): Promise<DeleteMediaResponse> => {
    try {
      return await apiService.delete<DeleteMediaResponse>(API.MEDIA.DELETE(id));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถลบสื่อได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถลบสื่อได้');
    }
  },

  /**
   * ตรวจสอบสถานะการ encode วิดีโอ
   * @deprecated ไม่จำเป็นอีกต่อไปเนื่องจากใช้ R2 Direct Upload (วิดีโอเล่นได้ทันที)
   * @param id - ID ของ media
   * @returns Promise<GetMediaResponse>
   */
  getEncodingStatus: async (id: string): Promise<GetMediaResponse> => {
    try {
      return await apiService.get<GetMediaResponse>(API.MEDIA.GET_ENCODING_STATUS(id));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`ไม่สามารถตรวจสอบสถานะการ encode ได้: ${error.message}`);
      }
      throw new Error('ไม่สามารถตรวจสอบสถานะการ encode ได้');
    }
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default mediaService;

/**
 * Export constants และ error class สำหรับใช้งานใน components
 */
export {
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  MAX_FILE_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_FILE_TYPES,
};
