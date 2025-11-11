// lib/config/validation.ts
// Validation rules and messages for SUEKK
// กฎการตรวจสอบข้อมูลและข้อความแจ้งเตือน

import { FORM_LIMITS } from './constants';

// Validation Rules
export const VALIDATION_RULES = {
  POST: {
    TITLE: {
      required: true,
      minLength: FORM_LIMITS.POST.TITLE_MIN,
      maxLength: FORM_LIMITS.POST.TITLE_MAX,
    },
    CONTENT: {
      required: false,
      maxLength: FORM_LIMITS.POST.CONTENT_MAX,
    },
    TAGS: {
      maxCount: FORM_LIMITS.POST.TAGS_MAX,
    },
  },
  COMMENT: {
    CONTENT: {
      required: true,
      minLength: FORM_LIMITS.COMMENT.CONTENT_MIN,
      maxLength: FORM_LIMITS.COMMENT.CONTENT_MAX,
    },
  },
  USER: {
    USERNAME: {
      required: true,
      minLength: FORM_LIMITS.USER.USERNAME_MIN,
      maxLength: FORM_LIMITS.USER.USERNAME_MAX,
      pattern: /^[a-zA-Z0-9_]+$/,
    },
    EMAIL: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    PASSWORD: {
      required: true,
      minLength: FORM_LIMITS.USER.PASSWORD_MIN,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    },
    DISPLAY_NAME: {
      required: false,
      maxLength: FORM_LIMITS.USER.DISPLAY_NAME_MAX,
    },
    BIO: {
      required: false,
      maxLength: FORM_LIMITS.USER.BIO_MAX,
    },
  },
  CHAT: {
    MESSAGE: {
      required: true,
      maxLength: FORM_LIMITS.CHAT.MESSAGE_MAX,
    },
  },
  MEDIA: {
    FILES: {
      maxCount: FORM_LIMITS.MEDIA.MAX_FILES,
      maxSize: FORM_LIMITS.MEDIA.MAX_SIZE_BYTES,
    },
  },
} as const;

// Validation Messages
export const VALIDATION_MESSAGES = {
  // General
  REQUIRED: 'กรุณากรอกข้อมูล',
  INVALID: 'ข้อมูลไม่ถูกต้อง',

  // Email
  EMAIL_REQUIRED: 'กรุณากรอกอีเมล',
  EMAIL_INVALID: 'อีเมลไม่ถูกต้อง',

  // Password
  PASSWORD_REQUIRED: 'กรุณากรอกรหัสผ่าน',
  PASSWORD_TOO_SHORT: `รหัสผ่านต้องมีอย่างน้อย ${FORM_LIMITS.USER.PASSWORD_MIN} ตัวอักษร`,
  PASSWORD_WEAK: 'รหัสผ่านต้องมีตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข',
  PASSWORD_MISMATCH: 'รหัสผ่านไม่ตรงกัน',

  // Username
  USERNAME_REQUIRED: 'กรุณากรอกชื่อผู้ใช้',
  USERNAME_TOO_SHORT: `ชื่อผู้ใช้ต้องมีอย่างน้อย ${FORM_LIMITS.USER.USERNAME_MIN} ตัวอักษร`,
  USERNAME_TOO_LONG: `ชื่อผู้ใช้ต้องไม่เกิน ${FORM_LIMITS.USER.USERNAME_MAX} ตัวอักษร`,
  USERNAME_INVALID: 'ชื่อผู้ใช้ต้องเป็นตัวอักษร ตัวเลข และ _ เท่านั้น',
  USERNAME_TAKEN: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว',

  // Post
  POST_TITLE_REQUIRED: 'กรุณากรอกหัวข้อ',
  POST_TITLE_TOO_LONG: `หัวข้อต้องไม่เกิน ${FORM_LIMITS.POST.TITLE_MAX} ตัวอักษร`,
  POST_CONTENT_TOO_LONG: `เนื้อหาต้องไม่เกิน ${FORM_LIMITS.POST.CONTENT_MAX} ตัวอักษร`,
  POST_TAGS_TOO_MANY: `เพิ่มแท็กได้สูงสุด ${FORM_LIMITS.POST.TAGS_MAX} แท็ก`,

  // Comment
  COMMENT_REQUIRED: 'กรุณากรอกความคิดเห็น',
  COMMENT_TOO_LONG: `ความคิดเห็นต้องไม่เกิน ${FORM_LIMITS.COMMENT.CONTENT_MAX} ตัวอักษร`,

  // Chat
  MESSAGE_REQUIRED: 'กรุณากรอกข้อความ',
  MESSAGE_TOO_LONG: `ข้อความต้องไม่เกิน ${FORM_LIMITS.CHAT.MESSAGE_MAX} ตัวอักษร`,

  // Media
  FILE_TOO_LARGE: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${FORM_LIMITS.MEDIA.MAX_SIZE_MB}MB)`,
  TOO_MANY_FILES: `เลือกไฟล์ได้สูงสุด ${FORM_LIMITS.MEDIA.MAX_FILES} ไฟล์`,
  INVALID_FILE_TYPE: 'ประเภทไฟล์ไม่ถูกต้อง',

  // URL
  URL_INVALID: 'กรุณากรอก URL ที่ถูกต้อง',
  URL_REQUIRED: 'กรุณากรอก URL',

  // Display Name
  DISPLAY_NAME_TOO_LONG: `ชื่อแสดงต้องไม่เกิน ${FORM_LIMITS.USER.DISPLAY_NAME_MAX} ตัวอักษร`,

  // Bio
  BIO_TOO_LONG: `ประวัติส่วนตัวต้องไม่เกิน ${FORM_LIMITS.USER.BIO_MAX} ตัวอักษร`,
} as const;

// Validator Helper Functions
export const validators = {
  // Email validator
  isValidEmail: (email: string): boolean => {
    return VALIDATION_RULES.USER.EMAIL.pattern.test(email);
  },

  // URL validator
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Username validator
  isValidUsername: (username: string): boolean => {
    return (
      VALIDATION_RULES.USER.USERNAME.pattern.test(username) &&
      username.length >= VALIDATION_RULES.USER.USERNAME.minLength &&
      username.length <= VALIDATION_RULES.USER.USERNAME.maxLength
    );
  },

  // Password validator
  isStrongPassword: (password: string): boolean => {
    return (
      password.length >= VALIDATION_RULES.USER.PASSWORD.minLength &&
      VALIDATION_RULES.USER.PASSWORD.pattern.test(password)
    );
  },

  // File size validator
  isValidFileSize: (size: number): boolean => {
    return size <= VALIDATION_RULES.MEDIA.FILES.maxSize;
  },

  // File count validator
  isValidFileCount: (count: number): boolean => {
    return count <= VALIDATION_RULES.MEDIA.FILES.maxCount;
  },

  // Text length validator
  isValidLength: (
    text: string,
    min?: number,
    max?: number
  ): { valid: boolean; error?: string } => {
    if (min && text.length < min) {
      return { valid: false, error: `ต้องมีอย่างน้อย ${min} ตัวอักษร` };
    }
    if (max && text.length > max) {
      return { valid: false, error: `ต้องไม่เกิน ${max} ตัวอักษร` };
    }
    return { valid: true };
  },
};

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  DOCUMENT: ['application/pdf', 'text/plain'],
} as const;

// File type validator
export const isAllowedFileType = (
  file: File,
  allowedTypes: readonly string[]
): boolean => {
  return allowedTypes.includes(file.type);
};
