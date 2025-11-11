// ============================================================================
// Authentication Service
// จัดการการเรียก API ที่เกี่ยวกับ Authentication
// ============================================================================

import apiService, { setToken, clearToken } from '@/shared/lib/api/http-client';
import { API } from '@/shared/lib/constants/api';
import type { LoginRequest, RegisterRequest } from '@/shared/types/request';
import type {
  LoginResponse,
  RegisterResponse,
  GoogleOAuthUrlResponse,
  GoogleOAuthCallbackResponse,
} from '@/shared/types/response';

/**
 * Authentication Service
 * จัดการการเรียก API ที่เกี่ยวกับ Authentication
 */
const authService = {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   * @param data - ข้อมูลสำหรับการลงทะเบียน (email, username, password, displayName)
   * @returns Promise<RegisterResponse>
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiService.post<RegisterResponse>(API.AUTH.REGISTER, data);
  },

  /**
   * เข้าสู่ระบบ
   * @param data - ข้อมูล email และ password
   * @returns Promise<LoginResponse>
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiService.post<LoginResponse>(API.AUTH.LOGIN, data);

    // บันทึก token หลังจาก login สำเร็จ
    if (response.success && response.data?.token) {
      setToken(response.data.token);
    }

    return response;
  },

  /**
   * ออกจากระบบ
   * ลบ token และ redirect ไปหน้า login
   */
  logout: (): void => {
    clearToken();

    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  /**
   * ดึง URL สำหรับ Google OAuth
   * @returns Promise<GoogleOAuthUrlResponse>
   */
  getGoogleOAuthUrl: async (): Promise<GoogleOAuthUrlResponse> => {
    return apiService.get<GoogleOAuthUrlResponse>(API.AUTH.GOOGLE);
  },

  /**
   * จัดการ callback จาก Google OAuth
   * แลก OUR_CODE (ที่ได้จาก backend) เป็น token
   * @param code - OUR_CODE จาก backend (ไม่ใช่ GOOGLE_CODE)
   * @param state - State parameter สำหรับ CSRF protection
   * @returns Promise<GoogleOAuthCallbackResponse>
   */
  handleGoogleOAuthCallback: async (
    code: string,
    state: string
  ): Promise<GoogleOAuthCallbackResponse> => {
    // ⭐ ใช้ POST /auth/exchange แทน GET /auth/google/callback
    const response = await apiService.post<GoogleOAuthCallbackResponse>(
      API.AUTH.EXCHANGE,
      { code, state }
    );

    // บันทึก token หลังจาก OAuth สำเร็จ
    if (response.success && response.data?.token) {
      setToken(response.data.token);
    }

    return response;
  },

  /**
   * ตรวจสอบว่าผู้ใช้ login อยู่หรือไม่
   * @returns boolean
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('auth_token');
    return !!token;
  },
};

export default authService;
