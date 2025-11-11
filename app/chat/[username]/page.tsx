"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatSidebar } from "@/features/chat";
import { ChatWindow } from "@/features/chat";
import { useChatStore, useConversationMessages } from "@/features/chat";
import { useAuthStore } from "@/features/auth";
import ChatLayout from "@/components/layouts/ChatLayout";
import { toast } from "sonner";
import { TOAST_MESSAGES } from "@/config";

interface SelectedFile {
  file: File;
  preview: string;
  type: "image" | "video" | "file";
}

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const { user: currentUser } = useAuthStore();
  const {
    conversations,
    conversationsLoading,
    getConversationByUsername,
    sendMessage,
    fetchMessages,
    setActiveConversation,
    markAsRead,
  } = useChatStore();

  const [conversation, setConversation] = useState<any>(null);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

  // Get messages for this conversation
  // Always call hook (Rules of Hooks) - pass empty string if no conversationId yet
  const conversationId = conversation?.id || "";
  const messageState = useConversationMessages(conversationId);
  const messages = messageState?.messages || [];
  const messagesLoading = messageState?.isLoading || false;

  // Step 1: Fetch or get conversation (run once on mount or when username changes)
  useEffect(() => {
    let isMounted = true;

    // Reset state เมื่อเปลี่ยน conversation
    setHasMarkedAsRead(false);

    const loadConversation = async () => {
      try {
        if (!isMounted) return;
        setConversationLoading(true);

        // Check if conversation exists in store
        const existingConversation = conversations.find(
          (c) => c.otherUser.username === username
        );

        if (existingConversation) {
          console.log('📬 Found existing conversation:', existingConversation.id);
          if (!isMounted) return;
          setConversation(existingConversation);
          setActiveConversation(existingConversation.id);
        } else {
          // Get or create conversation by username
          console.log('🆕 Creating/fetching conversation with:', username);
          const newConversation = await getConversationByUsername(username);
          console.log('✅ Got conversation:', newConversation.id);
          if (!isMounted) return;
          setConversation(newConversation);
          setActiveConversation(newConversation.id);
        }
      } catch (error) {
        console.error("❌ Failed to load conversation:", error);
        if (!isMounted) return;
        toast.error(TOAST_MESSAGES.CHAT.LOAD_CONVERSATION_ERROR);
      } finally {
        if (isMounted) {
          setConversationLoading(false);
        }
      }
    };

    loadConversation();

    // Cleanup
    return () => {
      isMounted = false;
      setActiveConversation(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]); // Only depend on username to avoid infinite loop

  // Step 2: Fetch messages when conversation is loaded (run once when conversation changes)
  useEffect(() => {
    // Only fetch if we have a real conversationId (not empty string)
    if (!conversationId || conversationId === "") return;

    const loadMessages = async () => {
      try {
        console.log('📨 Fetching messages for conversation:', conversationId);
        await fetchMessages(conversationId);
        // ❌ ลบ auto-mark as read ตอน fetch
        // await markAsRead(conversationId);
      } catch (error) {
        console.error("❌ Failed to fetch messages:", error);
      }
    };

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]); // Only depend on conversationId to avoid infinite loop

  // Step 3: Auto-mark as read หลัง 2 วินาที (ถ้า user ยังอยู่ในหน้า)
  useEffect(() => {
    if (!conversationId || conversationId === "" || hasMarkedAsRead) return;
    if (messageState?.messages.length === 0) return; // ไม่มีข้อความ
    if ((conversation?.unreadCount || 0) === 0) return; // ไม่มี unread

    console.log('⏱️ Starting timer to mark as read...');

    const timer = setTimeout(async () => {
      console.log('✅ Auto-marking as read after 2 seconds');
      await markAsRead(conversationId);
      setHasMarkedAsRead(true);
    }, 2000); // 2 วินาที

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messageState?.messages, conversation?.unreadCount, hasMarkedAsRead]);

  // Handle send message
  const handleSendMessage = useCallback(async (content: string, files?: SelectedFile[]) => {
    if (!conversation || !currentUser) {
      toast.error(TOAST_MESSAGES.CHAT.LOGIN_REQUIRED);
      return;
    }

    try {
      setSendingMessage(true);

      // ✅ Mark as read ก่อนส่งข้อความ (ถ้ามี unread)
      if (!hasMarkedAsRead && (conversation.unreadCount || 0) > 0) {
        console.log('✅ Marking as read before sending message');
        await markAsRead(conversation.id);
        setHasMarkedAsRead(true);
      }

      // Check if has files
      if (files && files.length > 0) {
        const firstFileType = files[0].type;

        // ✅ 1-STEP MULTIPART UPLOAD (Atomic operation for all media types)
        const formData = new FormData();
        formData.append("type", firstFileType); // "video", "image", or "file"
        formData.append("content", content || ""); // Caption (optional)

        // Attach actual files (not URLs)
        for (const selectedFile of files) {
          formData.append("media[]", selectedFile.file);
        }

        // Send message via chat store with preview files
        // Backend auto-tracks video with polymorphic pattern (sourceType: "message", sourceId: message_uuid)
        await sendMessage(conversation.id, formData, undefined, files);

        // Show toast for video upload (encoding happens in background)
        if (firstFileType === "video") {
          toast.success("ส่งข้อความแล้ว! วิดีโอกำลังประมวลผล...");
          console.log("✅ Video upload started - encoding in background");
          // Note: WebSocket will handle encoding status updates via message:video:updated event
        }
      } else {
        // Text message - send as JSON
        if (!content || content.trim() === "") {
          toast.error(TOAST_MESSAGES.CHAT.EMPTY_MESSAGE);
          return;
        }

        const formData = new FormData();
        formData.append("type", "text");
        formData.append("content", content);

        // Send message via chat store
        await sendMessage(conversation.id, formData);

        // ❌ ลบ toast - ไม่จำเป็นในแชท
        // toast.success("ส่งข้อความแล้ว");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error(TOAST_MESSAGES.CHAT.SEND_ERROR);
    } finally {
      setSendingMessage(false);
    }
  }, [conversation, currentUser, sendMessage, hasMarkedAsRead, markAsRead]);

  // Handle block user
  const handleBlock = useCallback(() => {
    if (!conversation) return;
    toast.success(TOAST_MESSAGES.CHAT.BLOCK_SUCCESS);
    // TODO: Implement block functionality
    console.log("Block user:", username);
  }, [conversation, username]);

  // If conversation not found
  if (conversationLoading) {
    return (
      <ChatLayout sidebar={<ChatSidebar conversations={conversations} activeUsername={username} isLoading={conversationsLoading} />}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </div>
        </div>
      </ChatLayout>
    );
  }

  if (!conversation) {
    return (
      <ChatLayout sidebar={<ChatSidebar conversations={conversations} activeUsername={username} isLoading={conversationsLoading} />}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8">
            <h2 className="text-xl font-bold mb-2">ไม่พบการสนทนา</h2>
            <p className="text-muted-foreground mb-4">
              ไม่พบการสนทนากับผู้ใช้นี้
            </p>
            <button
              onClick={() => router.push("/chat")}
              className="text-primary hover:underline"
            >
              กลับไปยังรายการแชท
            </button>
          </div>
        </div>
      </ChatLayout>
    );
  }

  return (
    <ChatLayout
      sidebar={<ChatSidebar conversations={conversations} activeUsername={username} isLoading={conversationsLoading} />}
      chatUser={conversation.otherUser}
      onBlockUser={handleBlock}
    >
      {/* Chat Window - full screen */}
      <ChatWindow
        otherUser={conversation.otherUser}
        messages={messages}
        currentUserId={currentUser?.id || ""}
        onSendMessage={handleSendMessage}
        onBlock={handleBlock}
        hideHeader={true}
        isLoading={messagesLoading}
        isSending={sendingMessage}
        conversationId={conversation.id} // ✅ Pass conversationId for infinity scroll
      />
    </ChatLayout>
  );
}
