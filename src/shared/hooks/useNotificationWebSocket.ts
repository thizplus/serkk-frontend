// ============================================================================
// Notification WebSocket Hook
// React hook สำหรับจัดการ Notification WebSocket connection และ real-time updates
// ============================================================================

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import notificationService from '@/lib/websocket/notification.service';
import { useAuthStore } from '@/features/auth';
import { useChatStore } from '@/features/chat/stores/chat';

/**
 * Helper function: อัพเดท media status ของ post
 */
function updatePostMediaStatus(
  post: any,
  mediaId: string,
  progress: number,
  status: string
): any {
  if (!post || !post.media || !Array.isArray(post.media)) {
    return post;
  }

  // ตรวจสอบว่า post มี media ที่ตรงกับ mediaId หรือไม่
  const hasMedia = post.media.some((m: any) => m.id === mediaId);
  if (!hasMedia) {
    return post;
  }

  // อัพเดท media status และ progress
  return {
    ...post,
    media: post.media.map((media: any) => {
      if (media.id === mediaId) {
        return {
          ...media,
          encodingProgress: progress,
          encodingStatus: status,
        };
      }
      return media;
    }),
  };
}

/**
 * Hook สำหรับจัดการ Notification WebSocket connection
 * - Connect เมื่อ user login
 * - Disconnect เฉพาะเมื่อ user logout (ไม่ disconnect เมื่อ navigate)
 * - อัพเดท React Query cache เมื่อได้รับ real-time updates
 *
 * Events:
 * - video.encoding.progress
 * - video.encoding.completed
 * - video.encoding.failed
 * - post.published
 */
