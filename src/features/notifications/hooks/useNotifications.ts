"use client";

// ============================================================================
// Notification Queries & Mutations
// React Query hooks สำหรับ Notifications และ Settings
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import notificationService from '../services/notification.service';
import type { UpdateNotificationSettingsRequest } from '@/shared/types/request';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
};

// ============================================================================
// QUERY: GET NOTIFICATION SETTINGS
// ============================================================================

/**
 * Hook สำหรับดึง notification settings ของ user
 */
export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings(),
    queryFn: async () => {
      const response = await notificationService.getSettings();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notification settings');
      }
      return response.data;
    },
  });
}

// ============================================================================
// MUTATION: UPDATE NOTIFICATION SETTINGS
// ============================================================================

/**
 * Hook สำหรับอัพเดท notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNotificationSettingsRequest) => {
      const response = await notificationService.updateSettings(data);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update notification settings');
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Update settings in cache
      queryClient.setQueryData(notificationKeys.settings(), data);

      toast.success('อัพเดทการตั้งค่าสำเร็จ!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถอัพเดทการตั้งค่าได้'
      );
    },
  });
}

// ============================================================================
// QUERY: GET UNREAD COUNT
// ============================================================================

/**
 * Hook สำหรับดึงจำนวน notifications ที่ยังไม่อ่าน
 */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await notificationService.getUnreadCount();
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch unread count');
      }
      return response.data.count;
    },
    refetchInterval: 30000, // Refetch ทุก 30 วินาที
    retry: 1, // Retry เพียง 1 ครั้ง
    staleTime: 10000, // ข้อมูลใหม่ทุก 10 วินาที
  });
}

// ============================================================================
// QUERY: GET NOTIFICATIONS LIST
// ============================================================================

/**
 * Hook สำหรับดึงรายการ notifications
 */
export function useNotifications(params?: { offset?: number; limit?: number }) {
  return useQuery({
    queryKey: [...notificationKeys.lists(), params],
    queryFn: async () => {
      const response = await notificationService.getAll(params);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
      return response.data;
    },
  });
}

// ============================================================================
// MUTATION: MARK ALL AS READ
// ============================================================================

/**
 * Hook สำหรับทำเครื่องหมายอ่านทั้งหมด
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await notificationService.markAllAsRead();
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark all as read');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      toast.success('ทำเครื่องหมายอ่านทั้งหมดแล้ว');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถทำเครื่องหมายอ่านได้'
      );
    },
  });
}

// ============================================================================
// MUTATION: MARK SINGLE AS READ
// ============================================================================

/**
 * Hook สำหรับทำเครื่องหมายอ่าน notification เดียว
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationService.markAsRead(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to mark as read');
      }
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถทำเครื่องหมายอ่านได้'
      );
    },
  });
}

// ============================================================================
// MUTATION: DELETE NOTIFICATION
// ============================================================================

/**
 * Hook สำหรับลบ notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await notificationService.delete(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete notification');
      }
      return id;
    },
    onSuccess: () => {
      // Invalidate all notification queries
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      toast.success('ลบการแจ้งเตือนแล้ว');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'ไม่สามารถลบการแจ้งเตือนได้'
      );
    },
  });
}
