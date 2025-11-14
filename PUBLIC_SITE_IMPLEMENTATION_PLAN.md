# 🌐 Public Site Implementation Plan

## 📋 สรุปความต้องการ

### หน้าที่ต้องการให้ Public เข้าถึงได้
1. ✅ `/` - Home Feed (ดูโพสต์ทั้งหมด)
2. ✅ `/post/[id]` - Post Detail (ดูรายละเอียดโพสต์)
3. ✅ `/tag/[tagName]` - Tag Page (ดูโพสต์ตาม Tag)
4. ✅ `/profile/[username]` - User Profile (ดูโปรไฟล์ผู้ใช้)
5. ✅ `/search` - Search Page (ค้นหาโพสต์และผู้ใช้)

### สิ่งที่ Public User ทำได้
- ✅ ดูโพสต์ทั้งหมด
- ✅ ดู Post Detail (รูปภาพ, วิดีโอ, เนื้อหา)
- ✅ เห็น Comments
- ✅ เห็น Vote Count (เห็นจำนวน upvotes/downvotes)
- ✅ ค้นหาโพสต์และผู้ใช้
- ✅ เห็น Tags
- ✅ ดูโปรไฟล์ผู้ใช้

### สิ่งที่ Public User ทำไม่ได้ (ต้อง Login)
- ❌ Vote (Upvote/Downvote)
- ❌ Comment
- ❌ Save Post
- ❌ Create Post
- ❌ Follow/Unfollow User
- ❌ Chat
- ❌ Edit Profile
- ❌ Share (Crosspost)

**เมื่อ Public User พยายามทำ actions เหล่านี้ → Redirect ไป `/login` หรือ `/register`**

---

## 🔌 Backend Endpoints ที่รองรับ Public (พร้อมใช้งานแล้ว)

### 📝 Posts
```
GET /api/v1/posts                    - ดูรายการ posts (sortBy, limit, offset)
GET /api/v1/posts/:id                - ดู post detail
GET /api/v1/posts/author/:authorId   - ดู posts ของผู้เขียน
GET /api/v1/posts/tag/:tagName       - ดู posts ตาม tag name
GET /api/v1/posts/tag-id/:tagId      - ดู posts ตาม tag ID
GET /api/v1/posts/search             - ค้นหา posts
GET /api/v1/posts/:id/crossposts     - ดู crossposts
```

### 💬 Comments
```
GET /api/v1/comments/:id                  - ดู comment เดียว
GET /api/v1/comments/post/:postId         - ดู comments ของ post
GET /api/v1/comments/post/:postId/tree    - ดู comment tree
GET /api/v1/comments/author/:authorId     - ดู comments ของผู้เขียน
GET /api/v1/comments/:id/replies          - ดู replies ของ comment
GET /api/v1/comments/:id/parent-chain     - ดู parent chain
```

### 🏷️ Tags
```
GET /api/v1/tags             - ดูรายการ tags ทั้งหมด
GET /api/v1/tags/popular     - ดู popular tags
GET /api/v1/tags/search      - ค้นหา tags
GET /api/v1/tags/:id         - ดู tag ตาม ID
GET /api/v1/tags/name/:name  - ดู tag ตามชื่อ
```

### 🔍 Search
```
GET /api/v1/search          - ค้นหาทั่วไป
GET /api/v1/search/popular  - ดู popular searches
```

### 👤 Profiles
```
GET /api/v1/profiles/:username  - ดู public profile ของ user
```

---

## 🎯 Implementation Strategy

### ระดับความสำคัญ

| Priority | Task | Reason |
|----------|------|--------|
| 🔴 HIGH | Protected Actions (Vote, Comment, Save) | ป้องกัน public ทำ actions ที่ต้อง login |
| 🔴 HIGH | Update React Query Hooks | ทำให้ API calls ทำงานแบบ public-friendly |
| 🟡 MEDIUM | UI/UX Adjustments | ซ่อน/แสดง UI ตามสถานะ login |
| 🟢 LOW | SEO Optimization | ปรับ metadata, sitemap |

---

## 📝 Implementation Checklist

### Phase 1: Protected Actions (🔴 HIGH PRIORITY)

#### 1.1 สร้าง Auth Guard Hook
**File:** `src/shared/hooks/useAuthGuard.ts`