export function useNotificationWebSocket() {
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    // ถ้าไม่มี token หรือไม่มี user → disconnect (user logout)
    if (!token || !user) {
      console.log('👋 User logged out, disconnecting Notification WebSocket...');
      notificationService.disconnect();
      isSubscribedRef.current = false;
      return;
    }

    // ถ้า connected อยู่แล้ว และ subscribed แล้ว → skip
    if (notificationService.isConnected() && isSubscribedRef.current) {
      console.log('🔌 Notification WebSocket already connected and subscribed, skipping...');
      return;
    }

    // Connect WebSocket (ถ้ายัง)
    if (!notificationService.isConnected()) {
      console.log('🔌 Initializing Notification WebSocket connection...');
      notificationService.connect(token);
    }

    // Subscribe to notification events (ไม่ต้อง subscribe ทุกครั้ง)
    if (!isSubscribedRef.current) {
      console.log('📡 Subscribing to Notification WebSocket events...');

      // Video Encoding Progress Event
      const unsubVideoProgress = notificationService.on('video.encoding.progress', (data) => {
        console.log('🎬 Video encoding progress:', data);

        const { mediaId, progress, status } = data;

        // อัพเดท React Query cache สำหรับทุก query ที่มี post นี้
        queryClient.setQueriesData(
          { queryKey: ['posts'] },
          (oldData: any) => {
            if (!oldData) return oldData;

            // Handle infinite query structure
            if (oldData.pages) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  posts: page.posts?.map((post: any) =>
                    updatePostMediaStatus(post, mediaId, progress, status)
                  ) || page.posts,
                })),
              };
            }

            // Handle regular query structure (array of posts)
            if (Array.isArray(oldData)) {
              return oldData.map((post: any) =>
                updatePostMediaStatus(post, mediaId, progress, status)
              );
            }

            // Handle single post
            return updatePostMediaStatus(oldData, mediaId, progress, status);
          }
        );

        // 🔥 อัพเดท chat messages ที่มี video ด้วย
        const chatStore = useChatStore.getState();
        const messagesByConversation = chatStore.messagesByConversation;

        Object.keys(messagesByConversation).forEach((conversationId) => {
          const { messages } = messagesByConversation[conversationId];

          messages.forEach((message) => {
            if (!message.media || !Array.isArray(message.media)) return;

            const hasMatchingMedia = message.media.some(
              (m: any) => m.mediaId === mediaId || m.id === mediaId
            );

            if (hasMatchingMedia) {
              chatStore.updateMessageMedia(conversationId, message.id, {
                mediaId,
                encodingProgress: progress,
                encodingStatus: status,
              });
            }
          });
        });
      });

      // Video Encoding Completed Event
      const unsubVideoCompleted = notificationService.on('video.encoding.completed', (data) => {
        console.log('✅ Video encoding completed:', data);

        const { mediaId, hlsUrl, url, width, height, duration } = data;

        // อัพเดท React Query cache สำหรับ posts
        queryClient.setQueriesData(
          { queryKey: ['posts'] },
          (oldData: any) => {
            if (!oldData) return oldData;

            const updateMedia = (post: any) => {
              if (!post || !post.media || !Array.isArray(post.media)) {
                return post;
              }

              const hasMedia = post.media.some((m: any) => m.id === mediaId);
              if (!hasMedia) return post;

              return {
                ...post,
                media: post.media.map((media: any) => {
                  if (media.id === mediaId) {
                    return {
                      ...media,
                      encodingProgress: 100,
                      encodingStatus: 'completed',
                      hlsUrl: hlsUrl || media.hlsUrl,
                      url: url || media.url,
                      width: width || media.width,
                      height: height || media.height,
                      duration: duration || media.duration,
                    };
                  }
                  return media;
                }),
              };
            };

            // Handle different query structures
            if (oldData.pages) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  posts: page.posts?.map(updateMedia) || page.posts,
                })),
              };
            }

            if (Array.isArray(oldData)) {
              return oldData.map(updateMedia);
            }

            return updateMedia(oldData);
          }
        );

        // 🔥 อัพเดท chat messages ที่มี video ด้วย
        const chatStore = useChatStore.getState();
        const messagesByConversation = chatStore.messagesByConversation;

        // วนหาทุก conversations และ messages ที่มี media ที่ match
        Object.keys(messagesByConversation).forEach((conversationId) => {
          const { messages } = messagesByConversation[conversationId];

          messages.forEach((message) => {
            if (!message.media || !Array.isArray(message.media)) return;

            // เช็คว่า message นี้มี media ที่ match กับ mediaId หรือไม่
            const hasMatchingMedia = message.media.some(
              (m: any) => m.mediaId === mediaId || m.id === mediaId
            );

            if (hasMatchingMedia) {
              console.log(`🎬 Updating chat message ${message.id} in conversation ${conversationId}`);

              // Update message media
              chatStore.updateMessageMedia(conversationId, message.id, {
                mediaId,
                encodingProgress: 100,
                encodingStatus: 'completed',
                hlsUrl: hlsUrl || undefined,
                url: url || undefined,
                width: width || undefined,
                height: height || undefined,
                duration: duration || undefined,
              });
            }
          });
        });
      });

      // Video Encoding Failed Event
      const unsubVideoFailed = notificationService.on('video.encoding.failed', (data) => {
        console.error('❌ Video encoding failed:', data);

        const { mediaId } = data;

        // อัพเดท React Query cache สำหรับ posts
        queryClient.setQueriesData(
          { queryKey: ['posts'] },
          (oldData: any) => {
            if (!oldData) return oldData;

            const updateMedia = (post: any) => {
              if (!post || !post.media || !Array.isArray(post.media)) {
                return post;
              }

              const hasMedia = post.media.some((m: any) => m.id === mediaId);
              if (!hasMedia) return post;

              return {
                ...post,
                media: post.media.map((media: any) => {
                  if (media.id === mediaId) {
                    return {
                      ...media,
                      encodingStatus: 'failed',
                    };
                  }
                  return media;
                }),
              };
            };

            // Handle different query structures
            if (oldData.pages) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  posts: page.posts?.map(updateMedia) || page.posts,
                })),
              };
            }

            if (Array.isArray(oldData)) {
              return oldData.map(updateMedia);
            }

            return updateMedia(oldData);
          }
        );

        // 🔥 อัพเดท chat messages ที่มี video ด้วย
        const chatStore = useChatStore.getState();
        const messagesByConversation = chatStore.messagesByConversation;

        Object.keys(messagesByConversation).forEach((conversationId) => {
          const { messages } = messagesByConversation[conversationId];

          messages.forEach((message) => {
            if (!message.media || !Array.isArray(message.media)) return;

            const hasMatchingMedia = message.media.some(
              (m: any) => m.mediaId === mediaId || m.id === mediaId
            );

            if (hasMatchingMedia) {
              console.log(`❌ Updating chat message ${message.id} - video encoding failed`);

              chatStore.updateMessageMedia(conversationId, message.id, {
                mediaId,
                encodingStatus: 'failed',
              });
            }
          });
        });
      });

      // Post Published Event
      const unsubPostPublished = notificationService.on('post.published', (data) => {
        console.log('📝 Post auto-published:', data);

        // Invalidate posts queries เพื่อ refresh UI
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      });

      // Mark as subscribed
      isSubscribedRef.current = true;

      // Cleanup: unsubscribe เมื่อ logout (เข้า if block ด้านบน)
      return () => {
        console.log('🧹 Cleaning up Notification WebSocket subscriptions...');
        unsubVideoProgress();
        unsubVideoCompleted();
        unsubVideoFailed();
        unsubPostPublished();
        isSubscribedRef.current = false;
      };
    }

    // Cleanup: ไม่ disconnect เมื่อ component unmount (เพื่อป้องกันกระพริบเมื่อ navigate)
    // จะ disconnect เฉพาะเมื่อ logout (เข้า if block ด้านบน)
    return () => {
      console.log('🧹 useNotificationWebSocket cleanup (keeping connection alive)...');
      // Don't disconnect on navigation
      // Only disconnect when user logs out (handled in the if block above)
    };
  }, [token, user, queryClient]);

  return {
    isConnected: notificationService.isConnected(),
  };
}
