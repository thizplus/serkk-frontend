/**
 * Mock Chat Data for Phase 1 MVP
 *
 * Structure:
 * - ChatConversation: รายการแชททั้งหมด
 * - ChatMessage: ข้อความในแชท (รองรับ text, image, video, file)
 * - OnlineStatus: สถานะออนไลน์
 */

export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isOnline: boolean;
  lastSeen: Date;
}

// Message Types
export type MessageType = 'text' | 'image' | 'video' | 'file';

// Media metadata
export interface MessageMedia {
  url: string;
  thumbnail?: string;
  type: 'image' | 'video' | 'file';
  filename?: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number; // seconds (for videos)
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null; // nullable for media-only messages
  media?: MessageMedia[]; // array of media
  createdAt: Date;
  isRead: boolean;
}

export interface ChatConversation {
  id: string;
  otherUser: ChatUser;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: Date;
  isBlocked: boolean;
}

// Mock current user
export const mockCurrentUser: ChatUser = {
  id: "current-user-id",
  username: "me",
  displayName: "ฉัน",
  avatarUrl: null,
  isOnline: true,
  lastSeen: new Date(),
};

// Mock users
export const mockUsers: ChatUser[] = [
  {
    id: "user-1",
    username: "somchai",
    displayName: "สมชาย มีสุข",
    avatarUrl: null,
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: "user-2",
    username: "somying",
    displayName: "สมหญิง ใจดี",
    avatarUrl: null,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: "user-3",
    username: "manee",
    displayName: "มานี ขยัน",
    avatarUrl: null,
    isOnline: true,
    lastSeen: new Date(),
  },
  {
    id: "user-4",
    username: "somsri",
    displayName: "สมศรี สวยงาม",
    avatarUrl: null,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: "user-5",
    username: "prasert",
    displayName: "ประเสริฐ ดีเลิศ",
    avatarUrl: null,
    isOnline: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
];

// Mock messages
export const mockMessages: Record<string, ChatMessage[]> = {
  "user-1": [
    {
      id: "msg-1-1",
      conversationId: "conv-1",
      senderId: "user-1",
      type: "text",
      content: "สวัสดีครับ วันนี้เป็นยังไงบ้าง?",
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isRead: true,
    },
    {
      id: "msg-1-2",
      conversationId: "conv-1",
      senderId: "current-user-id",
      type: "text",
      content: "สบายดีครับ คุณล่ะครับ?",
      createdAt: new Date(Date.now() - 1000 * 60 * 28),
      isRead: true,
    },
    {
      id: "msg-1-3",
      conversationId: "conv-1",
      senderId: "user-1",
      type: "text",
      content: "ผมก็สบายดีเหมือนกันครับ ขอบคุณที่ถาม 😊",
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
      isRead: true,
    },
    {
      id: "msg-1-4",
      conversationId: "conv-1",
      senderId: "user-1",
      type: "image",
      content: "ดูรูปนี้สิครับ สวยมาก!",
      media: [
        {
          url: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
          thumbnail: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400",
          type: "image",
          mimeType: "image/jpeg",
          size: 1024000,
          width: 1920,
          height: 1080,
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
      isRead: true,
    },
    {
      id: "msg-1-5",
      conversationId: "conv-1",
      senderId: "current-user-id",
      type: "image",
      content: null, // media-only
      media: [
        {
          url: "https://images.unsplash.com/photo-1682687221038-404cb8830901",
          thumbnail: "https://images.unsplash.com/photo-1682687221038-404cb8830901?w=400",
          type: "image",
          mimeType: "image/jpeg",
          size: 890000,
          width: 1920,
          height: 1280,
        },
        {
          url: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538",
          thumbnail: "https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400",
          type: "image",
          mimeType: "image/jpeg",
          size: 950000,
          width: 1920,
          height: 1280,
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 15),
      isRead: true,
    },
    {
      id: "msg-1-6",
      conversationId: "conv-1",
      senderId: "user-1",
      type: "video",
      content: "วิดีโอจากงานเมื่อวาน",
      media: [
        {
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
          thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400",
          type: "video",
          mimeType: "video/mp4",
          size: 5120000,
          width: 1920,
          height: 1080,
          duration: 45,
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 10),
      isRead: true,
    },
    {
      id: "msg-1-7",
      conversationId: "conv-1",
      senderId: "current-user-id",
      type: "file",
      content: "ไฟล์รายงานที่ว่าครับ",
      media: [
        {
          url: "#",
          type: "file",
          filename: "รายงานประจำเดือน.pdf",
          mimeType: "application/pdf",
          size: 2048000,
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 8),
      isRead: true,
    },
    {
      id: "msg-1-8",
      conversationId: "conv-1",
      senderId: "user-1",
      type: "text",
      content: "ขอบคุณมากครับ!",
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      isRead: false,
    },
  ],
  "user-2": [
    {
      id: "msg-2-1",
      conversationId: "conv-2",
      senderId: "current-user-id",
      type: "text",
      content: "สวัสดีค่ะ เรื่องที่เราคุยกันเมื่อวานเป็นยังไงบ้าง?",
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      isRead: true,
    },
    {
      id: "msg-2-2",
      conversationId: "conv-2",
      senderId: "user-2",
      type: "text",
      content: "ขอโทษนะคะ ตอบช้า เรื่องนั้นเสร็จเรียบร้อยแล้วค่ะ",
      createdAt: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      isRead: false,
    },
    {
      id: "msg-2-3",
      conversationId: "conv-2",
      senderId: "user-2",
      type: "text",
      content: "ขอบคุณมากนะคะที่ช่วยแนะนำ 🙏",
      createdAt: new Date(Date.now() - 1000 * 60 * 20),
      isRead: false,
    },
  ],
  "user-3": [
    {
      id: "msg-3-1",
      conversationId: "conv-3",
      senderId: "user-3",
      type: "text",
      content: "อยากถามเรื่อง project ที่คุณทำหน่อยครับ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isRead: true,
    },
    {
      id: "msg-3-2",
      conversationId: "conv-3",
      senderId: "current-user-id",
      type: "text",
      content: "ถามได้เลยครับ ยินดีช่วยเหลือ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      isRead: true,
    },
  ],
  "user-4": [
    {
      id: "msg-4-1",
      conversationId: "conv-4",
      senderId: "current-user-id",
      type: "text",
      content: "สวัสดีค่ะ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      isRead: true,
    },
  ],
  "user-5": [
    {
      id: "msg-5-1",
      conversationId: "conv-5",
      senderId: "user-5",
      type: "text",
      content: "ขอบคุณสำหรับข้อมูลครับ",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      isRead: true,
    },
  ],
};

// Mock conversations
export const mockConversations: ChatConversation[] = [
  {
    id: "conv-1",
    otherUser: mockUsers[0], // somchai
    lastMessage: mockMessages["user-1"][7], // Latest message (text)
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
    isBlocked: false,
  },
  {
    id: "conv-2",
    otherUser: mockUsers[1], // somying
    lastMessage: mockMessages["user-2"][2],
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 1000 * 60 * 20),
    isBlocked: false,
  },
  {
    id: "conv-3",
    otherUser: mockUsers[2], // manee
    lastMessage: mockMessages["user-3"][1],
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isBlocked: false,
  },
  {
    id: "conv-4",
    otherUser: mockUsers[3], // somsri
    lastMessage: mockMessages["user-4"][0],
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isBlocked: false,
  },
  {
    id: "conv-5",
    otherUser: mockUsers[4], // prasert
    lastMessage: mockMessages["user-5"][0],
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isBlocked: false,
  },
];

// Helper functions
export function getConversationByUserId(userId: string): ChatConversation | undefined {
  return mockConversations.find((conv) => conv.otherUser.id === userId);
}

export function getMessagesByUserId(userId: string): ChatMessage[] {
  return mockMessages[userId] || [];
}

export function getTotalUnreadCount(): number {
  return mockConversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
}

// Format last seen
export function formatLastSeen(lastSeen?: Date | string | null): string {
  // Handle undefined, null, or invalid values
  if (!lastSeen) {
    return "ออฟไลน์";
  }

  const lastSeenDate = typeof lastSeen === 'string' ? new Date(lastSeen) : lastSeen;

  // Validate date
  if (!lastSeenDate || isNaN(lastSeenDate.getTime())) {
    return "ออฟไลน์";
  }

  const now = new Date();
  const diff = now.getTime() - lastSeenDate.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
  if (days === 1) return "เมื่อวาน";
  if (days < 7) return `${days} วันที่แล้ว`;
  return lastSeenDate.toLocaleDateString("th-TH");
}

// Format message time
export function formatMessageTime(date?: Date | string | null): string {
  // Handle undefined, null, or invalid values
  if (!date) {
    return "";
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Validate date
  if (!dateObj || isNaN(dateObj.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const isToday = now.toDateString() === dateObj.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === dateObj.toDateString();

  if (isToday) {
    return dateObj.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  }
  if (isYesterday) {
    return "เมื่อวาน";
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return dateObj.toLocaleDateString("th-TH", { weekday: "short" });
  }
  return dateObj.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}
