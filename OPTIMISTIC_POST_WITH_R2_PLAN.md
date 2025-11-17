# Optimistic Post System with R2 - Implementation Plan

> แผนการสร้างระบบโพสต์แบบ Optimistic UI ด้วย R2 ที่มีอยู่แล้ว
>
> **เป้าหมาย:** กด Post ได้ทันที → แสดง progress → เสร็จอัตโนมัติ
>
> **สร้างเมื่อ:** 2025-11-16

---

## 🎯 ความต้องการหลัก

### ✅ Must Have:
1. **กด Post ได้ทันที** - ไม่ต้องรอ upload เสร็จ
2. **แสดง preview พร้อม progress** - user เห็นว่ากำลังอัปโหลด X%
3. **Upload background** - ทำงานต่อแม้ออกจากหน้า create post
4. **Auto-update** - เมื่อ upload เสร็จ temp post → real post
5. **Error handling** - แสดงชัดเจนถ้า upload ล้มเหลว

### 🚫 ข้อจำกัด:
- ใช้ R2 ที่มีอยู่เท่านั้น (Presigned URL + Direct Upload)
- ไม่มี Service Worker (ปิด tab = upload หยุด)
- ไม่มี Chunked Upload (ไฟล์ใหญ่มาก อาจ timeout)
- ไม่มี IndexedDB (ปิด browser = draft หาย - Phase 2 ค่อยทำ)

---

## 📊 Flow Diagram

### **User Journey:**

```
┌────────────────────────────────────────────────────────────┐
│                   Optimistic Post Flow                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  1. User เลือกไฟล์ (3 รูป, 15MB)                           │
│     └─→ แสดง preview ด้วย blob URL                        │
│                                                            │
│  2. User พิมพ์ title/content/tags                          │
│     └─→ (ยังไม่ upload อะไร)                               │
│                                                            │
│  3. User กด "โพสต์" ✅                                      │
│     ├─→ สร้าง temp post ทันที                             │
│     │   └─→ {                                             │
│     │         id: 'temp-abc123',                           │
│     │         status: 'uploading',                         │
│     │         uploadProgress: 0                            │
│     │       }                                              │
│     │                                                      │
│     ├─→ Redirect ไป home ทันที!                           │
│     │                                                      │
│     └─→ เริ่ม upload in background                        │
│         ├─→ File 1: 0% → 50% → 100% ✅                     │
│         ├─→ File 2: 0% → 50% → 100% ✅                     │
│         └─→ File 3: 0% → 50% → 100% ✅                     │
│                                                            │
│  4. Upload เสร็จ (mediaIds: ['m1', 'm2', 'm3'])            │
│     └─→ POST /api/posts {                                  │
│           idempotencyKey: 'abc123',                        │
│           clientPostId: 'temp-abc123',                     │
│           mediaIds: ['m1', 'm2', 'm3']                     │
│         }                                                  │
│                                                            │
│  5. API response                                           │
│     └─→ {                                                  │
│           id: 'post-xyz789',  // real post ID              │
│           status: 'published'                              │
│         }                                                  │
│                                                            │
│  6. Replace temp post → real post                          │
│     └─→ temp post หายไป                                   │
│         real post ปรากฏแทน                                 │
│                                                            │
│  ✅ User เห็นโพสต์ใน feed ตั้งแต่ step 3!                  │
│     (แต่มี badge "กำลังอัปโหลด 65%...")                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture Design

### **Frontend Stack:**

```typescript
┌─────────────────────────────────────────────────────┐
│                 Frontend Architecture               │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. Zustand Store (optimisticPostStore.ts)         │
│     ├─→ optimisticPosts: TempPost[]                │
│     ├─→ addOptimisticPost()                        │
│     ├─→ updateProgress()                           │
│     ├─→ markComplete()                             │
│     └─→ markFailed()                               │
│                                                     │
│  2. Upload Manager (concurrentUpload.ts)           │
│     ├─→ uploadMultipleFiles() - ใช้ที่มีอยู่แล้ว  │
│     ├─→ onProgress → update Zustand                │
│     └─→ onComplete → create real post              │
│                                                     │
│  3. React Query                                     │
│     ├─→ useCreatePost() - POST /api/posts          │
│     └─→ invalidateQueries(['posts']) - refresh     │
│                                                     │
│  4. UI Components                                   │
│     ├─→ TempPostCard - แสดง temp post + progress  │
│     ├─→ ProgressBar - แสดง upload %                │
│     └─→ ErrorBanner - แสดง error + retry           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 💾 Data Model

### **TempPost Schema:**

```typescript
interface TempPost {
  // Identity
  tempId: string;          // 'temp-{uuid}'
  clientPostId: string;    // เดียวกับ tempId (สำหรับ idempotency)

  // Content
  title: string;
  content: string;
  tags: string[];

  // Author
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };

  // Media (blob URLs for preview)
  media: Array<{
    file: File;            // ไฟล์ต้นฉบับ
    preview: string;       // blob URL สำหรับแสดง
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
    uploadProgress: number; // 0-100
    mediaId?: string;      // เมื่อ upload เสร็จ
    url?: string;          // R2 URL
    error?: string;
  }>;

  // Status
  status: 'uploading' | 'creating' | 'completed' | 'failed';
  uploadProgress: number;  // overall progress (0-100)

  // Metadata
  createdAt: Date;
  error?: string;
}
```

---

## 🔄 State Machine