```typescript
export function useAuthGuard() {
  const user = useUser();
  const router = useRouter();

  const requireAuth = (action: string = 'ทำการกระทำนี้') => {
    if (!user) {
      toast.error(`กรุณาล็อกอินเพื่อ${action}`);
      router.push('/login');
      return false;
    }
    return true;
  };

  return { requireAuth, isAuthenticated: !!user };
}
```

**ใช้งาน:**
```typescript
const { requireAuth } = useAuthGuard();

const handleVote = () => {
  if (!requireAuth('โหวต')) return;
  // ... vote logic
};
```

#### 1.2 Update Vote Actions
**Files ที่ต้องแก้:**
- ✅ `src/features/posts/components/VoteButtons.tsx`
- ✅ `src/features/posts/hooks/useVotes.ts`

**Changes:**
```typescript
// VoteButtons.tsx
const { requireAuth } = useAuthGuard();

const handleUpvote = () => {
  if (!requireAuth('โหวต')) return;
  onVote('up');
};

const handleDownvote = () => {
  if (!requireAuth('โหวต')) return;
  onVote('down');
};
```

#### 1.3 Update Comment Actions
**Files ที่ต้องแก้:**
- ✅ `src/features/comments/components/CommentForm.tsx`
- ✅ `src/features/comments/components/CommentCard.tsx`

**Changes:**
```typescript
// CommentForm.tsx
const { requireAuth } = useAuthGuard();

const handleSubmit = () => {
  if (!requireAuth('แสดงความคิดเห็น')) return;
  // ... comment logic
};
```

#### 1.4 Update Save Actions
**Files ที่ต้องแก้:**
- ✅ `src/features/posts/components/PostCard.tsx`
- ✅ `src/features/posts/hooks/useSaved.ts`

**Changes:**
```typescript
const { requireAuth } = useAuthGuard();

const handleSave = () => {
  if (!requireAuth('บันทึกโพสต์')) return;
  // ... save logic
};
```

#### 1.5 Update Follow Actions
**Files ที่ต้องแก้:**
- ✅ `src/features/profile/components/ProfileContent.tsx`
- ✅ `src/features/profile/hooks/useFollowMutations.ts`

#### 1.6 Update Share/Crosspost Actions
**Files ที่ต้องแก้:**
- ✅ `src/features/posts/components/ShareDropdown.tsx`

---

### Phase 2: React Query Hooks (🔴 HIGH PRIORITY)

#### 2.1 Update Query Options
**Concept:** ทำให้ hooks รองรับ public mode (ไม่ส่ง auth token)

**Files ที่ต้องแก้:**
- ✅ `src/features/posts/hooks/usePosts.ts`
- ✅ `src/features/comments/hooks/useComments.ts`
- ✅ `src/features/tags/hooks/useTags.ts`
- ✅ `src/features/search/hooks/useSearch.ts`
- ✅ `src/features/profile/hooks/useUsers.ts`

**Example:**
```typescript
// Before (ต้องมี token)
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts'), // ส่ง auth header
  });
}

// After (รองรับ public)
export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: () => api.get('/posts'), // Backend รองรับ public แล้ว!
  });
}
```

**🎉 Good News:** ถ้า backend รองรับ public endpoints แล้ว แปลว่า hooks ปัจจุบันน่าจะใช้ได้เลย!

#### 2.2 ตรวจสอบ API Client
**File:** `src/lib/api.ts` หรือ `src/services/api.ts`

**Check:**
```typescript
// ตรวจสอบว่า API client ส่ง Authorization header อย่างไร
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Authorization: `Bearer ${token}` <- ถ้ามีแบบนี้ต้องทำให้ optional
  },
});

// ✅ ควรเป็นแบบนี้ (ส่ง token เฉพาะเมื่อมี)
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### Phase 3: UI/UX Adjustments (🟡 MEDIUM PRIORITY)

#### 3.1 Hide/Show Actions Based on Auth

**PostCard.tsx**
```typescript
const currentUser = useUser();

// Vote Buttons - Show count, disable interaction
<VoteButtons
  votes={post.votes}
  userVote={post.userVote}
  onVote={handleVote}
  disabled={!currentUser} // ✅ Disable if not logged in
/>

// Comment Button - Show count, prompt login on click
<button onClick={handleCommentClick}>
  <MessageSquare size={16} />
  <span>{post.commentCount}</span>
</button>

