// lib/config/toastMessages.ts
// Centralized toast messages for SUEKK
// ข้อความแจ้งเตือนทั้งหมดของระบบ

import { toast } from "sonner";

export const TOAST_MESSAGES = {
  // Authentication
  AUTH: {
    LOGIN_SUCCESS: 'เข้าสู่ระบบสำเร็จ!',
    LOGIN_ERROR: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
    LOGOUT_SUCCESS: 'ออกจากระบบสำเร็จ!',
    REGISTER_SUCCESS: 'สมัครสมาชิกสำเร็จ!',
    REGISTER_ERROR: 'ไม่สามารถสมัครสมาชิกได้',
    SESSION_EXPIRED: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่',
    UNAUTHORIZED: 'กรุณาเข้าสู่ระบบก่อนใช้งาน',
    FORBIDDEN: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้',
    REQUIRED_FIELDS: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    PASSWORD_TOO_SHORT: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร',
    PASSWORD_MISMATCH: 'รหัสผ่านไม่ตรงกัน',
  },

  // Posts
  POST: {
    CREATE_SUCCESS: 'สร้างโพสต์สำเร็จ!',
    CREATE_ERROR: 'ไม่สามารถสร้างโพสต์ได้',
    UPDATE_SUCCESS: 'อัปเดทโพสต์สำเร็จ!',
    UPDATE_ERROR: 'ไม่สามารถอัปเดทโพสต์ได้',
    DELETE_SUCCESS: 'ลบโพสต์สำเร็จ!',
    DELETE_ERROR: 'ไม่สามารถลบโพสต์ได้',
    DELETE_CONFIRM: 'คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?',
    LOAD_ERROR: 'ไม่สามารถโหลดโพสต์ได้',
    VOTE_ERROR: 'ไม่สามารถโหวตได้',
    VOTE_SUCCESS: 'โหวตสำเร็จ!',
    SAVE_SUCCESS: 'บันทึกโพสต์แล้ว',
    SAVE_ERROR: 'ไม่สามารถบันทึกโพสต์ได้',
    UNSAVE_SUCCESS: 'ยกเลิกการบันทึกแล้ว',
    UNSAVE_ERROR: 'ไม่สามารถยกเลิกการบันทึกได้',
    SHARE_SUCCESS: 'คัดลอกลิงก์แล้ว!',
    SHARE_ERROR: 'ไม่สามารถแชร์โพสต์ได้',
    CROSSPOST_SUCCESS: 'แชร์โพสต์สำเร็จ!',
    CROSSPOST_ERROR: 'ไม่สามารถแชร์โพสต์ได้',
  },

  // Chat
  CHAT: {
    LOAD_ERROR: 'ไม่สามารถโหลดรายการแชทได้',
    LOAD_CONVERSATION_ERROR: 'ไม่สามารถโหลดการสนทนาได้',
    LOAD_MESSAGES_ERROR: 'ไม่สามารถโหลดข้อความได้',
    SEND_SUCCESS: 'ส่งข้อความสำเร็จ',
    SEND_ERROR: 'ไม่สามารถส่งข้อความได้',
    EMPTY_MESSAGE: 'กรุณาพิมพ์ข้อความ',
    LOGIN_REQUIRED: 'กรุณาเข้าสู่ระบบก่อนใช้งานแชท',
    DELETE_SUCCESS: 'ลบข้อความสำเร็จ',
    DELETE_ERROR: 'ไม่สามารถลบข้อความได้',
    MARK_READ_ERROR: 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว',
    BLOCK_SUCCESS: 'บล็อกผู้ใช้สำเร็จ',
    BLOCK_ERROR: 'ไม่สามารถบล็อกผู้ใช้ได้',
    UNBLOCK_SUCCESS: 'ปลดบล็อกผู้ใช้สำเร็จ',
    UNBLOCK_ERROR: 'ไม่สามารถปลดบล็อกผู้ใช้ได้',
    CONNECTION_ERROR: 'เชื่อมต่อแชทไม่สำเร็จ',
    RECONNECTING: 'กำลังเชื่อมต่อใหม่...',
    CONNECTED: 'เชื่อมต่อสำเร็จ',
  },

  // Comments
  COMMENT: {
    CREATE_SUCCESS: 'แสดงความคิดเห็นสำเร็จ',
    CREATE_ERROR: 'ไม่สามารถแสดงความคิดเห็นได้',
    UPDATE_SUCCESS: 'แก้ไขความคิดเห็นสำเร็จ',
    UPDATE_ERROR: 'ไม่สามารถแก้ไขความคิดเห็นได้',
    DELETE_SUCCESS: 'ลบความคิดเห็นสำเร็จ',
    DELETE_ERROR: 'ไม่สามารถลบความคิดเห็นได้',
    DELETE_CONFIRM: 'คุณแน่ใจหรือไม่ที่จะลบความคิดเห็นนี้?',
    LOAD_ERROR: 'ไม่สามารถโหลดความคิดเห็นได้',
    VOTE_ERROR: 'ไม่สามารถโหวตความคิดเห็นได้',
  },

  // Profile
  PROFILE: {
    UPDATE_SUCCESS: 'อัปเดทโปรไฟล์สำเร็จ!',
    UPDATE_ERROR: 'ไม่สามารถอัปเดทโปรไฟล์ได้',
    LOAD_ERROR: 'ไม่สามารถโหลดโปรไฟล์ได้',
    FOLLOW_SUCCESS: 'ติดตามสำเร็จ',
    FOLLOW_ERROR: 'ไม่สามารถติดตามได้',
    UNFOLLOW_SUCCESS: 'เลิกติดตามสำเร็จ',
    UNFOLLOW_ERROR: 'ไม่สามารถเลิกติดตามได้',
    AVATAR_UPLOAD_SUCCESS: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
    AVATAR_UPLOAD_ERROR: 'ไม่สามารถอัปโหลดรูปโปรไฟล์ได้',
    COVER_UPLOAD_SUCCESS: 'อัปโหลดรูปปกสำเร็จ',
    COVER_UPLOAD_ERROR: 'ไม่สามารถอัปโหลดรูปปกได้',
    DISPLAYNAME_REQUIRED: 'กรุณากรอกชื่อที่แสดง',
    DISPLAYNAME_TOO_LONG: 'ชื่อที่แสดงต้องไม่เกิน 50 ตัวอักษร',
    BIO_TOO_LONG: 'แนะนำตัวต้องไม่เกิน 200 ตัวอักษร',
    LOCATION_TOO_LONG: 'ที่อยู่ต้องไม่เกิน 100 ตัวอักษร',
    INVALID_WEBSITE_URL: 'กรุณากรอก URL ที่ถูกต้อง เช่น https://example.com',
  },

  // Notifications
  NOTIFICATION: {
    LOAD_ERROR: 'ไม่สามารถโหลดการแจ้งเตือนได้',
    MARK_READ_SUCCESS: 'ทำเครื่องหมายว่าอ่านแล้ว',
    MARK_READ_ERROR: 'ไม่สามารถทำเครื่องหมายว่าอ่านแล้ว',
    MARK_ALL_READ_SUCCESS: 'ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว',
    MARK_ALL_READ_ERROR: 'ไม่สามารถทำเครื่องหมายทั้งหมดได้',
    DELETE_SUCCESS: 'ลบการแจ้งเตือนสำเร็จ',
    DELETE_ERROR: 'ไม่สามารถลบการแจ้งเตือนได้',
  },

  // Media Upload
  MEDIA: {
    UPLOAD_ERROR: 'ไม่สามารถอัปโหลดไฟล์ได้',
    UPLOAD_SUCCESS: 'อัปโหลดไฟล์สำเร็จ',
    DELETE_SUCCESS: 'ลบไฟล์สำเร็จ',
    DELETE_ERROR: 'ไม่สามารถลบไฟล์ได้',
    FILE_TOO_LARGE: 'ไฟล์มีขนาดใหญ่เกินไป',
    INVALID_FORMAT: 'รูปแบบไฟล์ไม่ถูกต้อง',
    TOO_MANY_FILES: 'เลือกไฟล์ได้มากเกินไป',
    MIXED_MEDIA_NOT_ALLOWED: 'ไม่สามารถส่งรูปภาพและวิดีโอพร้อมกันได้',
    ONE_VIDEO_ONLY: 'ส่งได้ทีละ 1 วิดีโอเท่านั้น',
    PROCESSING: 'กำลังประมวลผลไฟล์...',
  },

  // Search
  SEARCH: {
    NO_RESULTS: 'ไม่พบผลลัพธ์',
    ERROR: 'เกิดข้อผิดพลาดในการค้นหา',
    EMPTY_QUERY: 'กรุณากรอกคำค้นหา',
  },

  // Tags
  TAG: {
    CREATE_SUCCESS: 'สร้างแท็กสำเร็จ',
    CREATE_ERROR: 'ไม่สามารถสร้างแท็กได้',
    TOO_MANY: 'สามารถเพิ่มแท็กได้สูงสุด 5 แท็ก',
  },

  // General
  GENERAL: {
    NETWORK_ERROR: 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    UNKNOWN_ERROR: 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    COMING_SOON: 'ฟีเจอร์นี้กำลังพัฒนา',
    COPY_SUCCESS: 'คัดลอกแล้ว!',
    COPY_ERROR: 'ไม่สามารถคัดลอกได้',
    LOADING: 'กำลังโหลด...',
    SAVING: 'กำลังบันทึก...',
    DELETING: 'กำลังลบ...',
    SUCCESS: 'สำเร็จ!',
    ERROR: 'เกิดข้อผิดพลาด',
  },

  // PWA
  PWA: {
    UPDATE_AVAILABLE: 'มีเวอร์ชันใหม่พร้อมใช้งาน',
    UPDATE_SUCCESS: 'อัปเดทสำเร็จ!',
    UPDATE_ERROR: 'ไม่สามารถอัปเดทได้',
    INSTALL_PROMPT: 'ติดตั้ง SUEKK เป็นแอพบนอุปกรณ์ของคุณ',
    OFFLINE: 'คุณกำลังออฟไลน์',
    ONLINE: 'กลับมาออนไลน์แล้ว',
  },
} as const;

// Helper functions for showing toasts
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  loading: (message: string) => toast.loading(message),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages),
};