### **Post States:**

```
┌──────────┐
│uploading │ ← กำลัง upload files
└────┬─────┘
     │
     ├─ All files uploaded ──→ ┌──────────┐
     │                         │ creating │ ← กำลังสร้าง post (API call)
     │                         └────┬─────┘
     │                              │
     │                              ├─ Success ──→ ┌───────────┐
     │                              │              │ completed │
     │                              │              └───────────┘
     │                              │
     │                              └─ Failed ──→ ┌────────┐
     │                                            │ failed │
     │                                            └────────┘
     │
     └─ Upload failed ──→ ┌────────┐
                          │ failed │
                          └────────┘
```

---

## 📝 Implementation Steps

### **Phase 1: Core Optimistic UI (3-5 วัน)**

#### **Day 1-2: Zustand Store Setup**

```typescript
// src/features/posts/stores/optimisticPostStore.ts

interface OptimisticPostStore {
  optimisticPosts: TempPost[];

  // Actions
  addOptimisticPost: (data: CreateOptimisticPostData) => string; // return tempId
  updateUploadProgress: (tempId: string, fileIndex: number, progress: number) => void;
  markUploadComplete: (tempId: string, fileIndex: number, mediaId: string, url: string) => void;
  markUploadFailed: (tempId: string, fileIndex: number, error: string) => void;
  markPostComplete: (tempId: string, realPostId: string) => void;
  markPostFailed: (tempId: string, error: string) => void;
  removeOptimisticPost: (tempId: string) => void;

  // Getters
  getOptimisticPost: (tempId: string) => TempPost | undefined;
  getAllOptimisticPosts: () => TempPost[];
}

export const useOptimisticPostStore = create<OptimisticPostStore>((set, get) => ({
  optimisticPosts: [],

  addOptimisticPost: (data) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36)}`;

    const tempPost: TempPost = {
      tempId,
      clientPostId: tempId,
      title: data.title,
      content: data.content,
      tags: data.tags,
      author: data.author,
      media: data.mediaFiles.map(f => ({
        file: f.file,
        preview: f.preview,
        uploadStatus: 'pending',
        uploadProgress: 0,
      })),
      status: 'uploading',
      uploadProgress: 0,
      createdAt: new Date(),
    };

    set(state => ({
      optimisticPosts: [tempPost, ...state.optimisticPosts]
    }));

    return tempId;
  },

  updateUploadProgress: (tempId, fileIndex, progress) => {
    set(state => ({
      optimisticPosts: state.optimisticPosts.map(post => {
        if (post.tempId !== tempId) return post;

        const updatedMedia = [...post.media];
        updatedMedia[fileIndex] = {
          ...updatedMedia[fileIndex],
          uploadStatus: 'uploading',
          uploadProgress: progress,
        };

        // Calculate overall progress
        const totalProgress = updatedMedia.reduce((sum, m) => sum + m.uploadProgress, 0);
        const overallProgress = Math.round(totalProgress / updatedMedia.length);

        return {
          ...post,
          media: updatedMedia,
          uploadProgress: overallProgress,
        };
      })
    }));
  },

  markUploadComplete: (tempId, fileIndex, mediaId, url) => {
    set(state => ({
      optimisticPosts: state.optimisticPosts.map(post => {
        if (post.tempId !== tempId) return post;

        const updatedMedia = [...post.media];
        updatedMedia[fileIndex] = {
          ...updatedMedia[fileIndex],
          uploadStatus: 'completed',
          uploadProgress: 100,
          mediaId,
          url,
        };

        return {
          ...post,
          media: updatedMedia,
        };
      })
    }));
  },

  // ... other methods
}));
```

---

#### **Day 2-3: Upload Hook Integration**

```typescript
// src/features/posts/hooks/useOptimisticPost.ts

