// ============================================================================
// HTTP Client (Dual API Service for Microservices)
// Axios instances for Auth Service and Backend Service
// ============================================================================

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { AUTH_BASE_URL, BACKEND_BASE_URL } from '@/lib/constants/api';
import { useAuthStore } from '@/features/auth';

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const TOKEN_KEY = 'auth_token';

/**
 * ดึง token จาก Zustand store (primary) หรือ localStorage (fallback)
 */
const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;

  // Try Zustand store first
  const zustandToken = useAuthStore.getState().token;
  if (zustandToken) return zustandToken;

  // Fallback to localStorage
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
// AUTH SERVICE CLIENT (Port 8088)
// ============================================================================

/**
 * Axios instance สำหรับ Auth Service
 * จัดการ: Authentication, User Management
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor - เพิ่ม Authorization token
authClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 [Auth Service] Request:', config.method?.toUpperCase(), config.url);
      if (!token) {
        console.warn('⚠️ [Auth Service] NO TOKEN - Request will be unauthenticated');
      }
    }

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ [Auth Service] Request error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - จัดการ response และ error
authClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [Auth Service] Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    console.error('❌ [Auth Service] Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';

      // Public endpoints ที่ไม่ควร redirect
      const publicEndpoints = ['/users/profile'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => requestUrl.includes(endpoint));

      if (!isPublicEndpoint) {
        clearToken();

        if (typeof window !== 'undefined') {
          document.cookie = 'auth_token=; path=/; max-age=0';

          const currentPath = window.location.pathname;
          const isAuthPage = ['/login', '/register', '/auth/callback'].includes(currentPath);

          if (!isAuthPage) {
            window.location.href = '/login';
          }
        }
      }
    }

    // Return error data
    if (error.response?.data) {
      return Promise.reject({
        ...error.response.data,
        status: error.response.status,
        originalError: error,
      });
    }

    return Promise.reject({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Auth Service',
      error: error.message,
      status: 0,
      originalError: error,
    });
  }
);

// ============================================================================
// BACKEND SERVICE CLIENT (Port 8080)
// ============================================================================

/**
 * Axios instance สำหรับ Backend Service
 * จัดการ: Posts, Comments, Follows, Media, Tags, Search, Chat, Notifications
 */
export const backendClient: AxiosInstance = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor - เพิ่ม Authorization token
backendClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 [Backend Service] Request:', config.method?.toUpperCase(), config.url);
      if (!token) {
        console.warn('⚠️ [Backend Service] NO TOKEN - Request will be unauthenticated');
      }
    }

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ [Backend Service] Request error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor - จัดการ response และ error
backendClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [Backend Service] Response:', response.config.url, response.status);
    }
    return response;
  },
  async (error) => {
    console.error('❌ [Backend Service] Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';

      // Public pages
      const publicPages = ['/', '/post', '/tag', '/profile', '/search'];
      const isPublicPage = typeof window !== 'undefined' && publicPages.some(page =>
        window.location.pathname === page || window.location.pathname.startsWith(page + '/')
      );

      if (!isPublicPage) {
        clearToken();

        if (typeof window !== 'undefined') {
          document.cookie = 'auth_token=; path=/; max-age=0';

          const currentPath = window.location.pathname;
          const isAuthPage = ['/login', '/register', '/auth/callback'].includes(currentPath);

          if (!isAuthPage) {
            window.location.href = '/login';
          }
        }
      }
    }

    // Return error data
    if (error.response?.data) {
      return Promise.reject({
        ...error.response.data,
        status: error.response.status,
        originalError: error,
      });
    }

    return Promise.reject({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Backend Service',
      error: error.message,
      status: 0,
      originalError: error,
    });
  }
);

// ============================================================================
// API SERVICE WRAPPERS
// ============================================================================

/**
 * Auth Service API Wrapper
 * ใช้สำหรับ Authentication และ User Management
 */
export const authService = {
  get: async <T>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await authClient.get<T>(url, { params, ...config });
    return response.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await authClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await authClient.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await authClient.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await authClient.delete<T>(url, config);
    return response.data;
  },

  putFormData: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await authClient.put<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

/**
 * Backend Service API Wrapper
 * ใช้สำหรับ Posts, Comments, Follows, Media, Tags, Search, etc.
 */
const apiService = {
  get: async <T>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.get<T>(url, { params, ...config });
    return response.data;
  },

  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.post<T>(url, data, config);
    return response.data;
  },

  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.put<T>(url, data, config);
    return response.data;
  },

  putFormData: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await backendClient.put<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.patch<T>(url, data, config);
    return response.data;
  },

  patchFormData: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await backendClient.patch<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.delete<T>(url, config);
    return response.data;
  },

  deleteWithData: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.delete<T>(url, { data, ...config });
    return response.data;
  },

  request: async <T>(config: AxiosRequestConfig): Promise<T> => {
    const response = await backendClient.request<T>(config);
    return response.data;
  },

  postFile: async <T>(url: string, formData: FormData): Promise<T> => {
    const response = await backendClient.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  upload: async <T>(
    url: string,
    formData: FormData,
    onProgress?: (percentage: number) => void
  ): Promise<T> => {
    const response = await backendClient.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
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

// Default export (Backend Service) - for backward compatibility
export default apiService;

// Named exports
export { apiService };

// Export axios instances for advanced usage
export { authClient as apiClient };
