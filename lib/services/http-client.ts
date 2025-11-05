// ============================================================================
// HTTP Client (API Service)
// Axios instance with interceptors for authentication and error handling
// ============================================================================

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/lib/constants/api';

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

/**
 * สร้าง axios instance สำหรับเรียกใช้ API
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// ============================================================================
// TOKEN MANAGEMENT
// TODO: Migrate to Zustand store for better state management
// ============================================================================

const TOKEN_KEY = 'auth_token';

/**
 * ดึง token จาก localStorage
 */
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * บันทึก token ลง localStorage
 */
export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * ลบ token จาก localStorage
 */
export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Interceptor สำหรับเพิ่ม token ใน header ทุกครั้งที่มีการเรียก API
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 API Request:', config.method?.toUpperCase(), config.url);
    }

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Authorization header added');
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Interceptor สำหรับจัดการ response และ error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ API Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    // Log error สำหรับ debugging
    console.error('❌ API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
    });

    // ถ้าเป็น error 401 (Unauthorized)
    if (error.response?.status === 401) {
      // ล้างข้อมูล auth
      clearToken();

      // ล้าง cookie
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_token=; path=/; max-age=0';
      }

      // redirect ไปหน้า login เฉพาะเมื่อไม่ได้อยู่หน้า auth อยู่แล้ว
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = ['/login', '/register', '/auth/callback'].includes(currentPath);

        if (!isAuthPage) {
          window.location.href = '/login';
        }
      }
    }

    // จัดการ error response จาก backend
    if (error.response?.data) {
      const errorData = error.response.data;

      // สร้าง enhanced error object ที่มี backend error message
      const enhancedError = {
        ...errorData,
        status: error.response.status,
        statusText: error.response.statusText,
        originalError: error,
      };

      return Promise.reject(enhancedError);
    }

    // ถ้าไม่มี response data (เช่น network error)
    return Promise.reject({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่าย',
      error: error.message,
      status: 0,
      originalError: error,
    });
  }
);

// ============================================================================
// API SERVICE
// ============================================================================

/**
 * Service สำหรับเรียกใช้ API
 */
const apiService = {
  /**
   * ส่งคำขอ GET
   * @param url - URL ปลายทาง
   * @param params - พารามิเตอร์สำหรับ query string
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  get: async <T>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, { params, ...config });
    return response.data;
  },

  /**
   * ส่งคำขอ POST
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },

  /**
   * ส่งคำขอ PUT
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },

  /**
   * ส่งคำขอ PUT พร้อม FormData (สำหรับการอัพโหลดไฟล์)
   * @param url - URL ปลายทาง
   * @param formData - FormData ที่มีข้อมูลและไฟล์
   */
  putFormData: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await apiClient.put<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * ส่งคำขอ PATCH
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },

  /**
   * ส่งคำขอ PATCH พร้อม FormData (สำหรับการอัพโหลดไฟล์)
   * @param url - URL ปลายทาง
   * @param formData - FormData ที่มีข้อมูลและไฟล์
   */
  patchFormData: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await apiClient.patch<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * ส่งคำขอ DELETE
   * @param url - URL ปลายทาง
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },

  /**
   * ส่งคำขอ DELETE พร้อม data ใน request body
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  deleteWithData: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, { data, ...config });
    return response.data;
  },

  /**
   * ส่งคำขอแบบกำหนดเองได้เต็มรูปแบบ
   * @param config - ค่า config สำหรับ axios request
   */
  request: async <T>(config: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.request<T>(config);
    return response.data;
  },

  /**
   * ส่งคำขอ POST พร้อม FormData (สำหรับการอัพโหลดไฟล์)
   * @param url - URL ปลายทาง
   * @param formData - FormData ที่มีข้อมูลและไฟล์
   */
  postFile: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * ส่งคำขอ Upload ไฟล์
   * @param url - URL ปลายทาง
   * @param formData - FormData ที่มีไฟล์ที่จะอัปโหลด
   * @param onProgress - callback สำหรับติดตามความคืบหน้าในการอัปโหลด
   */
  upload: async <T>(
    url: string,
    formData: FormData,
    onProgress?: (percentage: number) => void
  ): Promise<T> => {
    const response = await apiClient.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });
    return response.data;
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default apiService;

// Export axios instance for advanced usage (if needed)
export { apiClient };
