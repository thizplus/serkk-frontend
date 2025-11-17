// ============================================================================
// Notification Service
// จัดการการเรียก API ที่เกี่ยวกับ Notifications (การแจ้งเตือน)
// ============================================================================

import apiService from '@/lib/api/http-client';
import { API } from '@/lib/constants/api';
import type {
  GetNotificationsParams,
  GetNotificationsCursorParams,
  UpdateNotificationSettingsRequest,
} from '@/types/request';
import type {
  GetNotificationsResponse,
  GetNotificationsCursorResponse,
  GetUnreadNotificationsResponse,
  GetUnreadNotificationsCursorResponse,
  GetNotificationUnreadCountResponse,
  GetNotificationResponse,
  MarkNotificationAsReadResponse,
  MarkAllAsReadResponse,
  DeleteNotificationResponse,
  DeleteAllNotificationsResponse,
  GetNotificationSettingsResponse,
  UpdateNotificationSettingsResponse,
} from '@/types/response';

/**
 * Notification Service
 * จัดการการเรียก API ที่เกี่ยวกับการแจ้งเตือนและการตั้งค่าการแจ้งเตือน
 */
const notificationService = {
  /**
   * ดึงการแจ้งเตือนทั้งหมด (Cursor-based)
   * @param params - พารามิเตอร์ (cursor, limit, type)
   * @returns Promise<GetNotificationsCursorResponse>
   */
  getAll: async (params?: GetNotificationsCursorParams): Promise<GetNotificationsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API.NOTIFICATION.LIST}?${queryString}` : API.NOTIFICATION.LIST;

    return apiService.get<GetNotificationsCursorResponse>(url);
  },

  /**
   * ดึงการแจ้งเตือนที่ยังไม่ได้อ่าน (Cursor-based)
   * @param params - พารามิเตอร์ (cursor, limit, type)
   * @returns Promise<GetUnreadNotificationsCursorResponse>
   */
  getUnread: async (
    params?: GetNotificationsCursorParams
  ): Promise<GetUnreadNotificationsCursorResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.cursor) queryParams.append('cursor', params.cursor);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = queryString ? `${API.NOTIFICATION.UNREAD}?${queryString}` : API.NOTIFICATION.UNREAD;

    return apiService.get<GetUnreadNotificationsCursorResponse>(url);
  },

  /**
   * ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
   * @returns Promise<GetNotificationUnreadCountResponse>
   */
  getUnreadCount: async (): Promise<GetNotificationUnreadCountResponse> => {
    return apiService.get<GetNotificationUnreadCountResponse>(API.NOTIFICATION.UNREAD_COUNT);
  },

  /**
   * ดึงข้อมูลการแจ้งเตือนตาม ID
   * @param id - ID ของการแจ้งเตือน
   * @returns Promise<GetNotificationResponse>
   */
  getById: async (id: string): Promise<GetNotificationResponse> => {
    return apiService.get<GetNotificationResponse>(API.NOTIFICATION.GET_BY_ID(id));
  },

  /**
   * ทำเครื่องหมายการแจ้งเตือนว่าอ่านแล้ว
   * @param id - ID ของการแจ้งเตือน
   * @returns Promise<MarkNotificationAsReadResponse>
   */
  markAsRead: async (id: string): Promise<MarkNotificationAsReadResponse> => {
    if (!id) {
      throw new Error('Notification ID is required');
    }
    console.log('📬 Mark as read ID:', id);
    return apiService.put<MarkNotificationAsReadResponse>(API.NOTIFICATION.MARK_READ(id));
  },

  /**
   * ทำเครื่องหมายการแจ้งเตือนทั้งหมดว่าอ่านแล้ว
   * @returns Promise<MarkAllAsReadResponse>
   */
  markAllAsRead: async (): Promise<MarkAllAsReadResponse> => {
    return apiService.put<MarkAllAsReadResponse>(API.NOTIFICATION.READ_ALL);
  },

  /**
   * ลบการแจ้งเตือน
   * @param id - ID ของการแจ้งเตือน
   * @returns Promise<DeleteNotificationResponse>
   */
  delete: async (id: string): Promise<DeleteNotificationResponse> => {
    if (!id) {
      throw new Error('Notification ID is required');
    }
    console.log('🗑️ Delete notification ID:', id);
    return apiService.delete<DeleteNotificationResponse>(API.NOTIFICATION.DELETE(id));
  },

  /**
   * ลบการแจ้งเตือนทั้งหมด
   * @returns Promise<DeleteAllNotificationsResponse>
   */
  deleteAll: async (): Promise<DeleteAllNotificationsResponse> => {
    return apiService.delete<DeleteAllNotificationsResponse>(API.NOTIFICATION.DELETE_ALL);
  },

  /**
   * ดึงการตั้งค่าการแจ้งเตือน
   * @returns Promise<GetNotificationSettingsResponse>
   */
  getSettings: async (): Promise<GetNotificationSettingsResponse> => {
    return apiService.get<GetNotificationSettingsResponse>(API.NOTIFICATION.SETTINGS);
  },

  /**
   * อัพเดทการตั้งค่าการแจ้งเตือน
   * @param data - ข้อมูลการตั้งค่า
   * @returns Promise<UpdateNotificationSettingsResponse>
   */
  updateSettings: async (
    data: UpdateNotificationSettingsRequest
  ): Promise<UpdateNotificationSettingsResponse> => {
    return apiService.put<UpdateNotificationSettingsResponse>(
      API.NOTIFICATION.SETTINGS,
      data
    );
  },
};

export default notificationService;
