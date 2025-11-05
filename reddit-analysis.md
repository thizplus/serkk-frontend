# Reddit-like Social Platform Analysis

## 🎯 ภาพรวมระบบ

ระบบโซเชียลมีเดียแบบ Reddit ประกอบด้วย 5 ฟีเจอร์หลัก:
1. **Post** - การสร้างและแสดงโพสต์
2. **Comment** - การแสดงความคิดเห็น
3. **Reply** - การตอบกลับความคิดเห็น (nested comments)
4. **Like/Vote** - การโหวตโพสต์และความคิดเห็น (upvote/downvote)
5. **Share** - การแชร์โพสต์

---

## 📦 Components ที่ต้องสร้าง

### 1. Post Components

#### 1.1 `PostCard.tsx`
**หน้าที่:** แสดงโพสต์หลักในฟีด

**ประกอบด้วย:**
- Avatar และชื่อผู้โพสต์
- เวลาที่โพสต์
- ชื่อหัวข้อ (Title)
- เนื้อหา (Content/Body)
- รูปภาพ/วิดีโอ (ถ้ามี)
- จำนวน votes (upvote/downvote)
- จำนวน comments
- ปุ่ม actions (like, comment, share)

**Props:**
```typescript
interface PostCardProps {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
  }[];
  votes: number;
  commentCount: number;
  createdAt: Date;
  isLiked?: boolean;
}
```

#### 1.2 `CreatePostForm.tsx`
**หน้าที่:** ฟอร์มสำหรับสร้างโพสต์ใหม่

**ฟิลด์:**
- Title (required)
- Content/Body (rich text editor)
- Upload Media (รูป/วิดีโอ)
- Tags/Categories
- ปุ่ม Submit

**Props:**
```typescript
interface CreatePostFormProps {
  onSubmit: (data: PostData) => void;
  onCancel?: () => void;
}
```

#### 1.3 `PostDetail.tsx`
**หน้าที่:** แสดงโพสต์แบบเต็มพร้อม comments

**ประกอบด้วย:**
- PostCard (แบบเต็ม)
- CommentSection
- Share options

---

### 2. Comment Components

#### 2.1 `CommentCard.tsx`
**หน้าที่:** แสดงความคิดเห็นแต่ละรายการ

**ประกอบด้วย:**
- Avatar และชื่อผู้แสดงความคิดเห็น
- เนื้อหาความคิดเห็น
- เวลาที่แสดงความคิดเห็น
- จำนวน votes
- ปุ่ม Reply
- ปุ่ม Vote (up/down)
- Nested replies (recursive)

**Props:**
```typescript
interface CommentCardProps {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  votes: number;
  createdAt: Date;
  replies?: CommentCardProps[];
  depth: number; // ระดับความลึกของ comment
  onReply: (commentId: string, content: string) => void;
  onVote: (commentId: string, vote: 'up' | 'down') => void;
}
```

#### 2.2 `CommentSection.tsx`
**หน้าที่:** รวม comments ทั้งหมดของโพสต์

**ประกอบด้วย:**
- CommentInput (สำหรับแสดงความคิดเห็นใหม่)
- รายการ CommentCard (แสดงเป็น tree structure)
- ตัวเลือกการเรียงลำดับ (เช่น: ล่าสุด, ยอดนิยม)

**Props:**
```typescript
interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  onAddComment: (content: string) => void;
  sortBy?: 'latest' | 'popular';
}
```

#### 2.3 `CommentInput.tsx`
**หน้าที่:** Input สำหรับเขียน comment/reply

**ประกอบด้วย:**
- Textarea สำหรับเขียนข้อความ
- ปุ่ม Submit
- ปุ่ม Cancel (สำหรับ reply)
- แสดง preview (ถ้ามี markdown)

**Props:**
```typescript
interface CommentInputProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  parentId?: string; // สำหรับ reply
}
```

---

