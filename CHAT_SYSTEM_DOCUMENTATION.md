# 📱 ระบบ Chat: Smooth Scrolling & Load More Implementation

## 📋 สารบัญ
1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [Library และเทคโนโลยีที่ใช้](#library-และเทคโนโลยีที่ใช้)
3. [Smooth Scrolling: react-scroll-to-bottom](#smooth-scrolling-react-scroll-to-bottom)
4. [Load More Messages: Cursor-based Pagination](#load-more-messages-cursor-based-pagination)
5. [State Management: Zustand](#state-management-zustand)
6. [IntersectionObserver: Auto Load More](#intersectionobserver-auto-load-more)
7. [Scroll Position Preservation](#scroll-position-preservation)
8. [Optimistic Updates](#optimistic-updates)
9. [Real-time Updates: WebSocket](#real-time-updates-websocket)
10. [สรุปและ Best Practices](#สรุปและ-best-practices)

---

## ภาพรวมระบบ

ระบบ chat นี้ถูกออกแบบมาให้มีประสิทธิภาพสูง มี UX ที่ดี และสามารถรองรับข้อความจำนวนมากได้ โดยมีจุดเด่น:

- ✅ **Smooth Scrolling**: การเลื่อนดูข้อความที่ลื่นไหล auto-scroll ไปข้อความล่าสุด
- ✅ **Infinite Scroll**: โหลดข้อความเก่าอัตโนมัติเมื่อ scroll ถึงด้านบน
- ✅ **Cursor-based Pagination**: การแบ่งหน้าที่มีประสิทธิภาพและแม่นยำ
- ✅ **Optimistic Updates**: แสดงข้อความทันทีก่อนที่เซิร์ฟเวอร์จะตอบกลับ
- ✅ **Real-time**: อัปเดตข้อความแบบ real-time ผ่าน WebSocket
- ✅ **Scroll Position Preservation**: รักษาตำแหน่ง scroll เมื่อโหลดข้อความเก่า

---

## Library และเทคโนโลยีที่ใช้

### 1. **react-scroll-to-bottom** v4.2.0
```json
"react-scroll-to-bottom": "^4.2.0"
"@types/react-scroll-to-bottom": "^4.2.5"
```

**ทำไมใช้?**
- Auto-scroll ไปข้อความล่าสุดอัตโนมัติ
- Smooth scrolling animation ที่ลื่นไหล
- รองรับการตรวจจับ "sticky to bottom" behavior
- จัดการ scroll container ได้อัตโนมัติ

### 2. **IntersectionObserver API** (Native Browser API)
- ตรวจจับเมื่อผู้ใช้ scroll ถึงด้านบนของหน้าต่างแชท
- Trigger load more messages โดยอัตโนมัติ
- ประหยัด performance กว่าการใช้ scroll event listeners

### 3. **Zustand** v5.0.8
```json
"zustand": "^5.0.8"
```

**ทำไมใช้?**
- State management ที่เบาและเร็ว
- ไม่ต้องใช้ Context Provider (ใช้ตรงไหนก็ได้)
- รองรับ TypeScript ได้ดี
- API ง่าย เรียนรู้ง่าย

### 4. **Axios** v1.13.1
```json
"axios": "^1.13.1"
```
- HTTP client สำหรับเรียก API
- รองรับ interceptors สำหรับจัดการ auth

---

## Smooth Scrolling: react-scroll-to-bottom

### การติดตั้งและ Setup

```tsx
import ScrollToBottom from "react-scroll-to-bottom";

<ScrollToBottom
  className="h-full w-full"
  followButtonClassName="hidden"        // ซ่อนปุ่ม "scroll to bottom"
  checkInterval={100}                   // ตรวจสอบทุก 100ms ว่าควร scroll หรือไม่
  scrollViewClassName="p-4 pb-32 md:pb-24"  // style สำหรับ scroll container
  initialScrollBehavior="auto"          // scroll ไปล่างทันทีเมื่อ mount
  mode="bottom"                         // stick ที่ด้านล่าง
  debug={false}                         // ปิด debug mode
>
  {/* ข้อความทั้งหมด */}
  <div className="space-y-1">
    {messages.map((message) => (
      <ChatMessage key={message.id} message={message} />
    ))}
  </div>
</ScrollToBottom>
```

### Props สำคัญที่ใช้

| Prop | ค่าที่ใช้ | เหตุผล |
|------|----------|--------|
| `initialScrollBehavior` | `"auto"` | Scroll ไปล่างทันทีเมื่อเปิดแชท |
| `mode` | `"bottom"` | Auto-scroll เมื่อมีข้อความใหม่ (เฉพาะเมื่ออยู่ด้านล่างอยู่แล้ว) |
| `checkInterval` | `100` | ตรวจสอบทุก 100ms ว่าควร scroll หรือไม่ |
| `followButtonClassName` | `"hidden"` | ซ่อนปุ่ม "scroll to bottom" เพราะไม่ต้องการ |

### พฤติกรรมของ react-scroll-to-bottom

1. **Auto-scroll เมื่อมีข้อความใหม่**: ถ้าผู้ใช้อยู่ด้านล่างอยู่แล้ว จะ scroll ไปข้อความใหม่อัตโนมัติ
2. **ไม่ scroll ถ้าผู้ใช้อ่านข้อความเก่า**: ถ้าผู้ใช้ scroll ขึ้นไปอ่านข้อความเก่า จะไม่ scroll ลงมา
3. **Smooth animation**: มี CSS transition ที่ทำให้การ scroll ลื่นไหล

---

## Load More Messages: Cursor-based Pagination

### ทำไมใช้ Cursor-based แทน Offset/Page?

#### ❌ Offset-based (แบบเดิม)
```typescript
// ปัญหา: ถ้ามีข้อความใหม่เข้ามาระหว่างที่โหลด จะได้ข้อความซ้ำ
GET /messages?offset=0&limit=20   // หน้า 1: ข้อความ 1-20
GET /messages?offset=20&limit=20  // หน้า 2: ข้อความ 21-40
// ถ้ามีข้อความใหม่ 5 ข้อความ → หน้า 2 จะได้ข้อความ 16-35 (ซ้ำกับหน้า 1)
```

#### ✅ Cursor-based (ที่ใช้)
```typescript
// ใช้ cursor (timestamp หรือ ID) แทน offset
GET /messages?limit=20
// Response: { messages: [...], nextCursor: "2024-01-15T10:30:00Z" }

GET /messages?cursor=2024-01-15T10:30:00Z&limit=20
// Response: { messages: [...], nextCursor: "2024-01-14T09:20:00Z" }
```

**ข้อดี:**
- ไม่เกิดข้อความซ้ำแม้จะมีข้อความใหม่เข้ามา
- แม่นยำและ consistent
- รองรับ real-time updates ได้ดี

### State Structure สำหรับ Pagination

```typescript
// src/features/chat/stores/chat/chatTypes.ts

interface MessagePaginationState {
  messages: ChatMessage[];      // ข้อความทั้งหมด
  hasMore: boolean;             // ยังมีข้อความเก่าอีกหรือไม่?
  nextCursor?: string;          // cursor สำหรับโหลดหน้าถัดไป
  isLoading: boolean;           // กำลังโหลดอยู่หรือไม่?
}

interface ChatStoreState {
  // จัดเก็บข้อความแยกตาม conversation
  messagesByConversation: {
    [conversationId: string]: MessagePaginationState;
  };
}
```

### การโหลดข้อความครั้งแรก (Initial Load)

```typescript
// src/features/chat/stores/chat/actions/messageActions.ts

fetchMessages: async (conversationId: string) => {
  try {
    // 1. Set loading state
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: {
          messages: [],
          hasMore: false,
          nextCursor: undefined,
          isLoading: true,
        },
      },
    }));

    // 2. เรียก API (ไม่มี cursor = โหลดข้อความล่าสุด)
    const response = await chatService.getMessages(conversationId, {
      limit: PAGINATION.MESSAGE_LIMIT  // 50 ข้อความ
    });

    if (response.success && response.data) {
      const { messages, hasMore, nextCursor } = response.data;

      // 3. Reverse messages (API ส่งมาแบบ newest first, เราต้องการ oldest first)
      const reversedMessages = reverseMessages(messages);

      // 4. Save to store
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            messages: reversedMessages,
            hasMore: hasMore,          // ยังมีข้อความเก่าอีกไหม?
            nextCursor: nextCursor,    // cursor สำหรับโหลดหน้าถัดไป
            isLoading: false,
          },
        },
      }));
    }
  } catch (error) {
    console.error('Failed to fetch messages:', error);
  }
}
```

### การโหลดข้อความเพิ่มเติม (Load More)

```typescript
loadMoreMessages: async (conversationId: string) => {
  const messageState = get().messagesByConversation[conversationId];

  // ตรวจสอบว่าสามารถโหลดได้หรือไม่
  if (!messageState || !messageState.hasMore || !messageState.nextCursor) {
    console.log('Cannot load more');
    return;
  }

  try {
    // 1. เรียก API พร้อม cursor
    const response = await chatService.getMessages(conversationId, {
      cursor: messageState.nextCursor,  // ส่ง cursor ไปเพื่อโหลดข้อความก่อนหน้า
      limit: PAGINATION.MESSAGE_LIMIT,   // 50 ข้อความ
    });

    if (response.success && response.data) {
      const { messages, hasMore, nextCursor } = response.data;

      // 2. Prepend ข้อความเก่าไว้ด้านหน้า
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...messageState,
            messages: [
              ...reverseMessages(messages),  // ข้อความเก่า (ใหม่)
              ...messageState.messages        // ข้อความเก่า (ที่มีอยู่)
            ],
            hasMore: hasMore,
            nextCursor: nextCursor,
          },
        },
      }));
    }
  } catch (error) {
    console.error('Failed to load more messages:', error);
  }
}
```

### Configuration

```typescript
// src/shared/config/constants.ts

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MESSAGE_LIMIT: 50,      // ✅ โหลดข้อความ 50 ข้อความต่อครั้ง
  COMMENT_LIMIT: 20,
  LARGE_LIMIT: 100,
  INFINITE_SCROLL_THRESHOLD: 0.8,
} as const;
```

---

## State Management: Zustand

### ทำไมใช้ Zustand?

1. **เบาและเร็ว**: ไม่มี boilerplate มาก ไม่ต้อง setup Provider
2. **ใช้งานง่าย**: API ตรงไปตรงมา เข้าใจได้ง่าย
3. **TypeScript Support**: รองรับ TypeScript ได้ดีมาก
4. **ไม่ต้อง Context**: เรียกใช้ได้จากไหนก็ได้โดยไม่ต้องอยู่ใน Provider tree

### Store Structure

```typescript
// src/features/chat/stores/chat/chatStore.ts

import { create } from 'zustand';

export const useChatStore = create<ChatStoreState>()((set, get) => ({
  // ========== STATE ==========
  conversations: [],                    // รายการ conversation ทั้งหมด
  conversationsLoading: false,
  conversationsHasMore: false,
  conversationsNextCursor: undefined,

  messagesByConversation: {},           // ข้อความแยกตาม conversation
  activeConversationId: null,           // conversation ที่เปิดอยู่

  onlineUsers: {},                      // สถานะออนไลน์ของผู้ใช้
  unreadCount: 0,                       // จำนวนข้อความที่ยังไม่ได้อ่าน
  typingUsers: {},                      // ผู้ใช้ที่กำลังพิมพ์

  // ========== ACTIONS ==========
  ...createConversationActions(set, get),
  ...createMessageActions(set, get),
  ...createOnlineStatusActions(set, get),
}));
```

### การใช้งานใน Component

```typescript
import { useChatStore } from '@/features/chat/stores/chat';

function ChatWindow({ conversationId }: Props) {
  // ✅ Subscribe to specific state (จะ re-render เฉพาะเมื่อ state นี้เปลี่ยน)
  const messages = useChatStore((state) =>
    state.messagesByConversation[conversationId]?.messages || []
  );

  const hasMore = useChatStore((state) =>
    state.messagesByConversation[conversationId]?.hasMore ?? false
  );

  // ✅ Get actions (ไม่ทำให้ re-render)
  const loadMoreMessages = useChatStore((state) => state.loadMoreMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);

  // ใช้งาน
  const handleLoadMore = () => {
    loadMoreMessages(conversationId);
  };

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
      {hasMore && <button onClick={handleLoadMore}>Load More</button>}
    </div>
  );
}
```

### การแยก Actions ออกเป็นไฟล์

```typescript
// src/features/chat/stores/chat/actions/messageActions.ts

export const createMessageActions = (
  set: StoreApi<ChatStoreState>['setState'],
  get: StoreApi<ChatStoreState>['getState']
): MessageActions => ({
  fetchMessages: async (conversationId) => { /* ... */ },
  loadMoreMessages: async (conversationId) => { /* ... */ },
  sendMessage: async (conversationId, formData) => { /* ... */ },
  addIncomingMessage: (message) => { /* ... */ },
  markAsRead: async (conversationId) => { /* ... */ },
});
```

**ข้อดี:**
- โค้ดเป็นระเบียบ แยกความรับผิดชอบชัดเจน
- ง่ายต่อการ maintain และ debug
- แต่ละไฟล์มีหน้าที่เดียว (Single Responsibility Principle)

---

## IntersectionObserver: Auto Load More

### Sentinel Element

"Sentinel" คือ element ที่อยู่ด้านบนสุดของรายการข้อความ เมื่อผู้ใช้ scroll ถึง element นี้ จะ trigger load more

```tsx
// src/features/chat/components/ChatWindow.tsx

{hasMore && (
  <div
    ref={topSentinelRef}  // ✅ Ref สำหรับ observe
    className="flex items-center justify-center py-3"
    style={{ minHeight: '48px' }}
  >
    {process.env.NODE_ENV === 'development' && (
      <span className="text-xs text-blue-500">
        📍 Scroll Sentinel
      </span>
    )}
  </div>
)}
```

### Setup IntersectionObserver

```typescript
const topSentinelRef = useRef<HTMLDivElement>(null);
const scrollContainerRef = useRef<HTMLElement | null>(null);
const isRestoringScrollRef = useRef(false);
const isLoadingMoreRef = useRef(false);

useEffect(() => {
  if (!conversationId || !topSentinelRef.current || !hasMore) {
    return; // ไม่ต้อง observe ถ้าไม่มีข้อความเพิ่ม
  }

  let observer: IntersectionObserver | null = null;

  const setup = () => {
    requestAnimationFrame(() => {
      if (!topSentinelRef.current) return;

      // 1. หา scroll container (parent ที่มี overflow: scroll/auto)
      scrollContainer = findScrollContainer();

      if (!scrollContainer) {
        setTimeout(setup, 1000); // retry ถ้าหาไม่เจอ
        return;
      }

      scrollContainerRef.current = scrollContainer;

      // 2. สร้าง IntersectionObserver
      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;

          // ✅ ละเลยถ้ากำลัง restore scroll อยู่
          if (isRestoringScrollRef.current) {
            return;
          }

          // ✅ Trigger load more เมื่อ sentinel มองเห็น
          if (entry.isIntersecting && hasMore && !isLoadingMoreRef.current) {
            handleLoadMore();
          }
        },
        {
          root: scrollContainer,              // container ที่เป็น scroll parent
          rootMargin: '100px 0px 0px 0px',    // โหลดล่วงหน้า 100px
          threshold: 0.01,                     // trigger เมื่อมองเห็น 1%
        }
      );

      // 3. เริ่ม observe
      observer.observe(topSentinelRef.current);
    });
  };

  const timer = setTimeout(setup, 500); // รอให้ component mount เสร็จ

  return () => {
    clearTimeout(timer);
    observer?.disconnect();
  };
}, [conversationId, hasMore, handleLoadMore]);
```

### rootMargin และ threshold

```typescript
{
  root: scrollContainer,
  rootMargin: '100px 0px 0px 0px',  // ✅ โหลดล่วงหน้า 100px ก่อนจะ scroll ถึง
  threshold: 0.01,                   // ✅ trigger เมื่อ sentinel มองเห็น 1%
}
```

**rootMargin: '100px 0px 0px 0px'**
- ขยาย intersection area ไปด้านบน 100px
- ทำให้โหลดข้อความก่อนที่ผู้ใช้จะ scroll ถึงจริงๆ
- UX ดีขึ้น: ไม่ต้องรอโหลด

**threshold: 0.01**
- Trigger เมื่อ sentinel มองเห็นแค่ 1%
- ค่า sensitive พอที่จะ trigger ได้เร็ว

---

## Scroll Position Preservation

### ปัญหา: Scroll Jumping

เมื่อโหลดข้อความเก่า DOM จะเพิ่มขึ้น ทำให้ scroll position เปลี่ยน:

```
Before Load More:
┌─────────────┐
│ [Message 11]│ ← scroll อยู่ตรงนี้
│ [Message 12]│
│ [Message 13]│
└─────────────┘

After Load More (ไม่ fix):
┌─────────────┐
│ [Message 1] │ ← scroll กระโดดมาตรงนี้ (ผิด!)
│ [Message 2] │
│ [Message 3] │
│ ...         │
│ [Message 11]│ ← ควรอยู่ตรงนี้
│ [Message 12]│
└─────────────┘
```

### วิธีแก้: Calculate และ Restore Scroll Position

```typescript
const handleLoadMore = useCallback(async () => {
  if (!conversationId || !hasMore || isLoadingMoreRef.current) {
    return;
  }

  const scrollContainer = scrollContainerRef.current;
  if (!scrollContainer) return;

  try {
    setIsLoadingMore(true);
    isLoadingMoreRef.current = true;
    isRestoringScrollRef.current = true;

    // 1️⃣ บันทึก scroll position ก่อนโหลด
    const previousScrollHeight = scrollContainer.scrollHeight;
    const previousScrollTop = scrollContainer.scrollTop;

    console.log('Before load:', {
      scrollHeight: previousScrollHeight,   // เช่น 3000px
      scrollTop: previousScrollTop,         // เช่น 200px
    });

    // 2️⃣ โหลดข้อความเพิ่ม
    await loadMoreMessages(conversationId);

    // 3️⃣ รอให้ DOM update
    await new Promise<void>((resolve) => setTimeout(resolve, 150));

    // 4️⃣ คำนวณ scroll position ใหม่
    const newScrollHeight = scrollContainer.scrollHeight;  // เช่น 5000px
    const heightDifference = newScrollHeight - previousScrollHeight;  // 2000px
    const newScrollTop = previousScrollTop + heightDifference;  // 200 + 2000 = 2200px

    console.log('After load:', {
      newScrollHeight,
      heightDifference,
      newScrollTop,
    });

    // 5️⃣ Restore scroll position
    scrollContainer.scrollTop = newScrollTop;  // ✅ กลับไปที่ Message 11

    console.log('✅ Scroll position restored');
  } catch (error) {
    console.error('Load more error:', error);
  } finally {
    setTimeout(() => {
      isRestoringScrollRef.current = false;
    }, 200);
    setIsLoadingMore(false);
    isLoadingMoreRef.current = false;
  }
}, [conversationId, hasMore, loadMoreMessages]);
```

### Flow การทำงาน

```
1. User scrolls to top
   └─> Sentinel เข้ามาใน viewport
       └─> IntersectionObserver triggers
           └─> handleLoadMore() called

2. Save scroll position
   previousScrollHeight = 3000px
   previousScrollTop = 200px

3. Load more messages (50 messages)
   API call → Zustand store updated → React re-renders

4. Wait for DOM update (150ms)
   newScrollHeight = 5000px

5. Calculate new position
   heightDifference = 5000 - 3000 = 2000px
   newScrollTop = 200 + 2000 = 2200px

6. Restore scroll
   scrollContainer.scrollTop = 2200px
   ✅ User stays at Message 11
```

### Flags สำหรับป้องกัน Race Conditions

```typescript
const isRestoringScrollRef = useRef(false);  // ✅ กำลัง restore scroll อยู่หรือไม่
const isLoadingMoreRef = useRef(false);      // ✅ กำลังโหลดอยู่หรือไม่

// ใช้ใน IntersectionObserver
if (isRestoringScrollRef.current) {
  return; // ✅ ไม่ trigger load more ระหว่าง restore
}

if (entry.isIntersecting && hasMore && !isLoadingMoreRef.current) {
  handleLoadMore(); // ✅ trigger เฉพาะเมื่อไม่ได้โหลดอยู่
}
```

---

## Optimistic Updates

### อะไรคือ Optimistic Updates?

แสดงข้อความทันทีที่ส่ง โดยไม่รอ API response → UX ดีขึ้นมาก

### Flow

```
1. User clicks Send
   ├─> Create temporary message (id: temp-123)
   ├─> Add to UI immediately ✅
   └─> Send API request in background

2. API responds
   ├─> Success: Replace temp message with real message
   └─> Error: Remove temp message + show error
```

### Implementation

```typescript
sendMessage: async (conversationId: string, formData: FormData, files?) => {
  // 1️⃣ Generate temporary ID
  const tempId = generateTempMessageId(); // "temp-1642345678-0.123"

  const currentUser = getCurrentUser();
  const content = formData.get('content') as string;

  try {
    // 2️⃣ Create temporary message
    const tempMessage: ChatMessage = {
      id: tempId,
      conversationId,
      type: 'text',
      content: content || '',
      createdAt: new Date().toISOString(),
      isRead: false,
      sender: currentUser,
      // ใช้ preview URLs สำหรับรูปภาพ/วิดีโอ
      media: files?.map(f => ({
        url: f.preview,  // blob:// URL
        type: f.type,
      })),
    };

    // 3️⃣ Add to UI immediately ✅
    set((state) => {
      const messageState = state.messagesByConversation[conversationId];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...messageState,
            messages: [...messageState.messages, tempMessage], // ✅ แสดงทันที
          },
        },
      };
    });

    // 4️⃣ Update conversation last message (optimistic)
    get().updateConversation(conversationId, {
      lastMessage: {
        id: tempId,
        type: tempMessage.type,
        content: tempMessage.content,
        createdAt: tempMessage.createdAt,
      },
    });

    // 5️⃣ Send API request (in background)
    const response = await chatService.sendTextMessage(conversationId, content);

    if (response.success && response.data) {
      const realMessage = response.data;

      // 6️⃣ Replace temporary message with real message
      set((state) => {
        const messageState = state.messagesByConversation[conversationId];
        return {
          messagesByConversation: {
            ...state.messagesByConversation,
            [conversationId]: {
              ...messageState,
              messages: messageState.messages.map((msg) =>
                msg.id === tempId ? realMessage : msg  // ✅ แทนที่
              ),
            },
          },
        };
      });

      return realMessage;
    }
  } catch (error) {
    // 7️⃣ Remove temporary message on error ❌
    set((state) => {
      const messageState = state.messagesByConversation[conversationId];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: {
            ...messageState,
            messages: messageState.messages.filter((msg) =>
              msg.id !== tempId  // ✅ ลบออก
            ),
          },
        },
      };
    });

    toast.error('ไม่สามารถส่งข้อความได้');
    throw error;
  }
}
```

### ข้อดีของ Optimistic Updates

1. **UX ดีขึ้น**: ผู้ใช้เห็นข้อความทันที ไม่ต้องรอ
2. **รู้สึกเร็ว**: แอปรู้สึกมี responsiveness สูง
3. **รองรับ Offline**: สามารถแสดง UI ได้แม้จะ offline (แล้วค่อย sync ทีหลัง)

### ข้อควรระวัง

1. **ต้องจัดการ Error**: ต้องลบข้อความออกถ้า API ล้มเหลว
2. **ต้องแทนที่ด้วย Real Data**: เมื่อ API ตอบกลับ ต้องแทนที่ temp message
3. **Temporary ID**: ต้องมี ID ที่ unique และไม่ซ้ำกับ real messages

---

## Real-time Updates: WebSocket

### WebSocket Client

```typescript
// src/features/chat/services/chat/chatWebSocketClient.ts

class ChatWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private messageQueue: any[] = [];

  connect(token: string) {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/chat?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.reconnectAttempts = 0;
      this.flushMessageQueue(); // ส่งข้อความที่ค้างอยู่
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket closed');
      this.attemptReconnect();
    };
  }

  handleMessage(data: any) {
    switch (data.type) {
      case 'new_message':
        // ✅ เพิ่มข้อความใหม่
        useChatStore.getState().addIncomingMessage(data.message);
        break;

      case 'message_read':
        // ✅ Mark messages as read
        useChatStore.getState().markConversationMessagesAsRead(
          data.conversationId,
          data.readAt
        );
        break;

      case 'user_online':
        // ✅ Update online status
        useChatStore.getState().setUserOnline(data.userId, true);
        break;

      case 'user_typing':
        // ✅ Show typing indicator
        useChatStore.getState().setUserTyping(data.conversationId, data.userId, true);
        break;
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // ✅ Queue message ถ้ายังไม่ได้เชื่อมต่อ
      this.messageQueue.push(data);
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < WEBSOCKET.MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(
        WEBSOCKET.RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
        WEBSOCKET.MAX_RECONNECT_DELAY_MS
      );

      setTimeout(() => {
        console.log(`🔄 Reconnecting... (${this.reconnectAttempts + 1})`);
        this.reconnectAttempts++;
        this.connect(this.token);
      }, delay);
    }
  }
}
```

### WebSocket Configuration

```typescript
// src/shared/config/constants.ts

export const WEBSOCKET = {
  MAX_RECONNECT_ATTEMPTS: 5,          // พยายาม reconnect สูงสุด 5 ครั้ง
  RECONNECT_DELAY_MS: 1000,           // เริ่มต้น 1 วินาที
  MAX_RECONNECT_DELAY_MS: 60000,      // สูงสุด 60 วินาที
  RECONNECT_MULTIPLIER: 2,            // เพิ่ม delay เป็น 2 เท่า (exponential backoff)
  PING_INTERVAL_MS: 54000,            // ส่ง ping ทุก 54 วินาที
  PING_TIMEOUT_MS: 5000,              // timeout ถ้าไม่ได้ pong ภายใน 5 วินาที
  MESSAGE_QUEUE_SIZE: 100,            // เก็บข้อความค้างสูงสุด 100 ข้อความ
} as const;
```

### Message Types

```typescript
// ประเภทข้อความที่ WebSocket รองรับ

1. new_message
   {
     type: 'new_message',
     message: ChatMessage
   }

2. message_read
   {
     type: 'message_read',
     conversationId: string,
     readAt: string
   }

3. user_online / user_offline
   {
     type: 'user_online',
     userId: string
   }

4. user_typing / user_stop_typing
   {
     type: 'user_typing',
     conversationId: string,
     userId: string
   }
```

### Integration กับ Zustand Store

```typescript
// src/features/chat/stores/chat/actions/messageActions.ts

addIncomingMessage: (message: ChatMessage) => {
  const { conversationId } = message;

  set((state) => {
    const messageState = state.messagesByConversation[conversationId];

    // ตรวจสอบว่าข้อความมีอยู่แล้วหรือไม่ (ป้องกันซ้ำ)
    const exists = messageState?.messages.find((m) => m.id === message.id);
    if (exists) {
      return state; // ✅ ข้ามถ้ามีอยู่แล้ว
    }

    // ตรวจสอบว่าเป็น active conversation หรือไม่
    const isActiveConversation = state.activeConversationId === conversationId;

    return {
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: {
          ...messageState,
          messages: [...(messageState?.messages || []), message], // ✅ เพิ่มข้อความ
        },
      },
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: {
                id: message.id,
                type: message.type,
                content: message.content,
                createdAt: message.createdAt,
              },
              // ✅ เพิ่ม unread count เฉพาะถ้าไม่ใช่ active conversation
              unreadCount: isActiveConversation
                ? conv.unreadCount
                : conv.unreadCount + 1,
              updatedAt: message.createdAt,
            }
          : conv
      ),
      // ✅ เพิ่ม global unread count
      unreadCount: isActiveConversation
        ? state.unreadCount
        : state.unreadCount + 1,
    };
  });
}
```

---

## สรุปและ Best Practices

### สรุปสถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────────┐
│                         ChatWindow                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ react-scroll-to-bottom (Smooth Scrolling)            │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Sentinel (IntersectionObserver)                 │ │  │
│  │  │ ⬇ Triggers when visible                         │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │ Messages (from Zustand)                         │ │  │
│  │  │ [Message 1]                                     │ │  │
│  │  │ [Message 2]                                     │ │  │
│  │  │ [Message 3]                                     │ │  │
│  │  │ ...                                             │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ⬇                                ⬇
    ┌──────────────┐                ┌─────────────┐
    │   Zustand    │ ←── WebSocket │  Chat API   │
    │    Store     │                │   Service   │
    └──────────────┘                └─────────────┘
```

### Best Practices

#### 1. Pagination
- ✅ ใช้ Cursor-based แทน Offset-based
- ✅ โหลดข้อความ 50 ข้อความต่อครั้ง (MESSAGE_LIMIT)
- ✅ ใช้ `hasMore` และ `nextCursor` ในการควบคุม
- ✅ Disable load more ระหว่างที่กำลังโหลด

#### 2. Scroll Management
- ✅ ใช้ `react-scroll-to-bottom` สำหรับ auto-scroll
- ✅ ใช้ IntersectionObserver แทน scroll event
- ✅ บันทึกและ restore scroll position เมื่อ load more
- ✅ ใช้ flags (`isRestoring`, `isLoading`) เพื่อป้องกัน race conditions

#### 3. State Management
- ✅ ใช้ Zustand แทน Redux (ง่ายกว่า เบากว่า)
- ✅ แยก actions ออกเป็นไฟล์ตาม domain
- ✅ Subscribe เฉพาะ state ที่ต้องการ (เพื่อลด re-renders)
- ✅ ใช้ `getState()` สำหรับ read ครั้งเดียวโดยไม่ subscribe

#### 4. Performance
- ✅ ใช้ `useCallback` สำหรับ handlers
- ✅ ใช้ `memo` สำหรับ ChatMessage component
- ✅ Lazy load รูปภาพและวิดีโอ
- ✅ Virtualization สำหรับข้อความจำนวนมาก (พิจารณาใช้ react-window)

#### 5. Real-time
- ✅ ใช้ WebSocket สำหรับ updates แบบ real-time
- ✅ Implement exponential backoff สำหรับ reconnection
- ✅ Queue messages ระหว่างที่ไม่ได้เชื่อมต่อ
- ✅ ป้องกันข้อความซ้ำด้วยการเช็ค ID

#### 6. UX
- ✅ Optimistic updates สำหรับการส่งข้อความ
- ✅ แสดง loading indicator เมื่อ load more
- ✅ Auto-scroll เฉพาะเมื่ออยู่ด้านล่าง
- ✅ แสดง "กำลังพิมพ์..." indicator
- ✅ แสดงสถานะออนไลน์

#### 7. Error Handling
- ✅ Catch errors และแสดง toast notification
- ✅ Retry mechanism สำหรับ failed requests
- ✅ ลบ temporary messages เมื่อส่งล้มเหลว
- ✅ Graceful degradation เมื่อ WebSocket ไม่เชื่อมต่อ

---

## ตัวอย่างการ Debug

### Console Logs ที่มีประโยชน์

```typescript
// 1. Load More
console.log('🔄 handleLoadMore called:', {
  conversationId,
  hasMore,
  isLoading: isLoadingMoreRef.current,
  messageCount: messages.length,
});

// 2. Scroll Position
console.log('📏 Before load:', {
  scrollHeight: previousScrollHeight,
  scrollTop: previousScrollTop,
});

console.log('📏 After load:', {
  newScrollHeight,
  heightDifference,
  newScrollTop,
});

// 3. Store State
console.log('🗄️ [Store State]:', {
  conversationId,
  hasMore,
  nextCursor,
  messagesCount: messages.length,
});

// 4. WebSocket
console.log('✅ WebSocket connected');
console.log('📥 Received message:', data);

// 5. IntersectionObserver
console.log('👁️ Intersection event:', {
  isIntersecting: entry.isIntersecting,
  isRestoring: isRestoringScrollRef.current,
  hasMore,
  isLoading: isLoadingMoreRef.current,
});
```

---

## เอกสารอ้างอิง

### Libraries
- [react-scroll-to-bottom](https://github.com/compulim/react-scroll-to-bottom) - Smooth scrolling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [MDN: IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) - Native API
- [MDN: WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication

### Related Files
```
src/features/chat/
├── components/
│   ├── ChatWindow.tsx                  # Main chat UI + Scrolling logic
│   ├── ChatMessage.tsx                 # Individual message
│   └── ChatInput.tsx                   # Message input
├── stores/chat/
│   ├── chatStore.ts                    # Zustand store
│   ├── chatTypes.ts                    # TypeScript types
│   ├── actions/
│   │   ├── messageActions.ts           # Message CRUD + Pagination
│   │   ├── conversationActions.ts      # Conversation management
│   │   └── onlineStatusActions.ts      # Online status + Typing
│   └── helpers/
│       └── messageHelpers.ts           # Utility functions
├── services/
│   ├── chat.service.ts                 # API calls
│   └── chat/
│       ├── chatWebSocketClient.ts      # WebSocket client
│       └── messageRouter.ts            # WebSocket message routing
└── hooks/
    └── useChatWebSocket.ts             # WebSocket React hook

src/shared/config/
└── constants.ts                        # PAGINATION, WEBSOCKET config
```

---

## สรุป

ระบบ chat นี้ใช้เทคนิคและ library ที่ทันสมัย มี performance สูง และ UX ดี:

1. **react-scroll-to-bottom** → Smooth scrolling + Auto-scroll
2. **IntersectionObserver** → Auto load more เมื่อ scroll ถึงด้านบน
3. **Cursor-based Pagination** → แม่นยำ ไม่มีข้อความซ้ำ
4. **Scroll Position Preservation** → ไม่กระโดดเมื่อ load more
5. **Zustand** → State management ที่เบาและเร็ว
6. **Optimistic Updates** → UX ดี แสดงข้อความทันที
7. **WebSocket** → Real-time updates

หวังว่าเอกสารนี้จะช่วยให้คุณและทีมเข้าใจระบบได้ดียิ่งขึ้น! 🚀