// Save Button - Hide if not logged in
{currentUser && (
  <button onClick={handleSave}>
    <Bookmark size={16} />
  </button>
)}
```

#### 3.2 CommentForm - Show Login Prompt

**CommentForm.tsx**
```typescript
const currentUser = useUser();

if (!currentUser) {
  return (
    <Card className="p-4 text-center">
      <p className="text-muted-foreground mb-3">
        ล็อกอินเพื่อแสดงความคิดเห็น
      </p>
      <Button onClick={() => router.push('/login')}>
        ล็อกอิน
      </Button>
    </Card>
  );
}

// ... existing comment form
```

#### 3.3 ProfileContent - Hide Follow Button

**ProfileContent.tsx**
```typescript
const currentUser = useUser();

// ซ่อนปุ่ม Follow ถ้ายังไม่ login
{currentUser && !isOwnProfile && (
  <Button onClick={handleFollow}>
    <UserPlus /> ติดตาม
  </Button>
)}

// ถ้าไม่ได้ login แสดงปุ่ม login แทน
{!currentUser && (
  <Button onClick={() => router.push('/login')}>
    ล็อกอินเพื่อติดตาม
  </Button>
)}
```

#### 3.4 Create Post Button - Hide for Public

**app/page.tsx, tag/[tagName]/page.tsx**
```typescript
const currentUser = useUser();

{currentUser ? (
  <Button onClick={() => router.push('/create-post')}>
    <Plus /> สร้างโพสต์
  </Button>
) : (
  <Button onClick={() => router.push('/login')}>
    ล็อกอินเพื่อโพสต์
  </Button>
)}
```

---

### Phase 4: Drawer System (🟡 MEDIUM PRIORITY)

#### 4.1 Update MediaViewerDrawer
**File:** `src/shared/components/drawers/MediaViewerDrawer.tsx`

**Changes:**
- ✅ Vote buttons → แสดงจำนวน แต่ disable ถ้าไม่ได้ login
- ✅ Comment form → แสดง login prompt ถ้าไม่ได้ login

#### 4.2 Update CommentDrawer
**File:** `src/shared/components/drawers/CommentDrawer.tsx`

**Changes:**
- ✅ Comment form → แสดง login prompt ถ้าไม่ได้ login
- ✅ Vote on comments → disable ถ้าไม่ได้ login

---

### Phase 5: SEO Optimization (🟢 LOW PRIORITY)

#### 5.1 Update Metadata
**Files:**
- ✅ `app/page.tsx` - Home metadata
- ✅ `app/post/[id]/page.tsx` - Post metadata (already has generateMetadata)
- ✅ `app/tag/[tagName]/page.tsx` - Tag metadata
- ✅ `app/profile/[username]/page.tsx` - Profile metadata (already has generateMetadata)
- ✅ `app/search/page.tsx` - Search metadata

**Ensure:**
```typescript
export const metadata: Metadata = {
  robots: {
    index: true,  // ✅ Allow indexing
    follow: true, // ✅ Allow following links
  },
};
```

#### 5.2 Generate Sitemap
**File:** `app/sitemap.ts`

```typescript
export default async function sitemap() {
  // Fetch public posts
  const posts = await fetch(`${API_URL}/posts?limit=1000`).then(r => r.json());

  return [
    { url: 'https://suekk.com', priority: 1 },
    { url: 'https://suekk.com/search', priority: 0.8 },
    ...posts.map((post) => ({
      url: `https://suekk.com/post/${post.id}`,
      lastModified: post.updatedAt,
      priority: 0.7,
    })),
  ];
}
```

#### 5.3 Add Structured Data (JSON-LD)
**File:** `app/post/[id]/page.tsx`

```typescript
export default function PostDetailPage({ params, post }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    image: post.media?.[0]?.url,
    author: {
      '@type': 'Person',
      name: post.author.displayName,
    },
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ... */}
    </>
  );
}
```

---

## 🧪 Testing Checklist

### Manual Testing

#### ✅ Public User (ไม่ได้ Login)
- [ ] เปิด `/` → เห็นโพสต์ทั้งหมด
- [ ] Click โพสต์ → เปิดหน้า `/post/[id]` ได้
- [ ] เห็น media (รูป/วิดีโอ) แสดงปกติ
- [ ] เห็น comments ทั้งหมด
- [ ] เห็น vote count (แต่ไม่สามารถกด vote ได้)
- [ ] Click vote → redirect ไป `/login`
- [ ] พิมพ์ comment → redirect ไป `/login`
- [ ] Click save → redirect ไป `/login`
- [ ] Click follow → redirect ไป `/login`
- [ ] Click สร้างโพสต์ → redirect ไป `/login`
- [ ] ค้นหาโพสต์ → แสดงผลลัพธ์
- [ ] เปิดหน้า tag → เห็นโพสต์ตาม tag
- [ ] เปิดหน้า profile → เห็นโปรไฟล์และโพสต์ของ user

#### ✅ Authenticated User (Login แล้ว)
- [ ] ทำทุกอย่างได้ตามเดิม
- [ ] Vote ได้
- [ ] Comment ได้
- [ ] Save ได้
- [ ] Follow ได้
- [ ] Create post ได้

### Automated Testing

```typescript
// cypress/e2e/public-access.cy.ts
describe('Public Access', () => {
  it('should allow public to view home page', () => {
    cy.visit('/');
    cy.get('[data-testid="post-card"]').should('be.visible');
  });

  it('should redirect to login when voting', () => {
    cy.visit('/');
    cy.get('[data-testid="vote-up"]').first().click();
    cy.url().should('include', '/login');
  });

  it('should redirect to login when commenting', () => {
    cy.visit('/post/123');
    cy.get('[data-testid="comment-form"]').click();
    cy.url().should('include', '/login');
  });
});
```

---

## 📊 Implementation Timeline

### Week 1: Protected Actions (Priority 🔴)
- [ ] Day 1-2: Create `useAuthGuard` hook
- [ ] Day 3: Update Vote actions
- [ ] Day 4: Update Comment actions
- [ ] Day 5: Update Save/Follow actions

### Week 2: UI/UX Adjustments (Priority 🟡)
- [ ] Day 1-2: Update PostCard UI
- [ ] Day 3: Update CommentForm UI
- [ ] Day 4: Update ProfileContent UI
- [ ] Day 5: Update Drawer components

### Week 3: Testing & SEO (Priority 🟢)
- [ ] Day 1-3: Manual testing
- [ ] Day 4: SEO optimization (metadata, sitemap)
- [ ] Day 5: Final review & deployment

---

## 🚨 Potential Issues & Solutions

### Issue 1: API ส่ง 401 Unauthorized
**Problem:** API ต้องการ token แม้ว่า endpoint เป็น public

**Solution:**
```typescript
// api.ts - Skip auth for public endpoints
const publicEndpoints = ['/posts', '/comments', '/tags', '/search', '/profiles'];

