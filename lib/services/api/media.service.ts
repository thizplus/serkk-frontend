// ============================================================================
// Media Service
// จัดการการเรียก API ที่เกี่ยวกับ Media Upload และการจัดการไฟล์สื่อ
// ============================================================================

import apiService from '../http-client';
import { API } from '@/lib/constants/api';
import type { GetUserMediaParams } from '@/lib/types/request';
import type {
  UploadImageResponse,
  UploadVideoResponse,
  GetMediaResponse,
  GetUserMediaResponse,
  DeleteMediaResponse,
} from '@/lib/types/response';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * ขนาดไฟล์สูงสุดที่อนุญาต (ในหน่วย bytes)
 */
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 300 * 1024 * 1024; // 300 MB

/**
 * ประเภทไฟล์ที่อนุญาต
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];

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

// ============================================================================
// MEDIA SERVICE
// ============================================================================

/**
 * Media Service
 * จัดการการเรียก API ที่เกี่ยวกับการอัพโหลดและจัดการไฟล์สื่อ (รูปภาพ, วิดีโอ)
 */
const mediaService = {
  /**
   * อัพโหลดรูปภาพ
   * @param file - ไฟล์รูปภาพที่ต้องการอัพโหลด
   * @param onProgress - Callback function สำหรับติดตามความคืบหน้า
   * @returns Promise<UploadImageResponse>
   * @throws {MediaValidationError} เมื่อไฟล์ไม่ผ่านการตรวจสอบ
   */
  uploadImage: async (
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<UploadImageResponse> => {
    try {
      // ตรวจสอบความถูกต้องของไฟล์
      validateImageFile(file);

      const formData = new FormData();
      formData.append('image', file);

      return await apiService.upload<UploadImageResponse>(
        API.MEDIA.UPLOAD_IMAGE,
        formData,
        onProgress
      );
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
   * อัพโหลดวิดีโอ
   * @param file - ไฟล์วิดีโอที่ต้องการอัพโหลด
   * @param onProgress - Callback function สำหรับติดตามความคืบหน้า
   * @returns Promise<UploadVideoResponse>
   * @throws {MediaValidationError} เมื่อไฟล์ไม่ผ่านการตรวจสอบ
   */
  uploadVideo: async (
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<UploadVideoResponse> => {
    try {
      // ตรวจสอบความถูกต้องของไฟล์
      validateVideoFile(file);

      const formData = new FormData();
      formData.append('video', file);

      return await apiService.upload<UploadVideoResponse>(
        API.MEDIA.UPLOAD_VIDEO,
        formData,
        onProgress
      );
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
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
};