### 3. Interaction Components

#### 3.1 `VoteButtons.tsx`
**หน้าที่:** ปุ่ม upvote/downvote

**ประกอบด้วย:**
- ปุ่ม Upvote (▲)
- จำนวน votes
- ปุ่ม Downvote (▼)

**Props:**
```typescript
interface VoteButtonsProps {
  votes: number;
  userVote?: 'up' | 'down' | null;
  onVote: (vote: 'up' | 'down') => void;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
}
```

#### 3.2 `ShareButton.tsx`
**หน้าที่:** ปุ่มแชร์พร้อม menu

**ประกอบด้วย:**
- ไอคอนแชร์
- Dropdown menu (Copy link, Share to Facebook, Twitter, etc.)

**Props:**
```typescript
interface ShareButtonProps {
  postId: string;
  url: string;
  title: string;
  onShare?: (platform: string) => void;
}
```

#### 3.3 `ActionBar.tsx`
**หน้าที่:** แถบปุ่ม actions ของโพสต์

**ประกอบด้วย:**
- ปุ่ม Comment (พร้อมจำนวน)
- ปุ่ม Share
- ปุ่มอื่นๆ (Save, Report, etc.)

**Props:**
```typescript
interface ActionBarProps {
  commentCount: number;
  onCommentClick: () => void;
  onShareClick: () => void;
  isSaved?: boolean;
  onSaveClick?: () => void;
}
```

---

### 4. Layout Components

#### 4.1 `PostFeed.tsx`
**หน้าที่:** แสดงรายการโพสต์ในฟีด

**ประกอบด้วย:**
- รายการ PostCard
- Infinite scroll / Pagination
- Loading state
- Empty state

**Props:**
```typescript
interface PostFeedProps {
  posts: Post[];
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}
```

#### 4.2 `PostListItem.tsx`
**หน้าที่:** รูปแบบโพสต์แบบย่อในลิสต์

**ประกอบด้วย:**
- ข้อมูลย่อของโพสต์
- Thumbnail (ถ้ามี)
- Votes และ comment count
- เหมาะสำหรับแสดงในรายการ

---

## 🗂️ Data Structure

### Post Schema
```typescript
interface Post {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  media?: Media[];
  votes: number;
  userVote?: 'up' | 'down';
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isDeleted?: boolean;
}
```

### Comment Schema
```typescript
interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: User;
  content: string;
  votes: number;
  userVote?: 'up' | 'down';
  parentId?: string; // null = top-level comment
  replies?: Comment[]; // nested comments
  depth: number; // 0 = top-level
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}
```

### User Schema (simplified)
```typescript
interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  karma?: number; // Reddit-style score
}
```

### Media Schema
```typescript
interface Media {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}
```

---

## 🔄 Component Hierarchy

```
PostFeed
├── PostCard
│   ├── VoteButtons
│   ├── PostContent
│   ├── ActionBar
│   │   ├── CommentButton
│   │   └── ShareButton
│   └── PostMedia
│
PostDetail
├── PostCard (full version)
└── CommentSection
    ├── CommentInput
    └── CommentList
        └── CommentCard (recursive)
            ├── VoteButtons
            ├── CommentInput (for reply)
            └── CommentCard (nested replies)
```

---

## 🎨 UI/UX Considerations

### 1. Post Display
- **Compact View**: แสดงโพสต์แบบย่อในฟีด (thumbnail + title + metadata)
- **Card View**: แสดงโพสต์แบบการ์ด (full content preview)
- **Detail View**: แสดงโพสต์เต็มพร้อม comments

### 2. Comment Threading
- **Max Depth**: จำกัดระดับ nested comments (เช่น 5-7 levels)
- **Collapse/Expand**: สามารถย่อ/ขยาย comment threads
- **Continue Thread**: ปุ่ม "Continue this thread" สำหรับ deep comments

