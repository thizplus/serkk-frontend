# การวิเคราะห์ PostCard Component แบบละเอียด

## 📋 สารบัญ
1. [ภาพรวม PostCard](#ภาพรวม-postcard)
2. [โครงสร้าง Component](#โครงสร้าง-component)
3. [Props และ Options](#props-และ-options)
4. [การแสดงผลในแต่ละหน้า](#การแสดงผลในแต่ละหน้า)
5. [Features และ Functionality](#features-และ-functionality)
6. [Flow การทำงาน](#flow-การทำงาน)
7. [Optimistic UI](#optimistic-ui)
8. [การจัดการ Media](#การจัดการ-media)

---

## ภาพรวม PostCard

### Location
```
src/features/posts/components/PostCard.tsx
```

### Purpose
PostCard คือ **Component หลักสำหรับแสดงโพสต์** ในทุกส่วนของแอปพลิเคชัน มีความสามารถในการแสดง:
- ข้อมูลโพสต์ (หัวข้อ, เนื้อหา, ผู้โพสต์)
- Media (รูปภาพ, วิดีโอ)
- Crosspost (โพสต์ข้าม)
- Tags
- การโต้ตอบ (Vote, Comment, Share, Save)
- Optimistic UI (แสดงสถานะขณะอัปโหลด)

---

## โครงสร้าง Component

### 1. Main Structure
```typescript
PostCard
├── Upload Status (Optimistic UI)
│   ├── Progress Bar (กำลังอัปโหลด)
│   └── Error Badge (อัปโหลดล้มเหลว)
│
├── Header
│   ├── Avatar (คลิกไปที่โปรไฟล์)
│   ├── Display Name + Username
│   ├── Time Ago
│   └── Post Actions (Edit/Delete) - เฉพาะโพสต์ตัวเอง
│
├── Content
│   ├── Title (คลิกไปรายละเอียด)
│   ├── Content Text (รองรับ LinkifiedContent)
│   ├── Crosspost Box (ถ้ามี sourcePost)
│   │   ├── Source Post Title
│   │   ├── Source Post Content
│   │   └── Source Post Media (thumbnail)
│   └── Media Display
│       ├── MediaDisplay Component
│       └── Upload Overlay (ถ้ากำลังอัปโหลด)
│
├── Tags (แสดงเฉพาะ non-optimistic)
│   └── Tag Badges (คลิกไปหน้า /tag/[tagName])
│
└── Action Buttons (แสดงเฉพาะ non-optimistic)
    ├── VoteButtons (Up/Down vote)
    ├── Comments (แสดงจำนวน + คลิกไปรายละเอียด)
    ├── ShareDropdown (Copy link, Share to socials)
    └── Save Button (บันทึก/ยกเลิกบันทึก)
```

---

## Props และ Options

### Interface: PostCardProps
```typescript
interface PostCardProps {
  post: Post;                    // ข้อมูลโพสต์
  compact?: boolean;             // แสดงแบบย่อ (ใช้ใน preview)
  disableNavigation?: boolean;   // ปิดการคลิกไปรายละเอียด
  isOptimistic?: boolean;        // เป็น Optimistic Post (กำลังอัปโหลด)
  optimisticData?: {
    tempId: string;
    uploadStatus: 'uploading' | 'completed' | 'failed';
    uploadProgress: number;
    error?: string;
  };
}
```

### Props Behaviors

| Prop | Default | Description | Effect |
|------|---------|-------------|--------|
| `post` | (required) | ข้อมูลโพสต์ | แสดงทุกส่วนของโพสต์ |
| `compact` | `false` | โหมดย่อ | ซ่อน content, แสดงเฉพาะ title |
| `disableNavigation` | `false` | ปิดการนำทาง | ไม่สามารถคลิกไปรายละเอียดได้ |
| `isOptimistic` | `false` | โพสต์ชั่วคราว | แสดง upload status, ซ่อน actions |
| `optimisticData` | `undefined` | ข้อมูล upload | แสดง progress bar, error message |

---

## การแสดงผลในแต่ละหน้า

### 1. หน้าแรก (app/page.tsx)
```typescript
// Path: app/page.tsx

<InfinitePostFeed
  posts={posts}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  fetchNextPage={fetchNextPage}
  isLoading={isLoading}
  error={error || null}
  enableOptimisticUI={true}  // ✅ รองรับ Optimistic UI
/>
```

**การแสดงผล:**
- ใช้ `InfinitePostFeed` สำหรับ infinite scroll
- แสดง PostCard แบบเต็ม (ไม่ compact)
- รองรับ Optimistic UI (แสดงโพสต์ที่กำลังอัปโหลด)
- Navigation enabled (คลิกไปรายละเอียดได้)
- แสดงทุก features ของ PostCard

**Features:**
- Vote, Comment, Share, Save buttons ✅
- Crosspost support ✅
- Media display ✅
- Tags ✅
- Click to detail ✅

---

### 2. โพสต์ของฉัน (app/my-posts/page.tsx)
```typescript
// Path: app/my-posts/page.tsx

<PostFeed
  posts={myPosts}
  enableOptimisticUI={true}  // ✅ รองรับ Optimistic UI
/>
```

**การแสดงผล:**
- ใช้ `PostFeed` (ไม่มี infinite scroll)
- แสดง PostCard แบบเต็ม
- รองรับ Optimistic UI
- แสดงปุ่ม Edit/Delete เพราะเป็นโพสต์ของตัวเอง

**Features:**
- Edit/Delete buttons ✅ (เฉพาะโพสต์ตัวเอง)
- Vote, Comment, Share, Save buttons ✅
- Crosspost support ✅
- Media display ✅
- Tags ✅
- Click to detail ✅

---

### 3. โพสต์ที่บันทึก (app/saved/page.tsx)
```typescript
// Path: app/saved/page.tsx

<PostFeed posts={savedPosts} />
```

**การแสดงผล:**
- ใช้ `PostFeed` (ไม่มี infinite scroll)
- แสดง PostCard แบบเต็ม
- ไม่รองรับ Optimistic UI (เพราะเป็นโพสต์ที่บันทึกไว้แล้ว)
- Save button แสดงสถานะ "บันทึกแล้ว"

**Features:**
- Vote, Comment, Share buttons ✅
- Save button (สถานะ "บันทึกแล้ว") ✅
- Crosspost support ✅
- Media display ✅
- Tags ✅
- Click to detail ✅

---

### 4. โพสต์ตาม Tag (app/tag/[tagName]/page.tsx)
```typescript
// Path: app/tag/[tagName]/page.tsx

<InfinitePostFeed
  posts={posts}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  fetchNextPage={fetchNextPage}
  isLoading={isLoading}
  error={error || null}
/>
```

**การแสดงผล:**
- ใช้ `InfinitePostFeed` สำหรับ infinite scroll
- แสดง PostCard แบบเต็ม
- ไม่รองรับ Optimistic UI
- แสดงโพสต์ที่มี tag ที่เลือก

**Features:**
- Vote, Comment, Share, Save buttons ✅
- Crosspost support ✅
- Media display ✅
- Tags ✅ (highlight tag ที่กำลังดู)
- Click to detail ✅

---

### 5. ค้นหา (app/search/page.tsx)
```typescript
// Path: app/search/page.tsx

<PostFeed posts={filteredPosts} />
```

**การแสดงผล:**
- ใช้ `PostFeed` (ไม่มี infinite scroll)
- แสดง PostCard แบบเต็ม
- ไม่รองรับ Optimistic UI
- แสดงผลการค้นหา

**Features:**
- Vote, Comment, Share, Save buttons ✅
- Crosspost support ✅
- Media display ✅
- Tags ✅
- Click to detail ✅

---

### 6. รายละเอียดโพสต์ (app/post/[id]/PostDetailContent.tsx)
```typescript
// Path: app/post/[id]/PostDetailContent.tsx

<PostCard
  post={post}
  disableNavigation  // ✅ ปิดการนำทาง
/>
```

**การแสดงผล:**
- แสดง PostCard แบบเต็ม
- **ปิดการนำทาง** (disableNavigation={true})
- ไม่สามารถคลิกไปรายละเอียดได้ (เพราะอยู่ในหน้ารายละเอียดอยู่แล้ว)
- ไม่รองรับ Optimistic UI

**Features:**
- Vote, Comment, Share, Save buttons ✅
- Crosspost support ✅
- Media display (variant="detail") ✅
- Tags ✅
- Click to detail ❌ (ปิด)

**Special:**
- MediaDisplay ใช้ `variant="detail"` เพื่อแสดงภาพเต็มขนาด
- แสดง CommentTree ด้านล่าง

---

### 7. โปรไฟล์ผู้ใช้ (app/profile/[username]/page.tsx)
```typescript
// Path: src/features/profile/components/ProfileContent.tsx

<InfinitePostFeed
  posts={userPosts}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  fetchNextPage={fetchNextPage}
  isLoading={isLoadingPosts}
  error={error || null}
/>
```

**การแสดงผล:**
- ใช้ `InfinitePostFeed` สำหรับ infinite scroll
- แสดง PostCard แบบเต็ม
- ไม่รองรับ Optimistic UI
- แสดงโพสต์ของผู้ใช้คนนั้น
- ถ้าเป็นโปรไฟล์ตัวเอง จะมีปุ่ม Edit/Delete

**Features:**
- Vote, Comment, Share, Save buttons ✅
- Edit/Delete buttons ✅ (ถ้าเป็นโพสต์ตัวเอง)
- Crosspost support ✅
- Media display ✅
- Tags ✅
- Click to detail ✅

---

## Features และ Functionality

### 1. Header Section

#### Avatar & Author Info
```typescript
// Line 119-141
<Image
  src={post.author.avatar || "/icon-white.svg"}
  alt={post.author.displayName}
  width={30}
  height={30}
  className="rounded-full cursor-pointer"
  onClick={() => router.push(`/profile/${post.author.username}`)}
/>
<span
  className="font-medium hover:underline cursor-pointer"
  onClick={() => router.push(`/profile/${post.author.username}`)}
>
  {post.author.displayName}
</span>
```

**Functionality:**
- คลิก Avatar หรือชื่อ → ไปหน้าโปรไฟล์
- แสดง displayName + username
- แสดง timeAgo (เช่น "5 นาทีที่แล้ว")

#### Post Actions (Edit/Delete)
```typescript
// Line 144-150
{isOwnPost && (
  <PostActions
    postId={post.id}
    onEdit={handleEditClick}
    onDelete={handleDeleteClick}
  />
)}
```

**Functionality:**
- แสดงเฉพาะโพสต์ของตัวเอง
- Edit → ไปหน้า `/edit-post/${post.id}`
- Delete → เรียก `deletePost.mutate(post.id)`

---

### 2. Content Section

#### Title
```typescript
// Line 155-164
<h1
  onClick={handlePostClick}
  className="font-semibold cursor-pointer hover:text-primary"
>
  {post.title}
</h1>
```

**Functionality:**
- คลิก → ไปหน้า `/post/${post.id}`
- ถ้า `disableNavigation={true}` → ไม่สามารถคลิกได้
- ถ้า `compact={true}` → แสดง `line-clamp-2`

#### Content Text
```typescript
// Line 167-177
{!compact && post.content && (
  <div onClick={handlePostClick}>
    <LinkifiedContent>{post.content}</LinkifiedContent>
  </div>
)}
```

**Functionality:**
- ซ่อนถ้า `compact={true}`
- รองรับ LinkifiedContent (แปลง URL, mention, hashtag เป็นลิงก์)
- คลิก → ไปหน้า `/post/${post.id}`
- แสดง `line-clamp-3` (จำกัด 3 บรรทัด)

---

### 3. Crosspost Support

```typescript
// Line 180-233
{post.sourcePost && (
  <div className="border-l-4 border-primary/50">
    <div className="ml-3 p-3 bg-muted/30">
      {/* Crosspost Indicator */}
      <div className="flex items-center gap-1.5">
        <Repeat2 size={14} />
        <span>โพสต์ข้ามจาก</span>
        <span>@{post.sourcePost.author.username}</span>
      </div>

      {/* Source Post Content */}
      <div onClick={() => router.push(`/post/${post.sourcePost!.id}`)}>
        <h3>{post.sourcePost.title}</h3>
        <div>{post.sourcePost.content}</div>

        {/* Source Post Media (thumbnail) */}
        {post.sourcePost.media && post.sourcePost.media.length > 0 && (
          <div className="max-h-80">
            {/* แสดง media แรก */}
          </div>
        )}
      </div>
    </div>
  </div>
)}
```

**Functionality:**
- แสดง sourcePost ถ้ามีการ crosspost
- แสดง indicator "โพสต์ข้ามจาก @username"
- แสดง title, content, media ของ sourcePost
- คลิก → ไปหน้าโพสต์ต้นฉบับ `/post/${sourcePost.id}`

---

### 4. Media Display

```typescript
// Line 236-280
{post.media && post.media.length > 0 && (
  <div className="relative">
    <MediaDisplay
      media={post.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: detectType(m), // ตรวจสอบ type จาก URL extension
        thumbnail: m.thumbnail || undefined,
      }))}
      variant={disableNavigation ? 'detail' : 'feed'}
      className={isUploading && "opacity-60"}
    />

    {/* Upload Overlay */}
    {isUploading && (
      <div className="absolute inset-0 bg-black/60">
        <Loader2 className="animate-spin" />
        <p>กำลังอัปโหลดวิดีโอ... {uploadProgress}%</p>
      </div>
    )}
  </div>
)}
```

**Functionality:**
- รองรับ multiple media (รูปภาพ, วิดีโอ)
- ตรวจสอบ type จาก URL extension (เพราะ backend อาจ return ผิด)
- ใช้ MediaDisplay component สำหรับแสดง media
- variant="feed" → แสดงแบบ thumbnail
- variant="detail" → แสดงแบบเต็มขนาด
- แสดง Upload Overlay ถ้ากำลังอัปโหลด

**Type Detection Logic:**
```typescript
// Line 241-254
const urlLower = m.url.toLowerCase();
const isVideoByUrl = /\.(mp4|webm|mov|avi)$/i.test(urlLower);
const isImageByUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlLower);

let type: 'image' | 'video' = 'image';
if (isVideoByUrl) {
  type = 'video';
} else if (isImageByUrl) {
  type = 'image';
} else {
  // Fallback: ใช้ backend type
  type = m.type === 'video' ? 'video' : 'image';
}
```

---

### 5. Tags

```typescript
// Line 283-298
{!isOptimistic && post.tags && post.tags.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {post.tags.map((tag) => (
      <span
        key={tag.id}
        className="px-2 py-1 bg-accent/50 rounded-full hover:bg-accent cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          router.push(`/tag/${encodeURIComponent(tag.name)}`);
        }}
      >
        #{tag.name}
      </span>
    ))}
  </div>
)}
```

**Functionality:**
- แสดง tags เฉพาะ non-optimistic posts
- คลิก tag → ไปหน้า `/tag/${tagName}`
- `stopPropagation()` ป้องกันการคลิกไปรายละเอียดโพสต์

---

### 6. Action Buttons

```typescript
// Line 301-338
{!isOptimistic && (
  <div className="flex items-center gap-2">
    {/* Vote Buttons */}
    <VoteButtons
      votes={post.votes}
      userVote={post.userVote}
      onVote={handleVoteClick}
    />

    {/* Comments */}
    <button onClick={handleCommentClick}>
      <MessageSquare />
      <span>{post.commentCount}</span>
    </button>

    {/* Share */}
    <ShareDropdown postId={post.id} postTitle={post.title} />

    {/* Save */}
    <button onClick={handleSaveClick}>
      <Bookmark className={post.isSaved && "fill-current"} />
      <span>{post.isSaved ? "บันทึกแล้ว" : "บันทึก"}</span>
    </button>
  </div>
)}
```

**Functionality:**

#### Vote Buttons
- แสดงจำนวน votes (up - down)
- แสดงสถานะ userVote (up/down/null)
- คลิก → toggle vote

#### Comments Button
- แสดงจำนวน comments
- คลิก → ไปหน้ารายละเอียด `/post/${post.id}`

#### Share Dropdown
- Copy link
- Share to Facebook, Twitter, Line

#### Save Button
- แสดงสถานะ "บันทึก" / "บันทึกแล้ว"
- คลิก → toggle save

---

## Flow การทำงาน

### 1. Navigation Flow
```
PostCard (หน้า feed)
  │
  ├─ คลิก Title/Content ──→ /post/${post.id} (รายละเอียด)
  │
  ├─ คลิก Avatar/Author ──→ /profile/${username} (โปรไฟล์)
  │
  ├─ คลิก Tag ──→ /tag/${tagName} (โพสต์ตาม tag)
  │
  ├─ คลิก Comment ──→ /post/${post.id} (รายละเอียด + focus comment)
  │
  ├─ คลิก Edit ──→ /edit-post/${post.id} (แก้ไข)
  │
  └─ คลิก Crosspost ──→ /post/${sourcePost.id} (โพสต์ต้นฉบับ)
```

### 2. Interaction Flow
```
User Interaction
  │
  ├─ Vote ──→ handleVote() ──→ useToggleVote() ──→ API ──→ Optimistic Update
  │
  ├─ Comment ──→ router.push(/post/${id}) ──→ CommentForm
  │
  ├─ Share ──→ ShareDropdown ──→ Copy Link / Social Share
  │
  ├─ Save ──→ handleToggleSave() ──→ useToggleSave() ──→ API ──→ Optimistic Update
  │
  ├─ Edit ──→ router.push(/edit-post/${id}) ──→ EditPostForm
  │
  └─ Delete ──→ deletePost.mutate() ──→ API ──→ Remove from list
```

---

## Optimistic UI

### 1. Upload Status

#### การแสดงสถานะการอัปโหลด
```typescript
// Line 92-114
{isUploading && optimisticData && (
  <div>
    <Badge variant="secondary">
      <Loader2 className="animate-spin" />
      กำลังอัปโหลด... {optimisticData.uploadProgress}%
    </Badge>
    <Progress value={optimisticData.uploadProgress} />
  </div>
)}

{isFailed && optimisticData && (
  <div>
    <Badge variant="destructive">อัปโหลดล้มเหลว</Badge>
    {optimisticData.error && (
      <p>{optimisticData.error}</p>
    )}
  </div>
)}
```

#### สถานะที่รองรับ
1. **uploading** - กำลังอัปโหลด
   - แสดง Badge + Progress Bar
   - แสดง Upload Overlay บน Media
   - opacity-60 บน Media

2. **completed** - อัปโหลดสำเร็จ
   - ซ่อน Badge + Progress Bar
   - แสดงโพสต์ปกติ

3. **failed** - อัปโหลดล้มเหลว
   - แสดง Badge สีแดง
   - แสดง error message

### 2. Optimistic Post Behavior

#### สิ่งที่ซ่อนเมื่อเป็น Optimistic Post
```typescript
// Tags - Line 283
{!isOptimistic && post.tags && ...}

// Action Buttons - Line 301
{!isOptimistic && (
  <div>Vote, Comment, Share, Save buttons</div>
)}
```

#### Navigation Disabled
```typescript
// Line 126-128, 133-135
className={!isOptimistic && "cursor-pointer"}
onClick={!isOptimistic ? handleClick : undefined}
```

**เหตุผล:**
- Optimistic Post ยังไม่มี ID จริง
- ยังไม่สามารถ interact ได้
- ยังไม่มี tags, votes, comments

---

## การจัดการ Media

### 1. Type Detection
```typescript
// Fallback logic สำหรับตรวจสอบ type
const urlLower = m.url.toLowerCase();
const isVideoByUrl = /\.(mp4|webm|mov|avi)$/i.test(urlLower);
const isImageByUrl = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlLower);

// Priority: URL extension > backend type
```

**เหตุผล:**
- Backend อาจ return type ผิด
- URL extension เชื่อถือได้มากกว่า

### 2. Media Variants

#### Feed Variant (default)
```typescript
<MediaDisplay
  media={post.media}
  variant="feed"  // thumbnail, clickable
/>
```
- แสดงแบบ thumbnail
- คลิกเพื่อขยาย
- ใช้ในหน้า feed

#### Detail Variant
```typescript
<MediaDisplay
  media={post.media}
  variant="detail"  // full size
/>
```
- แสดงแบบเต็มขนาด
- ไม่มี click to expand
- ใช้ในหน้ารายละเอียด

### 3. Multiple Media Support
```typescript
media={post.media.map((m, index) => ({
  id: m.id || `temp-${index}`,
  url: m.url,
  type: detectType(m),
  thumbnail: m.thumbnail || undefined,
}))}
```
- รองรับหลาย media
- แสดงเป็น carousel
- ใช้ MediaDisplay component

---

## สรุปการใช้งาน PostCard ในแต่ละหน้า

| หน้า | Component | Navigation | Optimistic UI | Infinite Scroll | Edit/Delete | Special |
|------|-----------|------------|---------------|-----------------|-------------|---------|
| **หน้าแรก** | InfinitePostFeed | ✅ | ✅ | ✅ | ✅ (ถ้าเป็นโพสต์ตัวเอง) | - |
| **โพสต์ของฉัน** | PostFeed | ✅ | ✅ | ❌ | ✅ | แสดงเฉพาะโพสต์ตัวเอง |
| **โพสต์ที่บันทึก** | PostFeed | ✅ | ❌ | ❌ | ✅ (ถ้าเป็นโพสต์ตัวเอง) | Save button = "บันทึกแล้ว" |
| **Tag Page** | InfinitePostFeed | ✅ | ❌ | ✅ | ✅ (ถ้าเป็นโพสต์ตัวเอง) | แสดงเฉพาะ tag ที่เลือก |
| **Search** | PostFeed | ✅ | ❌ | ❌ | ✅ (ถ้าเป็นโพสต์ตัวเอง) | ผลการค้นหา |
| **รายละเอียด** | PostCard | ❌ | ❌ | - | ✅ (ถ้าเป็นโพสต์ตัวเอง) | disableNavigation=true |
| **โปรไฟล์** | InfinitePostFeed | ✅ | ❌ | ✅ | ✅ (ถ้าเป็นโพสต์ตัวเอง) | แสดงเฉพาะโพสต์ของผู้ใช้ |

---

## Best Practices

### 1. การใช้ Props
```typescript
// ✅ หน้า Feed
<PostCard post={post} />

// ✅ หน้ารายละเอียด
<PostCard post={post} disableNavigation />

// ✅ Compact Mode (preview)
<PostCard post={post} compact />

// ✅ Optimistic Post
<PostCard
  post={post}
  isOptimistic
  optimisticData={{
    tempId: 'temp-123',
    uploadStatus: 'uploading',
    uploadProgress: 45,
  }}
/>
```

### 2. Media Display
```typescript
// ✅ Auto-detect type from URL
<MediaDisplay media={post.media} />

// ✅ Full size in detail page
<MediaDisplay media={post.media} variant="detail" />
```

### 3. Navigation Control
```typescript
// ✅ Normal navigation
<PostCard post={post} />

// ✅ Disable navigation (detail page)
<PostCard post={post} disableNavigation />

// ✅ Optimistic post (auto-disabled)
<PostCard post={post} isOptimistic />
```

---

## เพิ่มเติม

### Dependencies
```typescript
// Hooks
useToggleVote()      // Vote functionality
useToggleSave()      // Save functionality
useDeletePost()      // Delete functionality
useUser()            // Current user info

// Components
MediaDisplay         // Media display
LinkifiedContent     // Linkify URLs, mentions, hashtags
VoteButtons          // Vote UI
ShareDropdown        // Share UI
PostActions          // Edit/Delete menu
```

### Styling
- ใช้ Tailwind CSS
- ใช้ cn() utility สำหรับ conditional classes
- รองรับ Dark Mode
- Responsive design

### Performance
- Lazy load images
- Optimistic UI สำหรับ UX ที่ดี
- Memoization ใน PostFeed/InfinitePostFeed
- Efficient re-rendering

---

## สรุป

PostCard เป็น Component ที่:
1. **ใช้งานง่าย** - Props ชัดเจน, มี default values
2. **ยืดหยุ่น** - รองรับหลายโหมด (compact, detail, optimistic)
3. **Feature-rich** - ครบทุกฟีเจอร์ (vote, comment, share, save, crosspost)
4. **Performance-oriented** - ใช้ Optimistic UI, lazy loading
5. **Maintainable** - โครงสร้างชัดเจน, แยก concerns ดี

การแสดงผลในแต่ละหน้าถูกควบคุมผ่าน:
- **Props** - compact, disableNavigation, isOptimistic
- **Context** - currentUser (สำหรับตรวจสอบ ownership)
- **Wrappers** - PostFeed vs InfinitePostFeed

สามารถนำไปใช้ในทุกส่วนของแอปพลิเคชันได้โดยไม่ต้องสร้าง component ใหม่ 🎉