export function useOptimisticPost() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const addOptimisticPost = useOptimisticPostStore(s => s.addOptimisticPost);
  const updateUploadProgress = useOptimisticPostStore(s => s.updateUploadProgress);
  const markUploadComplete = useOptimisticPostStore(s => s.markUploadComplete);
  const markUploadFailed = useOptimisticPostStore(s => s.markUploadFailed);
  const markPostComplete = useOptimisticPostStore(s => s.markPostComplete);
  const markPostFailed = useOptimisticPostStore(s => s.markPostFailed);

  const createOptimisticPost = async (data: {
    title: string;
    content: string;
    tags: string[];
    mediaFiles: Array<{ file: File; preview: string }>;
  }) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบ');
      return null;
    }

    // 1. สร้าง temp post ทันที
    const tempId = addOptimisticPost({
      title: data.title,
      content: data.content,
      tags: data.tags,
      author: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      mediaFiles: data.mediaFiles,
    });

    // 2. Toast + Redirect ทันที
    toast.success('กำลังโพสต์...');
    router.push('/');

    // 3. Upload in background (async, no await!)
    uploadInBackground(tempId, data);

    return tempId;
  };

  const uploadInBackground = async (
    tempId: string,
    data: {
      title: string;
      content: string;
      tags: string[];
      mediaFiles: Array<{ file: File; preview: string }>;
    }
  ) => {
    try {
      const files = data.mediaFiles.map(m => m.file);

      // Upload files with progress tracking
      const uploadResult = await uploadMultipleFiles(files, {
        concurrency: FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS,
        onProgress: (progress) => {
          // Update progress for each file
          updateUploadProgress(tempId, progress.fileIndex, progress.progress);

          if (progress.status === 'completed') {
            markUploadComplete(
              tempId,
              progress.fileIndex,
              progress.mediaId!,
              progress.url!
            );
          } else if (progress.status === 'failed') {
            markUploadFailed(tempId, progress.fileIndex, progress.error || 'Upload failed');
          }
        },
      });

      // Check if any files uploaded successfully
      const successfulUploads = uploadResult.results.filter(r => r.status === 'completed');

      if (successfulUploads.length === 0) {
        throw new Error('ไม่มีไฟล์ที่อัปโหลดสำเร็จ');
      }

      const mediaIds = successfulUploads.map(r => r.mediaId!);

      // 4. Create real post
      const response = await postService.create({
        title: data.title,
        content: data.content,
        tags: data.tags,
        mediaIds,
        idempotencyKey: tempId,      // ✅ ใช้ tempId เป็น idempotency key
        clientPostId: tempId,         // ✅ ส่ง clientPostId
      });

      if (!response.success) {
        throw new Error(response.message || 'สร้างโพสต์ล้มเหลว');
      }

      // 5. Mark complete & invalidate queries
      markPostComplete(tempId, response.data.id);
      queryClient.invalidateQueries({ queryKey: ['posts'] });

      toast.success('โพสต์สำเร็จ!');
    } catch (error) {
      console.error('Post creation failed:', error);

      const errorMessage = error instanceof Error
        ? error.message
        : 'การสร้างโพสต์ล้มเหลว';

      markPostFailed(tempId, errorMessage);
      toast.error(errorMessage);
    }
  };

  return {
    createOptimisticPost,
  };
}
```

---

#### **Day 3-4: UI Components**

```typescript
// src/features/posts/components/TempPostCard.tsx

interface TempPostCardProps {
  post: TempPost;
}

