# 🎉 Reddit-Style Post System - คู่มือการใช้งาน

## ✨ ภาพรวม

ระบบโพสต์แบบ Reddit ที่สร้างด้วย Next.js 16, TypeScript, และ shadcn/ui พร้อมฟีเจอร์:
- ✅ สร้างโพสต์ (Create Post)
- ✅ แสดงฟีดโพสต์ (Post Feed)
- ✅ ระบบ Vote (Upvote/Downvote)
- ✅ แสดงจำนวน Comments
- ✅ ปุ่ม Share และ Save
- ✅ แท็ก (Tags)
- ✅ รองรับรูปภาพ

---

## 📂 โครงสร้างไฟล์

```
nextjs-frontend/
├── app/
│   ├── posts/
│   │   └── page.tsx              # หน้าแสดงฟีดโพสต์
│   └── create-post/
│       └── page.tsx               # หน้าสร้างโพสต์
├── components/
│   ├── post/
│   │   ├── VoteButtons.tsx        # ปุ่ม Upvote/Downvote
│   │   ├── PostCard.tsx           # การ์ดแสดงโพสต์
│   │   ├── PostFeed.tsx           # ฟีดรายการโพสต์
│   │   └── CreatePostForm.tsx     # ฟอร์มสร้างโพสต์
│   ├── layouts/
│   │   └── AppLayout.tsx          # Layout หลัก
│   └── app-sidebar.tsx            # Sidebar navigation
├── lib/
│   ├── types/
│   │   └── post.ts                # TypeScript types
│   └── data/
│       └── mock-posts.json        # Mock data สำหรับทดสอบ
└── reddit-analysis.md             # เอกสารวิเคราะห์โครงสร้าง
```

---

## 🚀 วิธีใช้งาน

### 1. เข้าถึงหน้าต่างๆ

- **หน้าแรก**: `http://localhost:3000/`
- **ฟีดโพสต์**: `http://localhost:3000/posts`
- **สร้างโพสต์**: `http://localhost:3000/create-post`

### 2. การนำทาง (Sidebar)

Sidebar ด้านซ้ายมีเมนู:
- 🏠 **หน้าหลัก** - กลับไปหน้าแรก
- 📄 **โพสต์ทั้งหมด** - ดูฟีดโพสต์
- ➕ **สร้างโพสต์** - สร้างโพสต์ใหม่

---

## 📝 การสร้างโพสต์

1. คลิกที่ "สร้างโพสต์" ใน Sidebar หรือปุ่ม "+ สร้างโพสต์" ในหน้าฟีด
2. กรอกข้อมูล:
   - **หัวข้อ** (บังคับ) - สูงสุด 300 ตัวอักษร
   - **เนื้อหา** (บังคับ) - รองรับการขึ้นบรรทัดใหม่
   - **แท็ก** (ไม่บังคับ) - พิมพ์แล้วกด Enter หรือเครื่องหมาย comma
3. คลิก "โพสต์"
4. ระบบจะพากลับไปหน้าฟีดโดยอัตโนมัติ

---

## 🎨 Components หลัก

### 1. VoteButtons
แสดงปุ่ม Upvote/Downvote แบบ Reddit

**Features:**
- แนวตั้ง (upvote ด้านบน, downvote ด้านล่าง)
- เปลี่ยนสีเมื่อ active (🟠 orange = upvote, 🔵 blue = downvote)
- แสดงจำนวน votes (รองรับ k สำหรับตัวเลข > 1000)
- Optimistic UI (อัปเดตทันทีก่อน API)

**การใช้งาน:**
```tsx
<VoteButtons
  votes={142}
  userVote="up"
  onVote={(vote) => handleVote(vote)}
  size="md"
/>
```

### 2. PostCard
การ์ดแสดงโพสต์แบบ Reddit

**Layout:**
```
┌─────────────────────────────────┐
│ [Vote] │ Author • เวลาที่ผ่านมา │
│  ▲    │ หัวข้อโพสต์            │
│ 142   │ เนื้อหาโพสต์...         │
│  ▼    │ [รูปภาพ]                │
│       │ #แท็ก1 #แท็ก2           │
│       │ 💬 23 แชร์ 💾 บันทึก   │
└─────────────────────────────────┘
```

**Features:**
- Vote buttons ด้านซ้าย
- แสดง author, timestamp
- รองรับรูปภาพ
- แสดงแท็ก
- Action buttons (comment, share, save)
- Hover effects

**การใช้งาน:**
```tsx
<PostCard
  post={postData}
  onVote={(postId, vote) => handleVote(postId, vote)}
  onCommentClick={(postId) => navigateToPost(postId)}
  onShareClick={(postId) => sharePost(postId)}
  onSaveClick={(postId) => savePost(postId)}
/>
```

### 3. PostFeed
แสดงรายการโพสต์

**Features:**
- วนแสดง PostCard
- Loading state
- Empty state พร้อมข้อความ
- รองรับ callbacks ทั้งหมด

**การใช้งาน:**
```tsx
<PostFeed
  posts={posts}
  onVote={handleVote}
  onCommentClick={handleCommentClick}
  isLoading={false}
/>
```

### 4. CreatePostForm
ฟอร์มสร้างโพสต์