### 3. Voting System
- **Visual Feedback**: เปลี่ยนสีเมื่อ vote (upvote = orange, downvote = blue)
- **Immediate Update**: อัปเดตจำนวน votes ทันทีที่กด
- **Undo Vote**: กดซ้ำเพื่อยกเลิก vote

### 4. Responsive Design
- **Mobile**: Stack vertical, touch-friendly buttons
- **Desktop**: Horizontal layout, hover effects

---

## 📱 Pages ที่ต้องสร้าง

1. **Home/Feed Page** (`/`)
   - แสดง PostFeed
   - ตัวเลือกการกรอง (Hot, New, Top)

2. **Post Detail Page** (`/post/[id]`)
   - แสดง PostDetail
   - พร้อม CommentSection

3. **Create Post Page** (`/create-post`)
   - แสดง CreatePostForm

4. **User Profile** (`/user/[username]`)
   - แสดงโพสต์ของผู้ใช้
   - แสดงความคิดเห็นของผู้ใช้

---

## 🚀 Implementation Order (แนะนำ)

### Phase 1: Core Components
1. ✅ PostCard (basic)
2. ✅ VoteButtons
3. ✅ CreatePostForm (simple)

### Phase 2: Comments
4. ✅ CommentCard
5. ✅ CommentInput
6. ✅ CommentSection

### Phase 3: Interactions
7. ✅ ShareButton
8. ✅ ActionBar
9. ✅ Reply functionality (nested comments)

### Phase 4: Feed & Pages
10. ✅ PostFeed
11. ✅ PostDetail Page
12. ✅ Home Page

---

## 🛠️ Technical Stack (แนะนำ)

- **UI Components**: shadcn/ui (ที่ใช้อยู่แล้ว)
- **State Management**: React Context / Zustand / Redux
- **Data Fetching**: React Query / SWR
- **Rich Text Editor**: TipTap / Slate.js
- **Image Upload**: Next.js Image / Cloudinary
- **Real-time**: Socket.io (ถ้าต้องการ real-time updates)

---

## 📝 Notes

- ควรใช้ **Optimistic UI** สำหรับ voting และ commenting เพื่อ UX ที่ดีขึ้น
- ใช้ **Infinite Scroll** หรือ **Pagination** สำหรับฟีด
- เก็บ **draft** ของ post/comment ใน localStorage
- ใช้ **markdown** หรือ **rich text** สำหรับ content
- พิจารณา **rate limiting** สำหรับการสร้างโพสต์/comment
- ใช้ **debounce** สำหรับการกด vote หลายครั้ง

---

## 🎯 สรุป Components ที่ต้องสร้าง

### Post (4 components)
1. `PostCard.tsx` - การ์ดโพสต์
2. `CreatePostForm.tsx` - ฟอร์มสร้างโพสต์
3. `PostDetail.tsx` - หน้าโพสต์เต็ม
4. `PostFeed.tsx` - ฟีดรายการโพสต์

### Comment (3 components)
5. `CommentCard.tsx` - การ์ดความคิดเห็น
6. `CommentSection.tsx` - ส่วนแสดงความคิดเห็น
7. `CommentInput.tsx` - ช่องกรอกความคิดเห็น

### Interaction (3 components)
8. `VoteButtons.tsx` - ปุ่มโหวต
9. `ShareButton.tsx` - ปุ่มแชร์
10. `ActionBar.tsx` - แถบปุ่ม actions

**รวม: 10 Components หลัก**

---

## ✨ ขั้นตอนถัดไป

1. เริ่มสร้าง Components พื้นฐาน (PostCard, VoteButtons)
2. สร้าง mock data สำหรับทดสอบ
3. สร้าง API endpoints (หรือใช้ mock API ก่อน)
4. Implement state management
5. เพิ่ม features ทีละอย่าง

พร้อมเริ่มสร้างเมื่อไหร่ก็บอกได้เลยครับ! 🚀