export function TempPostCard({ post }: TempPostCardProps) {
  const retry = useRetryOptimisticPost();
  const remove = useOptimisticPostStore(s => s.removeOptimisticPost);

  return (
    <Card className="relative">
      {/* Upload Progress Overlay */}
      {post.status === 'uploading' && (
        <div className="absolute top-0 left-0 right-0 bg-blue-500/10 p-2 border-b">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>กำลังอัปโหลด {post.uploadProgress}%</span>
          </div>
          <Progress value={post.uploadProgress} className="mt-1 h-1" />
        </div>
      )}

      {/* Failed State */}
      {post.status === 'failed' && (
        <div className="absolute top-0 left-0 right-0 bg-red-500/10 p-2 border-b">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>{post.error || 'อัปโหลดล้มเหลว'}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => retry(post.tempId)}>
                ลองใหม่
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(post.tempId)}>
                ลบ
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Post Content */}
      <CardContent className={post.status === 'uploading' || post.status === 'failed' ? 'pt-14' : ''}>
        <PostHeader author={post.author} createdAt={post.createdAt} />

        <div className="mt-3">
          <h3 className="font-semibold">{post.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Media Preview (with blob URLs) */}
        {post.media.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {post.media.map((media, i) => (
              <div key={i} className="relative aspect-video rounded overflow-hidden bg-muted">
                <img
                  src={media.preview}
                  alt=""
                  className="w-full h-full object-cover"
                />

                {/* Per-file Progress */}
                {media.uploadStatus === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-sm">
                      {media.uploadProgress}%
                    </div>
                  </div>
                )}

                {/* Per-file Error */}
                {media.uploadStatus === 'failed' && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                )}

                {/* Per-file Success */}
                {media.uploadStatus === 'completed' && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary">#{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

#### **Day 4-5: Feed Integration**

```typescript
// app/page.tsx (Home Feed)

export default function HomePage() {
  const { data: posts } = usePosts();
  const optimisticPosts = useOptimisticPostStore(s => s.getAllOptimisticPosts());

  // Merge optimistic posts with real posts
  const allPosts = useMemo(() => {
    const realPosts = posts?.pages.flatMap(p => p.posts) || [];

    // Filter out completed optimistic posts (already in real posts)
    const activeOptimisticPosts = optimisticPosts.filter(
      p => p.status !== 'completed'
    );

    // Sort by createdAt (newest first)
    return [...activeOptimisticPosts, ...realPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts, optimisticPosts]);

  return (
    <AppLayout>
      <PageWrap>
        <div className="space-y-4">
          {allPosts.map(post => {
            // Check if it's a temp post
            if ('tempId' in post) {
              return <TempPostCard key={post.tempId} post={post} />;
            }

            // Real post
            return <PostCard key={post.id} post={post} />;
          })}
        </div>
      </PageWrap>
    </AppLayout>
  );
}
```

---

#### **Day 5: CreatePostForm Integration**

```typescript
// src/features/posts/components/CreatePostForm.tsx

export function CreatePostForm({ onSubmit, onCancel }: Props) {
  const { createOptimisticPost } = useOptimisticPost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      return;
    }

    try {
      // ✅ Call optimistic post hook
      await createOptimisticPost({
        title: title.trim(),
        content: content.trim(),
        tags,
        mediaFiles: selectedFiles.map(f => ({
          file: f,
          preview: URL.createObjectURL(f),
        })),
      });

      // Clear form
      setTitle('');
      setContent('');
      setTags([]);
      setSelectedFiles([]);

      // Redirect happens in the hook!
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('สร้างโพสต์ล้มเหลว');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields... */}

      <Button type="submit" disabled={isSubmitting}>
        โพสต์
      </Button>
    </form>
  );
}
```

---

### **Phase 2: Enhancements (Optional - 2-3 วัน)**

#### **Features to Add:**

1. **Draft Auto-save (localStorage)**
   - Save every 3 seconds
   - Load on mount
   - Clear on successful post

2. **Retry Mechanism**
   - Auto-retry (3 times) for network errors
   - Manual retry button for failed posts
   - Exponential backoff

3. **Cleanup Policy**
   - Remove completed temp posts after 5 seconds
   - Remove failed temp posts after 1 hour
   - Revoke blob URLs on cleanup

4. **Better Error Messages**
   - Network error: "ปัญหาการเชื่อมต่อ กรุณาลองใหม่"
   - File too large: "ไฟล์ใหญ่เกินกำหนด"
   - Upload timeout: "อัปโหลดใช้เวลานานเกินไป"

---

## 🔧 Backend Requirements

### **ต้องเพิ่ม/แก้ไข:**

#### **1. Idempotency Key Support**

```typescript
// POST /api/v1/posts

interface CreatePostRequest {
  // ✅ เพิ่ม 2 fields นี้
  idempotencyKey: string;      // UUID หรือ client-generated key
  clientPostId: string;        // temp post ID จาก frontend

  // ส่วนเดิม
  title: string;
  content: string;
  mediaIds?: string[];
  tags?: string[];
}
```

**Implementation:**

```typescript
// Backend (Node.js/Express example)

app.post('/api/v1/posts', async (req, res) => {
  const { idempotencyKey, clientPostId, title, content, mediaIds, tags } = req.body;

  // 1. ✅ Check idempotency key
  const cachedResponse = await redisClient.get(`idempotency:${idempotencyKey}`);
  if (cachedResponse) {
    return res.json(JSON.parse(cachedResponse)); // Return cached response
  }

  // 2. ✅ Check client post ID (prevent duplicates)
  const existingPost = await db.posts.findOne({ clientPostId });
  if (existingPost) {
    return res.json({
      success: true,
      data: existingPost,
      message: 'Post already exists'
    });
  }

  // 3. Create post
  const post = await db.posts.create({
    title,
    content,
    mediaIds,
    tags,
    clientPostId,        // ✅ Save client post ID
    authorId: req.user.id,
    createdAt: new Date(),
  });

  // 4. Cache response (24 hours)
  const response = { success: true, data: post };
  await redisClient.setex(`idempotency:${idempotencyKey}`, 86400, JSON.stringify(response));

  res.json(response);
});
```

---

#### **2. Database Schema Changes**

```sql
-- ✅ เพิ่ม column ใน posts table
ALTER TABLE posts
ADD COLUMN client_post_id VARCHAR(255) UNIQUE;

-- ✅ เพิ่ม index สำหรับ performance
CREATE INDEX idx_posts_client_post_id ON posts(client_post_id);

-- ✅ เพิ่มตาราง idempotency_keys (ถ้าไม่ใช้ Redis)
CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  response_body TEXT NOT NULL,
  status_code INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
```

---

#### **3. Cleanup Job (Optional)**

```typescript
// ทำงานทุก 1 ชั่วโมง: ลบ idempotency keys ที่หมดอายุ

async function cleanupExpiredIdempotencyKeys() {
  await db.idempotencyKeys.deleteMany({
    expiresAt: { $lt: new Date() }
  });

  console.log('Cleaned up expired idempotency keys');
}

// Schedule
setInterval(cleanupExpiredIdempotencyKeys, 60 * 60 * 1000); // Every hour
```

---

## 📊 Summary

### **Frontend Changes:**

| File | Status | Description |
|------|--------|-------------|
| `stores/optimisticPostStore.ts` | 🆕 New | Zustand store สำหรับ temp posts |
| `hooks/useOptimisticPost.ts` | 🆕 New | Hook สำหรับสร้าง optimistic post |
| `components/TempPostCard.tsx` | 🆕 New | UI แสดง temp post + progress |
| `components/CreatePostForm.tsx` | ✏️ Edit | เชื่อม useOptimisticPost |
| `app/page.tsx` | ✏️ Edit | Merge temp posts กับ real posts |
| `services/post.service.ts` | ✏️ Edit | เพิ่ม idempotencyKey + clientPostId |

---

### **Backend Changes:**

| Change | Priority | Effort |
|--------|----------|--------|
| รองรับ `idempotencyKey` | 🔥 P0 | 1 วัน |
| รองรับ `clientPostId` | 🔥 P0 | 1 วัน |
| เพิ่ม column `client_post_id` | 🔥 P0 | 30 นาที |
| ตรวจสอบ duplicate posts | 🔥 P0 | 2 ชั่วโมง |
| Cleanup job | 🟡 P1 | 1 ชั่วโมง |

**รวมเวลา Backend:** ~2-3 วัน

---

## ⚠️ Limitations & Trade-offs

### **ข้อจำกัด:**

1. **ปิด tab = upload หยุด**
   - ✅ Fix: ใช้ Service Worker (Phase 3)

2. **ไฟล์ใหญ่มาก (500MB+) อาจ timeout**
   - ✅ Fix: ใช้ Chunked Upload (Phase 3)

3. **Refresh browser = temp post หาย**
   - ✅ Fix: ใช้ IndexedDB (Phase 2)

4. **ไม่มี cross-device sync**
   - ✅ Fix: Cloud draft sync (Phase 3)

---

### **Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| **Optimistic UI (ที่เลือก)** | ✅ UX ดีที่สุด<br>✅ ไม่ต้องรอ<br>✅ เห็นโพสต์ทันที | ❌ Upload ต่อไม่ได้ถ้าปิด tab<br>❌ ซับซ้อนกว่า |
| **Anticipatory Upload** | ✅ กด Post เสร็จเร็ว<br>✅ Code ง่ายกว่า | ❌ ต้องรอ upload เสร็จก่อน Post<br>❌ ไม่ใช่ Optimistic UI |

---

## 🚀 Timeline

### **Phase 1: Core Optimistic UI**
- **Day 1-2:** Zustand store + data model
- **Day 3:** Upload integration
- **Day 4:** UI components
- **Day 5:** Testing + bug fixes
- **Backend:** 2-3 วัน (parallel)

**Total: 1 สัปดาห์ (Frontend + Backend พร้อมกัน)**

---

### **Phase 2: Persistence & Recovery (2-3 วัน)**

#### **เป้าหมาย:**
- ✅ Temp posts ไม่หายแม้ refresh browser
- ✅ Draft auto-save แบบ persistent
- ✅ Auto-retry สำหรับ network errors
- ✅ Cleanup policy เพื่อไม่ให้ storage โต

---

#### **2.1 IndexedDB Setup (Day 1)**

**Install Dexie.js:**
```bash
npm install dexie
```

**Database Schema:**
```typescript
// src/lib/db/postDraftsDB.ts

import Dexie, { Table } from 'dexie';

interface DraftPost {
  id: string;                    // draft ID
  title: string;
  content: string;
  tags: string[];
  fileIds: string[];             // references to files table
  createdAt: Date;
  updatedAt: Date;
}

interface StoredFile {
  id: string;                    // file ID
  name: string;
  type: string;
  size: number;
  blob: Blob;                    // ไฟล์ต้นฉบับ
  thumbnail?: Blob;              // thumbnail (optional)
  createdAt: Date;
}

interface TempPostRecord {
  tempId: string;                // temp post ID
  title: string;
  content: string;
  tags: string[];
  authorId: string;
  media: Array<{
    fileId: string;              // reference to files table
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed';
    uploadProgress: number;
    mediaId?: string;            // R2 media ID (เมื่ออัปโหลดเสร็จ)
    url?: string;
    error?: string;
  }>;
  status: 'uploading' | 'creating' | 'completed' | 'failed';
  uploadProgress: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

class PostDraftsDB extends Dexie {
  drafts!: Table<DraftPost, string>;
  files!: Table<StoredFile, string>;
  tempPosts!: Table<TempPostRecord, string>;

  constructor() {
    super('PostDraftsDB');

    this.version(1).stores({
      drafts: 'id, updatedAt',
      files: 'id, name, createdAt',
      tempPosts: 'tempId, status, createdAt, updatedAt'
    });
  }
}

export const db = new PostDraftsDB();
```

---

#### **2.2 Persist Temp Posts (Day 1-2)**

**Update Zustand Store to use IndexedDB:**

```typescript
// stores/optimisticPostStore.ts

export const useOptimisticPostStore = create<OptimisticPostStore>((set, get) => ({
  optimisticPosts: [],
  isLoaded: false,

  // ✅ Load from IndexedDB on mount
  loadFromDB: async () => {
    try {
      const tempPosts = await db.tempPosts
        .where('status')
        .notEqual('completed')
        .toArray();

      // Convert to TempPost format
      const posts: TempPost[] = await Promise.all(
        tempPosts.map(async (record) => {
          // Load file blobs
          const mediaWithBlobs = await Promise.all(
            record.media.map(async (m) => {
              const file = await db.files.get(m.fileId);
              if (!file) return null;

              return {
                file: new File([file.blob], file.name, { type: file.type }),
                preview: URL.createObjectURL(file.blob),
                uploadStatus: m.uploadStatus,
                uploadProgress: m.uploadProgress,
                mediaId: m.mediaId,
                url: m.url,
                error: m.error,
              };
            })
          );

          return {
            tempId: record.tempId,
            clientPostId: record.tempId,
            title: record.title,
            content: record.content,
            tags: record.tags,
            author: await getAuthorInfo(record.authorId),
            media: mediaWithBlobs.filter(Boolean) as any,
            status: record.status,
            uploadProgress: record.uploadProgress,
            error: record.error,
            createdAt: record.createdAt,
          };
        })
      );

      set({ optimisticPosts: posts, isLoaded: true });
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      set({ isLoaded: true });
    }
  },

  addOptimisticPost: async (data) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36)}`;

    // Store files in IndexedDB
    const fileIds = await Promise.all(
      data.mediaFiles.map(async (mediaFile) => {
        const fileId = `file-${Date.now()}-${Math.random().toString(36)}`;
        await db.files.add({
          id: fileId,
          name: mediaFile.file.name,
          type: mediaFile.file.type,
          size: mediaFile.file.size,
          blob: mediaFile.file,
          createdAt: new Date(),
        });
        return fileId;
      })
    );

    const tempPost: TempPost = {
      // ... same as before
    };

    // ✅ Save to IndexedDB
    await db.tempPosts.add({
      tempId,
      title: data.title,
      content: data.content,
      tags: data.tags,
      authorId: data.author.id,
      media: tempPost.media.map((m, i) => ({
        fileId: fileIds[i],
        uploadStatus: m.uploadStatus,
        uploadProgress: m.uploadProgress,
      })),
      status: 'uploading',
      uploadProgress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    set(state => ({
      optimisticPosts: [tempPost, ...state.optimisticPosts]
    }));

    return tempId;
  },

  updateUploadProgress: async (tempId, fileIndex, progress) => {
    // Update in memory
    set(state => ({
      optimisticPosts: state.optimisticPosts.map(post => {
        if (post.tempId !== tempId) return post;
        // ... update logic
        return updatedPost;
      })
    }));

    // ✅ Update in IndexedDB
    await db.tempPosts.update(tempId, {
      [`media.${fileIndex}.uploadProgress`]: progress,
      updatedAt: new Date(),
    });
  },

  // ... other methods with IndexedDB sync
}));
```

**Load on App Mount:**
```typescript
// app/layout.tsx or app/providers.tsx

export function Providers({ children }: { children: React.ReactNode }) {
  const loadFromDB = useOptimisticPostStore(s => s.loadFromDB);

  useEffect(() => {
    loadFromDB();
  }, []);

  return <>{children}</>;
}
```

---

#### **2.3 Draft Auto-save (Day 2)**

```typescript
// src/features/posts/hooks/useDraftAutoSave.ts

interface DraftData {
  title: string;
  content: string;
  tags: string[];
  files: File[];
}

export function useDraftAutoSave(formData: DraftData) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    try {
      // Get latest draft
      const drafts = await db.drafts
        .orderBy('updatedAt')
        .reverse()
        .limit(1)
        .toArray();

      if (drafts.length === 0) return;

      const draft = drafts[0];

      // Check age (delete if > 24 hours)
      const age = Date.now() - draft.updatedAt.getTime();
      if (age > 24 * 60 * 60 * 1000) {
        await db.drafts.delete(draft.id);
        return;
      }

      // Ask user to restore
      const shouldRestore = window.confirm(
        `พบ draft ที่บันทึกไว้เมื่อ ${new Date(draft.updatedAt).toLocaleString('th-TH')}\n\nต้องการกู้คืนหรือไม่?`
      );

      if (!shouldRestore) {
        await db.drafts.delete(draft.id);
        return;
      }

      // Load files from IndexedDB
      const files = await Promise.all(
        draft.fileIds.map(async (fileId) => {
          const storedFile = await db.files.get(fileId);
          if (!storedFile) return null;

          return new File([storedFile.blob], storedFile.name, {
            type: storedFile.type
          });
        })
      );

      // Update form (callback to parent component)
      onRestoreDraft({
        title: draft.title,
        content: draft.content,
        tags: draft.tags,
        files: files.filter(Boolean) as File[],
      });

      setDraftId(draft.id);
      toast.success('กู้คืน draft สำเร็จ');
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  // Auto-save every 3 seconds
  useEffect(() => {
    if (!formData.title && !formData.content && formData.files.length === 0) {
      return; // Nothing to save
    }

    const timer = setTimeout(async () => {
      await saveDraft();
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData.title, formData.content, formData.tags, formData.files]);

  const saveDraft = async () => {
    try {
      // Save files to IndexedDB
      const fileIds = await Promise.all(
        formData.files.map(async (file) => {
          const fileId = `file-${Date.now()}-${Math.random().toString(36)}`;

          // Check if already exists
          const existing = await db.files
            .where('name')
            .equals(file.name)
            .and(f => f.size === file.size)
            .first();

          if (existing) return existing.id;

          await db.files.add({
            id: fileId,
            name: file.name,
            type: file.type,
            size: file.size,
            blob: file,
            createdAt: new Date(),
          });

          return fileId;
        })
      );

      // Save or update draft
      const draft: DraftPost = {
        id: draftId || `draft-${Date.now()}`,
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        fileIds,
        createdAt: draftId ? (await db.drafts.get(draftId))!.createdAt : new Date(),
        updatedAt: new Date(),
      };

      if (draftId) {
        await db.drafts.update(draftId, draft);
      } else {
        await db.drafts.add(draft);
        setDraftId(draft.id);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const clearDraft = async () => {
    if (!draftId) return;

    try {
      const draft = await db.drafts.get(draftId);
      if (draft) {
        // Delete associated files
        await Promise.all(
          draft.fileIds.map(fileId => db.files.delete(fileId))
        );

        // Delete draft
        await db.drafts.delete(draftId);
      }

      setDraftId(null);
      setLastSaved(null);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  return {
    lastSaved,
    clearDraft,
  };
}
```

---

#### **2.4 Auto-Retry Mechanism (Day 2-3)**

```typescript
// src/lib/upload/uploadWithRetry.ts

interface RetryOptions {
  maxRetries?: number;           // default: 3
  baseDelay?: number;            // default: 1000ms
  maxDelay?: number;             // default: 30000ms
  shouldRetry?: (error: Error) => boolean;
}

export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    shouldRetry = (error) => {
      // Retry for network errors and 5xx errors
      return (
        error.message.includes('Network') ||
        error.message.includes('timeout') ||
        error.message.includes('500') ||
        error.message.includes('502') ||
        error.message.includes('503')
      );
    },
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if not a retryable error
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Calculate delay (exponential backoff with jitter)
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = exponentialDelay + jitter;

      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

**Usage:**
```typescript
// In uploadInBackground function

const uploadResult = await uploadWithRetry(
  () => uploadMultipleFiles(files, {
    concurrency: FORM_LIMITS.MEDIA.CONCURRENT_UPLOADS,
    onProgress: (progress) => {
      // ...
    },
  }),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
  }
);
```

---

#### **2.5 Cleanup Policy (Day 3)**

```typescript
// src/lib/cleanup/cleanupPolicy.ts

export async function cleanupOldData() {
  const now = Date.now();

  // 1. Clean up completed temp posts (> 5 seconds old)
  const completedPosts = await db.tempPosts
    .where('status')
    .equals('completed')
    .toArray();

  for (const post of completedPosts) {
    const age = now - post.updatedAt.getTime();
    if (age > 5000) { // 5 seconds
      await cleanupTempPost(post.tempId);
    }
  }

  // 2. Clean up failed temp posts (> 1 hour old)
  const failedPosts = await db.tempPosts
    .where('status')
    .equals('failed')
    .toArray();

  for (const post of failedPosts) {
    const age = now - post.updatedAt.getTime();
    if (age > 60 * 60 * 1000) { // 1 hour
      await cleanupTempPost(post.tempId);
    }
  }

  // 3. Clean up old drafts (> 30 days)
  const oldDrafts = await db.drafts
    .where('updatedAt')
    .below(new Date(now - 30 * 24 * 60 * 60 * 1000))
    .toArray();

  for (const draft of oldDrafts) {
    await cleanupDraft(draft.id);
  }

  // 4. Clean up orphaned files (not referenced by any draft or temp post)
  await cleanupOrphanedFiles();

  console.log('Cleanup completed');
}

async function cleanupTempPost(tempId: string) {
  const post = await db.tempPosts.get(tempId);
  if (!post) return;

  // Delete associated files
  await Promise.all(
    post.media.map(m => db.files.delete(m.fileId))
  );

  // Delete temp post
  await db.tempPosts.delete(tempId);

  // Remove from Zustand store
  useOptimisticPostStore.getState().removeOptimisticPost(tempId);
}

async function cleanupDraft(draftId: string) {
  const draft = await db.drafts.get(draftId);
  if (!draft) return;

  // Delete associated files
  await Promise.all(
    draft.fileIds.map(fileId => db.files.delete(fileId))
  );

  // Delete draft
  await db.drafts.delete(draftId);
}

async function cleanupOrphanedFiles() {
  const allFiles = await db.files.toArray();
  const referencedFileIds = new Set<string>();

  // Collect referenced file IDs from drafts
  const drafts = await db.drafts.toArray();
  drafts.forEach(draft => {
    draft.fileIds.forEach(id => referencedFileIds.add(id));
  });

  // Collect referenced file IDs from temp posts
  const tempPosts = await db.tempPosts.toArray();
  tempPosts.forEach(post => {
    post.media.forEach(m => referencedFileIds.add(m.fileId));
  });

  // Delete orphaned files
  const orphanedFiles = allFiles.filter(f => !referencedFileIds.has(f.id));
  await Promise.all(
    orphanedFiles.map(f => db.files.delete(f.id))
  );

  console.log(`Cleaned up ${orphanedFiles.length} orphaned files`);
}

// Run cleanup every 5 minutes
setInterval(cleanupOldData, 5 * 60 * 1000);
```

---

**Phase 2 Summary:**
- ✅ Temp posts persist across refresh
- ✅ Draft auto-save ทุก 3 วินาที
- ✅ Auto-retry สำหรับ network errors
- ✅ Cleanup policy ป้องกัน storage โต

**Total: 2-3 วัน**

---

### **Phase 3: Advanced Features (3-4 สัปดาห์)**

#### **เป้าหมาย:**
- ✅ Upload ต่อได้แม้ปิด tab (Service Worker)
- ✅ Resume upload สำหรับไฟล์ใหญ่ (Chunked Upload)
- ✅ Offline support (Background Sync)
- ✅ Cloud draft sync (cross-device)

---

#### **3.1 Service Worker Background Upload (Week 1)**

**Setup Service Worker:**
```typescript
// public/sw.js

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Listen for upload requests
self.addEventListener('message', async (event) => {
  if (event.data.type === 'UPLOAD_FILES') {
    const { tempId, files, postData } = event.data;

    try {
      // Upload files in background
      const mediaIds = await uploadFilesInWorker(files, (progress) => {
        // Send progress updates to all clients
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPLOAD_PROGRESS',
              tempId,
              progress,
            });
          });
        });
      });

      // Create post
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${postData.token}`,
        },
        body: JSON.stringify({
          ...postData,
          mediaIds,
        }),
      });

      const post = await response.json();

      // Notify clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'POST_CREATED',
            tempId,
            post,
          });
        });
      });
    } catch (error) {
      // Notify clients of failure
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPLOAD_FAILED',
            tempId,
            error: error.message,
          });
        });
      });
    }
  }
});

