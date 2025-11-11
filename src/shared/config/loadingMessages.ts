// lib/config/loadingMessages.ts
// Centralized loading messages for SUEKK
// ข้อความแสดงสถานะ Loading ทั้งหมดของระบบ

export const LOADING_MESSAGES = {
  // Profile
  PROFILE: {
    LOADING: 'กำลังโหลดโปรไฟล์...',
    UPDATING: 'กำลังอัปเดทโปรไฟล์...',
    LOADING_FOLLOWERS: 'กำลังโหลดรายชื่อผู้ติดตาม...',
    LOADING_FOLLOWING: 'กำลังโหลดรายชื่อผู้ที่ติดตาม...',
  },

  // Posts
  POST: {
    LOADING: 'กำลังโหลดโพสต์...',
    CREATING: 'กำลังสร้างโพสต์...',
    UPDATING: 'กำลังอัปเดทโพสต์...',
    DELETING: 'กำลังลบโพสต์...',
    LOADING_DETAILS: 'กำลังโหลดรายละเอียดโพสต์...',
  },

  // Comments
  COMMENT: {
    LOADING: 'กำลังโหลดคอมเมนต์...',
    CREATING: 'กำลังเพิ่มความคิดเห็น...',
    UPDATING: 'กำลังแก้ไขความคิดเห็น...',
    DELETING: 'กำลังลบความคิดเห็น...',
  },

  // Chat
  CHAT: {
    LOADING: 'กำลังโหลดการสนทนา...',
    LOADING_MESSAGES: 'กำลังโหลดข้อความ...',
    SENDING: 'กำลังส่งข้อความ...',
    CONNECTING: 'กำลังเชื่อมต่อ...',
  },

  // Notifications
  NOTIFICATION: {
    LOADING: 'กำลังโหลดการแจ้งเตือน...',
    MARKING_READ: 'กำลังทำเครื่องหมายว่าอ่านแล้ว...',
  },

  // Saved
  SAVED: {
    LOADING: 'กำลังโหลดโพสต์ที่บันทึก...',
    SAVING: 'กำลังบันทึกโพสต์...',
    REMOVING: 'กำลังยกเลิกการบันทึก...',
  },

  // Search
  SEARCH: {
    LOADING: 'กำลังค้นหา...',
    LOADING_RESULTS: 'กำลังโหลดผลการค้นหา...',
  },

  // Media
  MEDIA: {
    UPLOADING: 'กำลังอัปโหลด...',
    PROCESSING: 'กำลังประมวลผล...',
    DELETING: 'กำลังลบไฟล์...',
  },

  // Authentication
  AUTH: {
    LOGGING_IN: 'กำลังเข้าสู่ระบบ...',
    REGISTERING: 'กำลังสมัครสมาชิก...',
    LOGGING_OUT: 'กำลังออกจากระบบ...',
  },

  // General
  GENERAL: {
    LOADING: 'กำลังโหลด...',
    SAVING: 'กำลังบันทึก...',
    DELETING: 'กำลังลบ...',
    PROCESSING: 'กำลังประมวลผล...',
    PLEASE_WAIT: 'กรุณารอสักครู่...',
  },
} as const;