**Features:**
- Validation (title และ content บังคับ)
- Character counter
- Tag management (เพิ่ม/ลบแท็ก)
- Loading state ขณะ submit
- Cancel button

**การใช้งาน:**
```tsx
<CreatePostForm
  onSubmit={(data) => createPost(data)}
  onCancel={() => router.back()}
/>
```

---

## 🗄️ Mock Data

### ตำแหน่ง
`lib/data/mock-posts.json`

### โครงสร้าง
```json
{
  "posts": [
    {
      "id": "1",
      "title": "หัวข้อโพสต์",
      "content": "เนื้อหา...",
      "author": {
        "id": "u1",
        "username": "thepthai",
        "displayName": "เทพไท ใจน้อม",
        "avatar": "/avatars/shadcn.jpg"
      },
      "votes": 142,
      "userVote": null,
      "commentCount": 23,
      "createdAt": "2025-01-10T08:30:00Z",
      "media": null,
      "tags": ["แท็ก1", "แท็ก2"]
    }
  ]
}
```

### ข้อมูลตัวอย่าง
Mock data มี 5 โพสต์:
1. โพสต์ต้อนรับ
2. สูตรอาหาร (พร้อมรูปภาพ)
3. ขอคำแนะนำท่องเที่ยว
4. แชร์ประสบการณ์เรียนโปรแกรม
5. ถาม-ตอบเรื่องเทคโนโลยี

---

## 💡 TypeScript Types

### Post Interface
```typescript
interface Post {
  id: string;
  title: string;
  content: string;
  author: User;
  votes: number;
  userVote: 'up' | 'down' | null;
  commentCount: number;
  createdAt: string;
  media?: Media[] | null;
  tags?: string[];
}
```

### User Interface
```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string | null;
}
```

### CreatePostData Interface
```typescript
interface CreatePostData {
  title: string;
  content: string;
  media?: File[];
  tags?: string[];
}
```

---

## 🎯 TODO / ฟีเจอร์ที่ยังไม่ได้ทำ

### Phase 1 (เสร็จแล้ว ✅)
- [x] PostCard component
- [x] VoteButtons component
- [x] CreatePostForm component
- [x] PostFeed component
- [x] หน้า /posts
- [x] หน้า /create-post
- [x] Mock data

### Phase 2 (ยังไม่ได้ทำ ⏳)
- [ ] Comment system
  - [ ] CommentCard component
  - [ ] CommentInput component
  - [ ] CommentSection component
  - [ ] Nested replies (recursive)
- [ ] Post Detail Page (`/posts/[id]`)
- [ ] API Integration
  - [ ] POST /api/posts (สร้างโพสต์)
  - [ ] GET /api/posts (ดึงโพสต์)
  - [ ] POST /api/posts/[id]/vote (โหวต)
- [ ] Image Upload
  - [ ] Upload component
  - [ ] Image preview
  - [ ] Cloudinary integration

### Phase 3 (Future)
- [ ] Real-time updates (Socket.io)
- [ ] Infinite scroll
- [ ] Search & Filter
- [ ] User profiles
- [ ] Notifications
- [ ] Rich text editor (TipTap)

---

## 🔧 การพัฒนาต่อ

### เพิ่ม API Integration

1. สร้าง API routes ใน `app/api/posts/route.ts`:
```typescript
export async function POST(request: Request) {
  const data = await request.json();
  // บันทึกลง database
  return Response.json({ success: true });
}
```

2. อัปเดต handlers ในหน้า:
```typescript
const handleSubmit = async (data: CreatePostData) => {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // ...
};
```

### เพิ่ม Comment System

ดูรายละเอียดใน `reddit-analysis.md` section "Comment Components"

---

## 🎨 UI/UX Features

- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode support
- ✅ Hover effects
- ✅ Loading states
- ✅ Empty states
- ✅ Optimistic UI (vote buttons)
- ✅ Form validation
- ✅ Thai language support
- ✅ Relative time (เช่น "2 ชั่วโมงที่แล้ว")

---

## 📦 Dependencies

```json
{
  "date-fns": "^4.1.0",         // สำหรับจัดการเวลา
  "lucide-react": "latest",      // ไอคอน
  "next": "16.0.1",             // Framework
  "react": "19.2.0",            // UI library
  "tailwindcss": "^4"           // CSS framework
}
```

---

## 🐛 Known Issues

1. **Image Upload** - ยังไม่ได้ implement จริง (แสดง placeholder)
2. **API Integration** - ยังใช้ mock data อยู่
3. **Comment System** - ยังไม่ได้สร้าง
4. **Real-time Updates** - ไม่มี WebSocket

---

## 🎓 เรียนรู้เพิ่มเติม

- [reddit-analysis.md](./reddit-analysis.md) - วิเคราะห์โครงสร้างระบบโดยละเอียด
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## ✅ สรุป

ระบบพร้อมใช้งานแล้ว! 🎉

**เริ่มต้นใช้งาน:**
```bash
npm run dev
```

จากนั้นไปที่ `http://localhost:3000/posts` เพื่อดูฟีดโพสต์

**หน้าที่พร้อมใช้งาน:**
- ✅ `/` - หน้าแรก
- ✅ `/posts` - ฟีดโพสต์
- ✅ `/create-post` - สร้างโพสต์

Happy coding! 🚀