async function uploadFilesInWorker(files, onProgress) {
  // Upload implementation
  // ...
}
```

**Frontend Integration:**
```typescript
// Register Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');

  // Listen for messages from Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'UPLOAD_PROGRESS') {
      // Update Zustand store
      useOptimisticPostStore.getState().updateUploadProgress(
        event.data.tempId,
        event.data.fileIndex,
        event.data.progress
      );
    } else if (event.data.type === 'POST_CREATED') {
      // Mark complete
      useOptimisticPostStore.getState().markPostComplete(
        event.data.tempId,
        event.data.post.id
      );
    }
  });
}
```

---

#### **3.2 Chunked Upload (Week 2-3)**

**Backend API Requirements:**
```typescript
// POST /api/upload/multipart/init
// Initialize multipart upload
{
  fileName: string;
  fileSize: number;
  contentType: string;
}

// Response
{
  uploadId: string;
  fileKey: string;
}

// GET /api/upload/multipart/:uploadId/chunk/:partNumber/presigned-url
// Get presigned URL for chunk

// POST /api/upload/multipart/:uploadId/complete
// Complete multipart upload
{
  parts: Array<{ partNumber: number; etag: string }>;
}

// Response
{
  mediaId: string;
  url: string;
}
```

**Frontend Implementation:**
```typescript
// src/lib/upload/chunkedUpload.ts

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk

