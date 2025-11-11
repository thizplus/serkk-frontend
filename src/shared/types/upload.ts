// ============================================================================
// R2 Upload Types
// Types สำหรับ Cloudflare R2 Direct Upload (Presigned URL)
// ============================================================================

/**
 * Request: ขอ Presigned URL จาก Backend
 */
export interface PresignedUploadRequest {
  filename: string;
  contentType: string;
  fileSize: number;
  mediaType: 'image' | 'video' | 'file';
}

/**
 * Response: Presigned URL และข้อมูลที่เกี่ยวข้อง
 */
export interface PresignedUploadResponse {
  uploadUrl: string;    // URL สำหรับ upload (valid 15 นาที)
  fileUrl: string;      // URL สาธารณะของไฟล์
  fileKey: string;      // R2 object key
  mediaId: string;      // UUID สำหรับอ้างอิง
  expiresAt: string;    // ISO 8601 timestamp
}

/**
 * Request: Batch Presigned URLs (NEW - สำหรับ multiple files)
 * Max 200 files per request
 */
export interface BatchPresignedUploadRequest {
  files: PresignedUploadRequest[];
}

/**
 * Response: Batch Presigned URLs (NEW)
 */
export interface BatchPresignedUploadResponse {
  uploads: PresignedUploadResponse[];
  total: number;
}

/**
 * Request: ยืนยันการ upload (optional)
 */
export interface ConfirmUploadRequest {
  mediaId: string;
  fileKey: string;
  fileSize: number;
  sourceType?: string;  // "post" | "message" | "profile"
  sourceId?: string;    // UUID ของ post/message
  width?: number;       // สำหรับรูป/วิดีโอ
  height?: number;      // สำหรับรูป/วิดีโอ
  duration?: number;    // สำหรับวิดีโอ (วินาที)
  thumbnail?: string;   // Thumbnail URL
}

/**
 * Response: ยืนยันการ upload
 */
export interface ConfirmUploadResponse {
  success: boolean;
  mediaId: string;
  message: string;
}

/**
 * Request: Batch Confirm Uploads (NEW - สำหรับ multiple files)
 */
export interface BatchConfirmUploadRequest {
  uploads: ConfirmUploadRequest[];
}

/**
 * Result: Single file confirm result in batch
 */
export interface BatchConfirmResult {
  mediaId: string;
  fileUrl?: string;
  fileKey: string;
  success: boolean;
  error?: string;
}

/**
 * Response: Batch Confirm Uploads (NEW)
 * ✅ ตรงกับ backend spec
 */
export interface BatchConfirmUploadResponse {
  successful: BatchConfirmResult[];  // Files ที่ confirm สำเร็จ
  failed: BatchConfirmResult[];      // Files ที่ confirm ล้มเหลว
  total: number;                     // จำนวนไฟล์ทั้งหมด
  successCount: number;              // จำนวนที่สำเร็จ
  failCount: number;                 // จำนวนที่ล้มเหลว
}

/**
 * Error Response
 */
export interface UploadErrorResponse {
  error: string;
}

/**
 * File Validation Result
 */
export interface FileValidation {
  isValid: boolean;
  error?: string;
}

/**
 * Upload Progress Callback
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * Additional Data for Upload
 */
export interface UploadAdditionalData {
  sourceType?: string;
  sourceId?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
}
