"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";
import { MessageSquare, Loader2 } from "@/shared/config/icons";
import { useChatStore } from "../stores/chat";
import ScrollToBottom from "react-scroll-to-bottom";
import type { ChatUser, ChatMessage as ChatMessageType } from "@/shared/lib/data/mockChats";
import type { ChatUser as RealChatUser, ChatMessage as RealChatMessage } from "@/shared/types/models";

interface SelectedFile {
  file: File;
  preview: string;
  type: "image" | "video" | "file";
}

interface ChatWindowProps {
  otherUser: ChatUser | RealChatUser;
  messages: (ChatMessageType | RealChatMessage)[];
  currentUserId: string;
  onSendMessage: (message: string, files?: SelectedFile[]) => void;
  onBlock?: () => void;
  showBackButton?: boolean;
  hideHeader?: boolean;
  isLoading?: boolean;
  isSending?: boolean;
  conversationId?: string;
}

export function ChatWindow({
  otherUser,
  messages,
  currentUserId,
  onSendMessage,
  onBlock,
  showBackButton = false,
  hideHeader = false,
  isLoading = false,
  isSending = false,
  conversationId,
}: ChatWindowProps) {
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const previousScrollHeightRef = useRef<number>(0);
  const isRestoringScrollRef = useRef(false);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);

  // ✅ Get pagination state from store - แยก selector
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);
  
  // ✅ Subscribe to hasMore directly
  const hasMore = useChatStore((state) => 
    conversationId ? state.messagesByConversation[conversationId]?.hasMore ?? false : false
  );

  // Debug: Check store state
  useEffect(() => {
    if (conversationId) {
      const state = useChatStore.getState().messagesByConversation[conversationId];
      console.log('🗄️ [Store State]:', {
        conversationId,
        hasMore: state?.hasMore,
        hasMoreFromHook: hasMore,
        nextCursor: state?.nextCursor,
        messagesCount: messages.length,
        hasSentinel: !!topSentinelRef.current,
      });
    }
  }, [conversationId, messages.length, hasMore]);

  // Load more messages when user scrolls to top
  const handleLoadMore = useCallback(async () => {
    console.log('🔄 handleLoadMore called:', {
      conversationId,
      hasMore,
      isLoading: isLoadingMoreRef.current,
      messageCount: messages.length,
    });

    if (!conversationId || !hasMore || isLoadingMoreRef.current) {
      console.log('⏸️ Load more skipped:', {
        noConversationId: !conversationId,
        noMore: !hasMore,
        alreadyLoading: isLoadingMoreRef.current,
      });
      return;
    }

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) {
      console.warn('⚠️ No scroll container found');
      return;
    }

    try {
      setIsLoadingMore(true);
      isLoadingMoreRef.current = true;
      isRestoringScrollRef.current = true;

      // ✅ Save current scroll position BEFORE loading
      const previousScrollHeight = scrollContainer.scrollHeight;
      const previousScrollTop = scrollContainer.scrollTop;
      previousScrollHeightRef.current = previousScrollHeight;

      console.log('📏 Before load:', {
        scrollHeight: previousScrollHeight,
        scrollTop: previousScrollTop,
      });

      console.log('⏳ Loading more messages...');
      await loadMoreMessages(conversationId);

      // ✅ Wait for DOM to update
      await new Promise<void>((resolve) => setTimeout(resolve, 150));

      // ✅ Restore scroll position manually
      const newScrollHeight = scrollContainer.scrollHeight;
      const heightDifference = newScrollHeight - previousScrollHeight;
      const newScrollTop = previousScrollTop + heightDifference;

      console.log('📏 After load:', {
        newScrollHeight,
        heightDifference,
        newScrollTop,
      });

      scrollContainer.scrollTop = newScrollTop;
      
      console.log('✅ Load more completed, scroll restored');
    } catch (error) {
      console.error('❌ [LOAD MORE ERROR]', error);
    } finally {
      setTimeout(() => {
        isRestoringScrollRef.current = false;
      }, 200);
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, [conversationId, hasMore, loadMoreMessages, messages.length]); // ✅ เพิ่ม hasMore ใน deps

  // IntersectionObserver to detect when user scrolls to top
  useEffect(() => {
    if (!conversationId || !topSentinelRef.current || !hasMore) { // ✅ เพิ่มเช็ค hasMore
      console.log('⏸️ Observer setup skipped:', {
        noConversationId: !conversationId,
        noSentinel: !topSentinelRef.current,
        noMore: !hasMore
      });
      return;
    }

    let observer: IntersectionObserver | null = null;
    let scrollContainer: HTMLElement | null = null;

    const setup = (): void => {
      requestAnimationFrame(() => {
        if (!topSentinelRef.current) {
          return;
        }

        // Find the scroll container
        const findScrollContainer = (): HTMLElement | null => {
          let element = topSentinelRef.current?.parentElement;
          let depth = 0;
          
          while (element && depth < 10) {
            const style = window.getComputedStyle(element);
            const hasScroll = 
              style.overflow === 'auto' || 
              style.overflow === 'scroll' ||
              style.overflowY === 'auto' || 
              style.overflowY === 'scroll';
            
            if (hasScroll && element.scrollHeight > element.clientHeight) {
              return element;
            }
            
            element = element.parentElement;
            depth++;
          }
          return null;
        };

        scrollContainer = findScrollContainer();
        
        if (!scrollContainer) {
          console.warn('⚠️ ScrollToBottom container not found, retrying...');
          setTimeout(setup, 1000);
          return;
        }

        scrollContainerRef.current = scrollContainer;
        console.log('✅ Scroll container found');

        observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            
            console.log('👁️ Intersection event:', {
              isIntersecting: entry.isIntersecting,
              isRestoring: isRestoringScrollRef.current,
              hasMore,
              isLoading: isLoadingMoreRef.current,
            });

            // ✅ Ignore if we're restoring scroll
            if (isRestoringScrollRef.current) {
              return;
            }

            if (entry.isIntersecting && hasMore && !isLoadingMoreRef.current) {
              console.log('🔄 Triggering load more...');
              handleLoadMore();
            }
          },
          {
            root: scrollContainer,
            rootMargin: '100px 0px 0px 0px', // ✅ เพิ่ม margin
            threshold: 0.01, // ✅ ลด threshold
          }
        );

        if (topSentinelRef.current) {
          observer.observe(topSentinelRef.current);
          console.log('👀 Observer attached to sentinel');
        }
      });
    };

    const initialTimer = setTimeout(setup, 500);

    return () => {
      clearTimeout(initialTimer);
      if (observer) {
        console.log('🧹 Cleaning up observer');
        observer.disconnect();
      }
    };
  }, [conversationId, hasMore, handleLoadMore]); // ✅ เพิ่ม hasMore ใน deps

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Header */}
      {!hideHeader && (
        <ChatHeader
          user={otherUser}
          onBlock={onBlock}
          showBackButton={showBackButton}
        />
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">กำลังโหลดข้อความ...</p>
          </div>
        ) : messages.length > 0 ? (
          <ScrollToBottom
            className="h-full w-full"
            followButtonClassName="hidden"
            checkInterval={100}
            scrollViewClassName="p-4 pb-32 md:pb-24"
            initialScrollBehavior="auto"
            mode="bottom"
            debug={false}
          >
            <div className="space-y-1">
              {/* Top Sentinel - Only show if hasMore */}
              {hasMore && (
                <div 
                  ref={topSentinelRef} 
                  className="flex items-center justify-center py-3"
                  style={{ 
                    minHeight: '48px',
                    background: process.env.NODE_ENV === 'development' ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                  }}
                >
                  {process.env.NODE_ENV === 'development' && (
                    <span className="text-xs text-blue-500 font-mono bg-blue-50 px-2 py-1 rounded">
                      📍 Scroll Sentinel (hasMore: {String(hasMore)})
                    </span>
                  )}
                </div>
              )}

              {/* Loading Indicator */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    กำลังโหลดข้อความเก่า...
                  </span>
                </div>
              )}

              {/* Messages List */}
              {messages.map((message) => {
                // Handle both API response structures
                const messageSenderId = 'senderId' in message
                  ? message.senderId
                  : (message as RealChatMessage).sender?.id;

                const isOwnMessage = messageSenderId === currentUserId;

                const sender: ChatUser | RealChatUser = isOwnMessage
                  ? ({
                      id: currentUserId,
                      displayName: "คุณ",
                      avatar: null,
                      avatarUrl: null,
                      username: currentUserId,
                      isOnline: false,
                      lastSeen: new Date().toISOString(),
                    } as RealChatUser)
                  : otherUser;

                return (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    sender={sender}
                    isOwnMessage={isOwnMessage}
                  />
                );
              })}
            </div>
          </ScrollToBottom>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <MessageSquare className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg mb-2">เริ่มต้นการสนทนา</h3>
            <p className="text-muted-foreground text-sm">
              ส่งข้อความเพื่อเริ่มคุยกับ {otherUser.displayName}
            </p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-16 md:bottom-0 left-0 right-0 z-10">
        <ChatInput onSendMessage={onSendMessage} disabled={isSending} />
      </div>
    </div>
  );
}

// Empty State Component
export function ChatWindowEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-muted/10">
      <MessageSquare className="h-24 w-24 text-muted-foreground/30 mb-6" />
      <h2 className="text-2xl font-bold mb-2">ข้อความของคุณ</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        เลือกการสนทนาจากรายการด้านซ้าย หรือเริ่มการสนทนาใหม่
      </p>
      <Button variant="default" asChild>
        <a href="/search">ค้นหาผู้ใช้</a>
      </Button>
    </div>
  );
}