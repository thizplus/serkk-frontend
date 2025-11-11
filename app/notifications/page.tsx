"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, ThumbsUp, AtSign, UserPlus, Check, Trash2, Loader2, Settings } from "@/config/icons";
import { PAGINATION } from "@/config";
import { EmptyState } from "@/components/common";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import Link from "next/link";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "@/features/notifications";
import type { NotificationType } from "@/types/common";
import type { Notification } from "@/types/models";
import { LoadingState } from "@/components/common/LoadingState";
import { LOADING_MESSAGES } from "@/config";

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch notifications from API
  const { data, isLoading, error } = useNotifications({ limit: PAGINATION.MESSAGE_LIMIT });

  // Handle both response formats (with meta or total)
  const notifications = data?.notifications || [];
  const totalCount = data?.meta?.total || 0;

  // Debug response in development
  if (process.env.NODE_ENV === 'development' && data) {
    console.log('📬 Notifications Response:', data);
    console.log('📊 Total Count:', totalCount);
    console.log('📝 First Notification:', notifications[0]);
  }

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = activeTab === "all"
    ? notifications
    : notifications.filter(n => !n.isRead);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'reply':
        return <MessageSquare size={20} className="text-muted-foreground" />;
      case 'vote':
        return <ThumbsUp size={20} className="text-muted-foreground" />;
      case 'mention':
        return <AtSign size={20} className="text-muted-foreground" />;
      case 'follow':
        return <UserPlus size={20} className="text-muted-foreground" />;
      default:
        return <Bell size={20} className="text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Generate link based on notification type and data
    let targetLink = notification.link;

    if (!targetLink) {
      // Build link from notification data
      if (notification.postId) {
        targetLink = `/post/${notification.postId}`;
        // If there's a comment ID, add it as a hash/query
        if (notification.commentId) {
          targetLink += `#comment-${notification.commentId}`;
        }
      } else if (notification.type === 'follow' && notification.sender?.username) {
        targetLink = `/profile/${notification.sender.username}`;
      }
    }

    // Navigate to the link
    if (targetLink) {
      router.push(targetLink);
    } else {
      console.warn('⚠️ Cannot determine link for notification:', notification);
    }
  };

  const handleMarkAsReadClick = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Debug
    console.log('🔔 Marking as read, ID:', notificationId, 'Type:', typeof notificationId);

    if (!notificationId) {
      console.error('❌ Notification ID is undefined!');
      return;
    }

    markAsRead.mutate(notificationId);
  };

  const handleMarkAllAsReadClick = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Debug
    console.log('🗑️ Deleting notification, ID:', notificationId, 'Type:', typeof notificationId);

    if (!notificationId) {
      console.error('❌ Notification ID is undefined!');
      return;
    }

    deleteNotification.mutate(notificationId);
  };

  // Loading state
  if (isLoading) {
    return (
      <AppLayout breadcrumbs={[{ label: "การแจ้งเตือน" }]}>
        <Card>
          <CardContent>
            <LoadingState message={LOADING_MESSAGES.NOTIFICATION.LOADING} />
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : 'ไม่สามารถโหลดการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง';

    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "การแจ้งเตือน" },
        ]}
      >
        <Card>
          <CardContent className="text-center py-12 sm:py-16 px-4">
            <Bell className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
              {errorMessage}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => window.location.reload()}>
                <Loader2 className="mr-2 h-4 w-4" />
                ลองอีกครั้ง
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                กลับหน้าหลัก
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: "การแจ้งเตือน" },
      ]}
    >
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-4">
          {/* Title */}
          <div className="flex items-center gap-3 justify-between">
            <div className="flex gap-2">
              <div className="p-2 bg-primary/10 rounded-lg m-auto">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">การแจ้งเตือน</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {unreadCount > 0
                    ? `คุณมีการแจ้งเตือนใหม่ ${unreadCount} รายการ`
                    : 'ไม่มีการแจ้งเตือนใหม่'
                  }
                </p>
              </div>
            </div>

            {/* Settings Button */}
            <Link href="/notifications/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline whitespace-nowrap">ตั้งค่า</span>
              </Button>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Mark All as Read */}
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsReadClick}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                <span className="whitespace-nowrap">อ่านทั้งหมด</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">
              ทั้งหมด ({notifications.length})
            </TabsTrigger>
            <TabsTrigger value="unread">
              ยังไม่อ่าน ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredNotifications.length > 0 ? (
              <div className="space-y-2">
                {filteredNotifications.map((notification) => {
                  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: th
                  });

                  return (
                    <Card
                      key={notification.id}
                      className={`cursor-pointer py-0 transition-all hover:shadow-md hover:border-accent ${
                        !notification.isRead ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Avatar & Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-2">
                              {/* Support 'sender', 'actor', and 'user' fields */}
                              {(notification.sender || notification.actor || notification.user) && (
                                <Image
                                  src={(notification.sender?.avatar || notification.actor?.avatar || notification.user?.avatar) || "/icon-white.svg"}
                                  alt={(notification.sender?.displayName || notification.actor?.displayName || notification.user?.displayName) || "User"}
                                  width={40}
                                  height={40}
                                  className="rounded-full shrink-0 border-2 border-background shadow-sm max-h-10 object-cover "
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                {/* Message with Actor Name */}
                                <p className="text-sm text-foreground/90 mb-2">
                                  {(notification.sender || notification.actor || notification.user) && (
                                    <span className="font-semibold">
                                      {notification.sender?.displayName || notification.actor?.displayName || notification.user?.displayName}
                                    </span>
                                  )}
                                  {(notification.sender || notification.actor || notification.user) && ' '}
                                  {notification.message}
                                </p>

                                {/* Title (if exists) */}
                                {notification.title && (
                                  <p className="text-sm font-medium text-primary mb-1">
                                    {notification.title}
                                  </p>
                                )}

                                {/* Time & Status */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                  <span>{timeAgo}</span>
                                  <span>•</span>
                                  {notification.isRead ? (
                                    <span>อ่านแล้ว</span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-primary font-medium">
                                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                                      ยังไม่ได้อ่าน
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-start gap-1 shrink-0">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => handleMarkAsReadClick(notification.id, e)}
                                className="p-2 hover:bg-accent rounded-lg transition-colors"
                                title="ทำเครื่องหมายว่าอ่านแล้ว"
                                disabled={markAsRead.isPending}
                              >
                                {markAsRead.isPending ? (
                                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                                ) : (
                                  <Check size={16} className="text-muted-foreground hover:text-foreground" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDelete(notification.id, e)}
                              className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                              title="ลบ"
                              disabled={deleteNotification.isPending}
                            >
                              {deleteNotification.isPending ? (
                                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                              ) : (
                                <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
                              )}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon="Bell"
                title={activeTab === "unread" ? "ไม่มีการแจ้งเตือนใหม่" : "ไม่มีการแจ้งเตือน"}
                description={
                  activeTab === "unread"
                    ? "คุณได้อ่านการแจ้งเตือนทั้งหมดแล้ว"
                    : "เมื่อมีคนโต้ตอบกับคุณ คุณจะเห็นการแจ้งเตือนที่นี่"
                }
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