export async function uploadFileChunked(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // 1. Initialize multipart upload
  const { uploadId, fileKey } = await fetch('/api/upload/multipart/init', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
    }),
  }).then(r => r.json());

  // 2. Split into chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadedParts: Array<{ partNumber: number; etag: string }> = [];

  // Check for resume data
  const resumeData = await getResumeData(file.name);
  const startChunk = resumeData?.lastChunk || 0;

  for (let i = startChunk; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    // Get presigned URL for this chunk
    const { presignedUrl } = await fetch(
      `/api/upload/multipart/${uploadId}/chunk/${i + 1}/presigned-url`
    ).then(r => r.json());

    // Upload chunk
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: chunk,
    });

    const etag = response.headers.get('ETag')!;

    uploadedParts.push({
      partNumber: i + 1,
      etag,
    });

    // Save resume data
    await saveResumeData(file.name, {
      uploadId,
      lastChunk: i,
      parts: uploadedParts,
    });

    // Report progress
    const progress = ((i + 1) / totalChunks) * 100;
    onProgress?.(progress);
  }

  // 3. Complete multipart upload
  const { mediaId, url } = await fetch(
    `/api/upload/multipart/${uploadId}/complete`,
    {
      method: 'POST',
      body: JSON.stringify({ parts: uploadedParts }),
    }
  ).then(r => r.json());

  // Cleanup resume data
  await deleteResumeData(file.name);

  return mediaId;
}
```

---

#### **3.3 Background Sync (Week 3)**

```typescript
// Register Background Sync
if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('upload-posts');
}