api.interceptors.request.use((config) => {
  const isPublicEndpoint = publicEndpoints.some(ep => config.url?.includes(ep));

  if (!isPublicEndpoint) {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});
```

### Issue 2: React Query Cache ปัญหา
**Problem:** Query cache อาจมี user-specific data

**Solution:**
```typescript
// ใช้ queryKey ที่แยกตาม user
const { data } = useQuery({
  queryKey: ['posts', userId], // ✅ Include userId
  queryFn: fetchPosts,
});
```

### Issue 3: SSR Hydration Mismatch
**Problem:** Server render แสดง UI แบบหนึ่ง, Client render แสดงอีกแบบ

**Solution:**
```typescript
// ใช้ useHasHydrated hook
const hasHydrated = useHasHydrated();
const user = useUser();

if (!hasHydrated) {
  return <LoadingSkeleton />;
}

// ... render UI based on user
```

---

## 📚 References

### Backend API Docs
- Public Endpoints: `interfaces/api/routes/*.go`
- Authentication: `middleware/auth.go`

### Frontend Components
- Protected Actions: `src/shared/hooks/useAuthGuard.ts`
- UI Components: `src/features/*/components/*.tsx`
- React Query Hooks: `src/features/*/hooks/*.ts`

---

## ✅ Success Criteria

### Must Have
- ✅ Public users สามารถดู posts ทั้งหมดได้
- ✅ Public users สามารถดู post detail, comments ได้
- ✅ Public users ไม่สามารถ vote, comment, save ได้
- ✅ Protected actions redirect ไป login page
- ✅ SEO metadata ครบถ้วน

### Nice to Have
- ✅ Sitemap อัตโนมัติ
- ✅ JSON-LD structured data
- ✅ Performance optimization (lazy loading, caching)

---

**Last Updated:** 2025-01-14
**Version:** 1.0
**Status:** 📋 Planning Phase