// Service Worker
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-posts') {
    event.waitUntil(uploadPendingPosts());
  }
});

async function uploadPendingPosts() {
  const db = await openIndexedDB();
  const pendingPosts = await db.tempPosts
    .where('status')
    .equals('uploading')
    .toArray();

  for (const post of pendingPosts) {
    try {
      await processUpload(post);
    } catch (error) {
      console.error('Upload failed:', error);
      // Will retry on next sync
    }
  }
}
```

---

#### **3.4 Cloud Draft Sync (Week 4)**

**Backend API:**
```typescript
// GET /api/drafts - List user's cloud drafts
// POST /api/drafts - Create cloud draft
// PUT /api/drafts/:id - Update cloud draft
// DELETE /api/drafts/:id - Delete cloud draft
```

**Frontend Sync Logic:**
```typescript
// Auto-sync to cloud every 10 seconds
useEffect(() => {
  const timer = setInterval(async () => {
    const localDrafts = await db.drafts.toArray();

    for (const draft of localDrafts) {
      // Upload media files first
      const mediaIds = await uploadDraftMedia(draft.fileIds);

      // Sync draft to cloud
      await fetch('/api/drafts', {
        method: 'POST',
        body: JSON.stringify({
          id: draft.id,
          title: draft.title,
          content: draft.content,
          tags: draft.tags,
          mediaIds,
        }),
      });
    }
  }, 10000);

  return () => clearInterval(timer);
}, []);
```

---

**Phase 3 Summary:**
- ✅ Upload ต่อได้แม้ปิด tab
- ✅ Resume upload สำหรับไฟล์ใหญ่
- ✅ Offline support
- ✅ Cross-device draft sync

**Total: 3-4 สัปดาห์**

---

## ✅ Success Criteria

### **ถือว่าสำเร็จเมื่อ:**

1. ✅ User กด "โพสต์" แล้วเห็นโพสต์ใน feed ทันที (< 1s)
2. ✅ แสดง progress bar ขณะอัปโหลด
3. ✅ เมื่อ upload เสร็จ temp post → real post อัตโนมัติ
4. ✅ ถ้า upload ล้มเหลว แสดง error + ปุ่ม retry
5. ✅ ไม่เกิด duplicate posts (idempotency)
6. ✅ UX ดีกว่าเดิม 10× (จาก user perspective)

---

## 📚 Next Steps

1. **Review แผนการนี้** - ตรวจสอบว่าตรงความต้องการหรือไม่
2. **เริ่ม Backend** - เพิ่ม idempotency support (2-3 วัน)
3. **เริ่ม Frontend** - สร้าง Zustand store + hooks (5 วัน)
4. **Testing** - ทดสอบกับ use cases ต่าง ๆ
5. **Deploy** - deploy ทั้ง Frontend + Backend
6. **Monitor** - ดู error rate + user feedback

---

**สรุป:** ถ้าทำ Phase 1 ครบ จะได้ระบบ Optimistic UI ที่ใช้งานได้จริง ภายใน **1 สัปดาห์**! 🚀
