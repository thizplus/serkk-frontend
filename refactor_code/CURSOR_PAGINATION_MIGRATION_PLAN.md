# แผนงาน Migration: Offset-Based → Cursor-Based Pagination

**วันที่สร้าง:** 14 พฤศจิกายน 2568
**สถานะ:** 📋 PLANNING PHASE
**Backend Version:** v1.0.0 (12 endpoints พร้อมใช้งาน)

---

## 📊 Executive Summary

Backend ได้อัพเกรดระบบ pagination จาก **offset-based** เป็น **cursor-based** เรียบร้อยแล้ว (12 endpoints)
Frontend ต้องปรับให้รองรับการเปลี่ยนแปลงนี้เพื่อ:
- ✅ Performance ดีขึ้น **500-5000x** เมื่อ scroll ลึก
- ✅ ไม่มีข้อมูลซ้ำ/หายขณะ scroll (perfect for infinite scroll)
- ✅ รองรับ real-time updates ได้ดีกว่า
- ✅ UX ที่ดีขึ้นสำหรับ mobile & web

---

## 🎯 Migration Overview

### ที่ต้องแก้

| Category | Items | Files Affected | Priority |
|----------|-------|----------------|----------|
| **Types** | 5 interfaces | 2 files | 🔴 HIGH |
| **API Services** | 12 functions | 3 files | 🔴 HIGH |
| **React Query Hooks** | 15 hooks | 5 files | 🔴 HIGH |
| **Components** | 8 components | 8 files | 🟡 MEDIUM |
| **Pages** | 10 pages | 10 files | 🟡 MEDIUM |
| **Tests** | Update tests | Multiple | 🟢 LOW |

**Total Files:** ~38 files

---

## 📋 Phase-by-Phase Migration Plan

### Phase 1: Foundation (HIGH Priority)
**Timeline:** 1-2 days
**Must complete before Phase 2**

#### 1.1 Types & Interfaces (30 mins)
**Files:**
- `src/shared/types/api.ts`
- `src/shared/types/request.ts`

**Tasks:**
```typescript
// ✅ TODO 1: Add new cursor-based types
interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

// ✅ TODO 2: Update response types
interface PostListCursorResponse {
  posts: Post[];
  meta: CursorPaginationMeta;
}

interface CommentListCursorResponse {
  comments: Comment[];
  meta: CursorPaginationMeta;
}

interface NotificationListCursorResponse {
  notifications: Notification[];
  unreadCount: number;
  meta: CursorPaginationMeta;
}

interface UserListCursorResponse {
  users: User[];
  meta: CursorPaginationMeta;
}

// ✅ TODO 3: Mark old types as deprecated
/** @deprecated Use CursorPaginationMeta instead */
interface PaginationMeta {
  total: number;
  offset: number;
  limit: number;
}

// ✅ TODO 4: Update request params
interface GetPostsParams {
  cursor?: string;  // ← ใหม่ (เปลี่ยนจาก offset)
  limit?: number;
  sort?: 'hot' | 'new' | 'top';
  tag?: string;
}
```

**Acceptance Criteria:**
- [ ] ไม่มี TypeScript errors
- [ ] Old types marked as `@deprecated`
- [ ] JSDoc comments ครบถ้วน

---

#### 1.2 API Constants (15 mins)
**File:** `src/shared/lib/constants/api.ts`

**Tasks:**
```typescript
// ✅ TODO 5: Review API endpoints (ไม่ต้องแก้ แค่ verify)
export const POST_API = {
  LIST: '/posts',                    // รองรับ cursor แล้ว
  BY_AUTHOR: '/posts/author/:id',    // รองรับ cursor แล้ว
  BY_TAG: '/posts/tag/:tag',         // รองรับ cursor แล้ว
  FEED: '/posts/feed',               // รองรับ cursor แล้ว
  // ... etc
};
```

**Acceptance Criteria:**
- [ ] Verify endpoints match backend documentation

---

#### 1.3 API Services (2-3 hours)
**Files:**
- `src/features/posts/services/post.service.ts`
- `src/features/comments/services/comment.service.ts`
- `src/features/notifications/services/notification.service.ts`
- `src/features/profile/services/user.service.ts`

**Tasks:**

**✅ TODO 6: Update post.service.ts**
```typescript
// ❌ เดิม
async list(params?: GetPostsParams): Promise<ApiResponse<PostListResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  // ...
}

// ✅ ใหม่
async list(params?: GetPostsParams): Promise<ApiResponse<PostListCursorResponse>> {
  const queryParams = new URLSearchParams();
  if (params?.cursor) queryParams.append('cursor', params.cursor); // ← เปลี่ยน
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.sort) queryParams.append('sort', params.sort);
  if (params?.tag) queryParams.append('tag', params.tag);

  return apiService.get<PostListCursorResponse>(`${POST_API.LIST}?${queryParams}`);
}

// เหมือนกัน สำหรับ:
// - getByAuthor(authorId, params)
// - getByTag(tagName, params)
// - getByTagId(tagId, params)
// - getFeed(params)
```

**✅ TODO 7: Update comment.service.ts**
```typescript
// อัพเดท:
// - getByPostId(postId, params) → รองรับ cursor
// - getReplies(commentId, params) → รองรับ cursor
// - getByAuthor(userId, params) → รองรับ cursor
```

**✅ TODO 8: Update notification.service.ts**
```typescript
// อัพเดท:
// - getAll(params) → รองรับ cursor
// - getUnread(params) → รองรับ cursor
```

**✅ TODO 9: Update user.service.ts**
```typescript
// อัพเดท:
// - getFollowers(userId, params) → รองรับ cursor
// - getFollowing(userId, params) → รองรับ cursor
```

**Acceptance Criteria:**
- [ ] All service functions return `CursorPaginationMeta`
- [ ] No `offset` parameters
- [ ] Use `cursor` parameter correctly
- [ ] API calls work with Postman/curl

---

### Phase 2: React Query Hooks (HIGH Priority)
**Timeline:** 2-3 days
**Depends on:** Phase 1

#### 2.1 Posts Hooks (1-2 hours)
**File:** `src/features/posts/hooks/usePosts.ts`

**✅ TODO 10: Update useInfinitePosts**
```typescript
// ❌ เดิม
export function useInfinitePosts(params?: Omit<GetPostsParams, 'offset'>) {
  return useInfiniteQuery({
    queryKey: [...postKeys.lists(), 'infinite', params] as const,
    queryFn: async ({ pageParam = 0 }) => {  // ← offset
      const response = await postService.list({
        ...params,
        offset: pageParam,  // ← ไม่ใช้อีกแล้ว
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch posts');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { posts, meta } = lastPage;
      const nextOffset = meta.offset + posts.length;  // ← เดิม
      return nextOffset < meta.total ? nextOffset : undefined;  // ← เดิม
    },
    initialPageParam: 0,  // ← เดิม
    staleTime: 2 * 60 * 1000,
  });
}

// ✅ ใหม่
export function useInfinitePosts(params?: Omit<GetPostsParams, 'cursor'>) {
  return useInfiniteQuery({
    queryKey: [...postKeys.lists(), 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {  // ← cursor (no default)
      const response = await postService.list({
        ...params,
        cursor: pageParam,  // ← ใช้ cursor แทน
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch posts');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      // ✅ ง่ายกว่าเยอะ!
      return lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined;
    },
    initialPageParam: undefined,  // ← เปลี่ยนเป็น undefined
    staleTime: 2 * 60 * 1000,
  });
}
```

**เหมือนกัน สำหรับ:**
- [ ] `useInfiniteFeed`
- [ ] `useInfiniteUserPosts`
- [ ] `useInfinitePostsByTagId`

**Acceptance Criteria:**
- [ ] `initialPageParam: undefined` (NOT 0)
- [ ] `getNextPageParam` uses `hasMore` and `nextCursor`
- [ ] No offset calculations
- [ ] Query keys remain unique per params

---

#### 2.2 Comments Hooks (1 hour)
**File:** `src/features/comments/hooks/useComments.ts`

**✅ TODO 11: Add useInfiniteComments**
```typescript
export function useInfiniteComments(
  postId: string,
  params?: Omit<GetCommentsParams, 'cursor'>
) {
  return useInfiniteQuery({
    queryKey: [...commentKeys.list(postId), 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await commentService.getByPostId(postId, {
        ...params,
        cursor: pageParam,
        limit: params?.limit || 20,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch comments');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined,
    enabled: !!postId,
  });
}

// เหมือนกัน สำหรับ:
// - useInfiniteReplies(commentId, params)
// - useInfiniteCommentsByAuthor(userId, params)
```

**Acceptance Criteria:**
- [ ] Works with nested comments
- [ ] Enabled only when postId/commentId exists

---

#### 2.3 Notifications Hooks (1 hour)
**File:** `src/features/notifications/hooks/useNotifications.ts`

**✅ TODO 12: Add useInfiniteNotifications**
```typescript
export function useInfiniteNotifications(
  filter?: 'all' | 'unread',
  params?: { limit?: number }
) {
  return useInfiniteQuery({
    queryKey: [...notificationKeys.lists(), filter, params] as const,
    queryFn: async ({ pageParam }) => {
      const response =
        filter === 'unread'
          ? await notificationService.getUnread({ cursor: pageParam, ...params })
          : await notificationService.getAll({ cursor: pageParam, ...params });

      if (!response.success || !response.data) {
        throw new Error('Failed to fetch notifications');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined,
  });
}
```

**Acceptance Criteria:**
- [ ] Filter works correctly (all/unread)
- [ ] Unread count updates properly

---

#### 2.4 Profile Hooks (1 hour)
**File:** `src/features/profile/hooks/useFollows.ts`

**✅ TODO 13: Add infinite query hooks**
```typescript
export function useInfiniteFollowers(
  userId: string,
  params?: { limit?: number }
) {
  return useInfiniteQuery({
    queryKey: [...followKeys.followers(userId), 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await userService.getFollowers(userId, {
        cursor: pageParam,
        ...params,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch followers');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined,
    enabled: !!userId,
  });
}

// เหมือนกัน:
// - useInfiniteFollowing(userId, params)
```

**Acceptance Criteria:**
- [ ] Works for both followers and following
- [ ] Follow/unfollow mutations invalidate correctly

---

#### 2.5 Saved Posts Hook (30 mins)
**File:** `src/features/posts/hooks/useSaved.ts`

**✅ TODO 14: Update to infinite query**
```typescript
export function useInfiniteSavedPosts(params?: { limit?: number }) {
  return useInfiniteQuery({
    queryKey: [...postKeys.all, 'saved', 'infinite', params] as const,
    queryFn: async ({ pageParam }) => {
      const response = await postService.getSaved({
        cursor: pageParam,
        ...params,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch saved posts');
      }
      return response.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined,
  });
}
```

---

### Phase 3: Components (MEDIUM Priority)
**Timeline:** 2-3 days
**Depends on:** Phase 2

#### 3.1 InfinitePostFeed Component (1-2 hours)
**File:** `src/features/posts/components/InfinitePostFeed.tsx`

**✅ TODO 15: Update to use cursor-based pagination**

**Current Structure:**
```typescript
// เดิม - ใช้ offset
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  isLoading,
} = useInfinitePosts(params);

const posts = data?.pages.flatMap((page) => page.posts) ?? [];
```

**Changes Needed:**
```typescript
// ✅ ใหม่ - ไม่เปลี่ยนอะไรมาก!
// เพียงแค่ hook ใหม่รองรับ cursor แล้ว
const {
  data,
  fetchNextPage,
  hasNextPage,  // ← มาจาก meta.hasMore
  isFetchingNextPage,
  isLoading,
  refetch,
} = useInfinitePosts(params);

const posts = data?.pages.flatMap((page) => page.posts) ?? [];

// Merge with optimistic posts (ถ้ามี)
const allPosts = useMemo(() => {
  if (enableOptimisticUI && optimisticPosts.length > 0) {
    return [...optimisticPosts, ...posts];
  }
  return posts;
}, [posts, optimisticPosts, enableOptimisticUI]);
```

**Key Points:**
- ✅ UI ไม่ต้องเปลี่ยน
- ✅ Infinite scroll logic เหมือนเดิม
- ✅ `hasNextPage` มาจาก `meta.hasMore` โดยอัตโนมัติ
- ⚠️ **ต้อง reset เมื่อเปลี่ยน sort/filter**

**Acceptance Criteria:**
- [ ] Infinite scroll works smoothly
- [ ] No duplicate posts
- [ ] Loading states work correctly
- [ ] Optimistic UI still works
- [ ] Refetch resets to first page

---

#### 3.2 PostFeed Component (30 mins)
**File:** `src/features/posts/components/PostFeed.tsx`

**✅ TODO 16: Add "Load More" button**
```typescript
// ถ้าใช้ simple PostFeed (ไม่ infinite scroll)
// ควรเปลี่ยนเป็น infinite query ด้วย
// หรือเพิ่ม "Load More" button

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfinitePosts(params);

const posts = data?.pages.flatMap((page) => page.posts) ?? [];

return (
  <div>
    {posts.map((post) => (
      <PostCard key={post.id} post={post} />
    ))}

    {hasNextPage && (
      <button
        onClick={() => fetchNextPage()}
        disabled={isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    )}

    {!hasNextPage && posts.length > 0 && (
      <p>No more posts</p>
    )}
  </div>
);
```

**Acceptance Criteria:**
- [ ] Load more button works
- [ ] Disabled during loading
- [ ] Shows "No more" when done

---

#### 3.3 CommentTree Component (1 hour)
**File:** `src/features/comments/components/CommentTree.tsx`

**✅ TODO 17: Support infinite scroll for top-level comments**

**Note:** Comments อาจไม่จำเป็นต้องใช้ infinite scroll
แต่ถ้า post มีคอมเมนต์เยอะมาก (>100) ควรเพิ่ม

**Option 1: Keep current behavior** (โหลดทั้งหมดทีเดียว)
- ใช้ `useCommentTree` เหมือนเดิม
- Backend return tree structure พร้อม nested replies

**Option 2: Infinite scroll** (สำหรับ post ที่มีคอมเมนต์เยอะมาก)
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
} = useInfiniteComments(postId, { sort: 'hot', limit: 20 });

const comments = data?.pages.flatMap((page) => page.comments) ?? [];
```

**Acceptance Criteria:**
- [ ] Choose approach based on requirements
- [ ] Nested replies still work
- [ ] Vote on comments works

---

#### 3.4 NotificationList Component (1 hour)
**File:** `src/features/notifications/components/NotificationList.tsx`

**✅ TODO 18: Update to infinite scroll**
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteNotifications(filter, { limit: 20 });

const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
const unreadCount = data?.pages[0]?.unreadCount ?? 0;

// Infinite scroll or "Load More" button
```

**Acceptance Criteria:**
- [ ] Unread count shows correctly
- [ ] Mark as read works
- [ ] Filter (all/unread) works
- [ ] Infinite scroll smooth

---

#### 3.5 FollowersList Component (30 mins)
**File:** `src/features/profile/components/FollowersList.tsx`

**✅ TODO 19: Update to infinite scroll**
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
} = useInfiniteFollowers(userId, { limit: 20 });

const followers = data?.pages.flatMap((page) => page.users) ?? [];
```

---

#### 3.6 FollowingList Component (30 mins)
**File:** `src/features/profile/components/FollowingList.tsx`

**✅ TODO 20: Update to infinite scroll**
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
} = useInfiniteFollowing(userId, { limit: 20 });

const following = data?.pages.flatMap((page) => page.users) ?? [];
```

---

#### 3.7 SavedPostsList Component (30 mins)
**File:** `app/saved/page.tsx` (or component)

**✅ TODO 21: Update to infinite scroll**
```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
} = useInfiniteSavedPosts({ limit: 20 });

const savedPosts = data?.pages.flatMap((page) => page.posts) ?? [];
```

---

### Phase 4: Pages (MEDIUM Priority)
**Timeline:** 1-2 days
**Depends on:** Phase 3

**✅ TODO 22: Update all pages that use infinite queries**

| Page | File | Component Used | Status |
|------|------|----------------|--------|
| Home | `app/page.tsx` | InfinitePostFeed | Update |
| Tag | `app/tag/[tagName]/TagPageContent.tsx` | InfinitePostFeed | Update |
| Profile Posts | `src/features/profile/components/ProfileContent.tsx` | InfinitePostFeed | Update |
| Saved Posts | `app/saved/page.tsx` | InfinitePostFeed | Update |
| Notifications | `app/notifications/page.tsx` | NotificationList | Update |
| Followers | `app/profile/[username]/followers/page.tsx` | FollowersList | Update |
| Following | `app/profile/[username]/following/page.tsx` | FollowingList | Update |

**Key Changes for Each Page:**
```typescript
// ❌ เดิม - อาจมี total count
{posts.length} of {total} posts

// ✅ ใหม่ - ใช้ hasMore แทน
{posts.length} posts {hasNextPage ? '(loading more...)' : '(all loaded)'}
```

**Acceptance Criteria:**
- [ ] All pages load correctly
- [ ] Infinite scroll works
- [ ] No duplicate data
- [ ] Loading states correct
- [ ] Empty states correct

---

### Phase 5: Testing & Optimization (LOW Priority)
**Timeline:** 2-3 days
**Depends on:** Phase 4

#### 5.1 Unit Tests (1 day)
**✅ TODO 23: Update/create tests**

**Test Files to Update:**
- `src/features/posts/hooks/__tests__/usePosts.test.ts`
- `src/features/comments/hooks/__tests__/useComments.test.ts`
- `src/features/notifications/hooks/__tests__/useNotifications.test.ts`

**Test Cases:**
```typescript
describe('useInfinitePosts', () => {
  it('should fetch first page without cursor', async () => {
    // Test initial load
  });

  it('should fetch next page with cursor', async () => {
    // Test pagination
  });

  it('should return hasMore correctly', async () => {
    // Test end of data
  });

  it('should reset when params change', async () => {
    // Test filter/sort change
  });
});
```

---

#### 5.2 Integration Tests (1 day)
**✅ TODO 24: E2E tests**

**Test Scenarios:**
- [ ] Scroll feed 10+ pages → no duplicates
- [ ] Change sort → resets to page 1
- [ ] Refresh page → starts from page 1
- [ ] Create post → appears at top
- [ ] Network error → shows error message
- [ ] End of list → shows "No more items"

---

#### 5.3 Performance Testing (1 day)
**✅ TODO 25: Measure performance**

**Metrics to Track:**
- [ ] Time to first page (should be <100ms)
- [ ] Time to scroll 100 items (should be smooth)
- [ ] Memory usage (check for leaks)
- [ ] Network requests (no redundant calls)

**Tools:**
- React DevTools Profiler
- Chrome Performance tab
- React Query Devtools

---

## 🔄 Migration Strategies

### Strategy 1: Big Bang (แนะนำ)
**Timeline:** 1-2 weeks
**Approach:** Migrate ทั้งหมดพร้อมกัน

**Pros:**
- ✅ เสร็จเร็ว
- ✅ Consistent behavior ทุก endpoint
- ✅ ง่ายต่อการ test

**Cons:**
- ❌ Risk สูงถ้ามีปัญหา
- ❌ ต้อง test ทุกอย่างก่อน deploy

**Steps:**
1. Branch out: `feature/cursor-pagination`
2. Complete Phase 1-4 (1 week)
3. Complete Phase 5 (3-4 days)
4. Deploy to staging
5. Full QA testing
6. Deploy to production

---

### Strategy 2: Gradual Migration (ถ้ากลัว risk)
**Timeline:** 2-3 weeks
**Approach:** Migrate ทีละ feature

**Pros:**
- ✅ Risk ต่ำ
- ✅ สามารถ rollback ได้ง่าย
- ✅ Test ทีละส่วน

**Cons:**
- ❌ ใช้เวลานาน
- ❌ Code อาจ inconsistent ระหว่าง migrate

**Steps:**
1. Week 1: Posts & Feed
2. Week 2: Comments & Notifications
3. Week 3: Profiles & Saved

---

## ⚠️ Critical Issues & Solutions

### Issue 1: Optimistic Updates
**Problem:** ยังคงใช้ optimistic post store ได้ไหม?
**Solution:** ✅ ได้! แค่ merge กับ cursor-based data

```typescript
const allPosts = useMemo(() => {
  const cursorPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (enableOptimisticUI && optimisticPosts.length > 0) {
    // ตัด optimistic posts ที่โหลดจริงแล้วออก
    const optimisticIds = new Set(optimisticPosts.map(p => p.id));
    const realPosts = cursorPosts.filter(p => !optimisticIds.has(p.id));

    return [...optimisticPosts, ...realPosts];
  }

  return cursorPosts;
}, [data, optimisticPosts, enableOptimisticUI]);
```

---

### Issue 2: Sort/Filter Changes
**Problem:** Cursor ไม่ทำงานถ้าเปลี่ยน sort
**Solution:** ⚠️ Reset query เมื่อ params เปลี่ยน

```typescript
// ✅ React Query จัดการให้อัตโนมัติ
// เพราะ queryKey รวม params อยู่แล้ว
useInfiniteQuery({
  queryKey: [...postKeys.lists(), 'infinite', params], // ← params เปลี่ยน = query ใหม่
  // ...
});

// ถ้าต้องการ manual reset
const queryClient = useQueryClient();
queryClient.resetQueries({
  queryKey: [...postKeys.lists(), 'infinite', { ...params, sort: newSort }]
});
```

---

### Issue 3: Mobile Drawer System
**Problem:** Drawer เปิดโพสต์ แล้ว scroll comments → infinite scroll ทำงานไหม?
**Solution:** ✅ ทำงาน! แค่ใช้ `useInfiniteComments` ใน drawer

```typescript
// MediaViewerDrawer.tsx
const {
  data: commentsData,
  fetchNextPage,
  hasNextPage,
} = useInfiniteComments(postId, { limit: 20 });

const comments = commentsData?.pages.flatMap((page) => page.comments) ?? [];

// Scroll detection
<InfiniteScroll
  dataLength={comments.length}
  next={fetchNextPage}
  hasMore={hasNextPage}
>
  {comments.map(comment => <CommentCard key={comment.id} comment={comment} />)}
</InfiniteScroll>
```

---

### Issue 4: Back Button Behavior
**Problem:** กด back หลัง scroll ลึก → กลับไปหน้าแรกหรือไม่?
**Solution:** ✅ React Query cache ช่วย!

```typescript
// React Query จะ cache pages ทุกหน้า
// เมื่อกลับมา จะเห็นข้อมูลเดิม (stale แต่ยัง usable)
// จากนั้นจะ refetch ใหม่ใน background

// ถ้าต้องการ preserve scroll position
import { useEffect } from 'react';

useEffect(() => {
  const scrollY = sessionStorage.getItem('scrollY');
  if (scrollY) {
    window.scrollTo(0, parseInt(scrollY));
    sessionStorage.removeItem('scrollY');
  }
}, []);

// เก็บ scroll position ก่อน navigate
const handlePostClick = () => {
  sessionStorage.setItem('scrollY', window.scrollY.toString());
  router.push(`/post/${postId}`);
};
```

---

## 📊 Testing Checklist

### Phase 1: Posts & Feed
- [ ] **Home feed (`/`)**
  - [ ] First load shows 20 posts
  - [ ] Scroll down → loads more posts
  - [ ] No duplicate posts after 10+ pages
  - [ ] Change sort (hot/new/top) → resets to page 1
  - [ ] Refresh → starts from page 1
  - [ ] End of feed → shows "No more posts"

- [ ] **Tag page (`/tag/[tagName]`)**
  - [ ] Infinite scroll works
  - [ ] Tag filter + cursor works correctly
  - [ ] Sort options work

- [ ] **User posts (`/profile/[username]`)**
  - [ ] Shows user's posts with infinite scroll
  - [ ] Pagination works

- [ ] **Saved posts (`/saved`)**
  - [ ] Shows saved posts
  - [ ] Unsave works
  - [ ] Infinite scroll works

---

### Phase 2: Comments & Notifications
- [ ] **Post comments**
  - [ ] Top-level comments load
  - [ ] Replies load (if using cursor)
  - [ ] Nested tree structure works
  - [ ] Vote on comments works

- [ ] **Notifications (`/notifications`)**
  - [ ] All notifications load
  - [ ] Unread filter works
  - [ ] Infinite scroll works
  - [ ] Mark as read works
  - [ ] Unread count updates

---

### Phase 3: Follows & Social
- [ ] **Followers (`/profile/[username]/followers`)**
  - [ ] List loads
  - [ ] Infinite scroll works
  - [ ] Follow/unfollow works

- [ ] **Following (`/profile/[username]/following`)**
  - [ ] List loads
  - [ ] Infinite scroll works

---

### General Tests
- [ ] **Performance**
  - [ ] First page load < 100ms
  - [ ] Smooth scrolling (60fps)
  - [ ] No memory leaks after 100+ items

- [ ] **Error Handling**
  - [ ] Network error → shows error message
  - [ ] Retry works
  - [ ] Empty state shows correctly

- [ ] **Mobile**
  - [ ] Drawer system works with cursor pagination
  - [ ] Pull-to-refresh works (ถ้ามี)
  - [ ] Mobile scroll smooth

---

## 🚀 Deployment Plan

### Pre-Deployment
- [ ] Complete all phases
- [ ] All tests pass
- [ ] Code review approved
- [ ] Staging environment tested
- [ ] Performance benchmarks met

### Deployment Steps
1. **Deploy to Staging**
   ```bash
   git checkout main
   git pull
   git merge feature/cursor-pagination
   git push origin main
   # CI/CD auto-deploy to staging
   ```

2. **QA Testing** (1-2 days)
   - Full regression testing
   - Performance testing
   - Mobile testing

3. **Deploy to Production**
   ```bash
   # Tag release
   git tag -a v2.0.0-cursor-pagination -m "Migrate to cursor-based pagination"
   git push origin v2.0.0-cursor-pagination

   # Deploy
   # (CI/CD or manual deploy)
   ```

4. **Monitor** (First 24 hours)
   - Watch error rates
   - Monitor performance
   - Check user feedback
   - Be ready to rollback

---

## 📈 Success Metrics

### Performance Targets
- ✅ First page load: < 100ms (currently ~2ms)
- ✅ Scroll to page 100: < 1s (currently would be ~5s with offset)
- ✅ No duplicate posts: 0% error rate
- ✅ Smooth scrolling: 60fps maintained

### User Experience Targets
- ✅ Infinite scroll feels seamless
- ✅ No visible loading delays
- ✅ End of feed clearly indicated
- ✅ Error states helpful and clear

---

## 🔧 Rollback Plan

### If Critical Issues Found

**Immediate Actions:**
1. Revert deployment
   ```bash
   git revert HEAD
   git push origin main
   ```

2. Re-deploy previous version

3. Investigate issues in development

**Partial Rollback (ถ้าเป็นไปได้):**
- Keep Phase 1 (types) เพราะ backward compatible
- Revert Phase 2-4 (hooks & components)
- Fix issues
- Re-deploy incrementally

---

## 📞 Support & Resources

### Documentation
- Backend API: `refactor_code/BACKEND_API_CHANGES_SUMMARY.md`
- Current System: `refactor_code/[NEW]_FULL_SYSTEM_ANALYSIS.md`
- React Query Docs: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries

### Team Contacts
- Backend Team: [Contact for API issues]
- Frontend Lead: [Contact for architecture decisions]
- QA Team: [Contact for testing support]

---

## ✅ Final Checklist

### Before Starting
- [ ] Read this document thoroughly
- [ ] Read backend API documentation
- [ ] Understand cursor-based pagination concept
- [ ] Set up development environment
- [ ] Create feature branch

### During Development
- [ ] Follow phase order (1→2→3→4→5)
- [ ] Test each phase before moving to next
- [ ] Keep todo list updated
- [ ] Document any issues/solutions
- [ ] Regular commits with clear messages

### Before Deployment
- [ ] All tests pass (unit + integration + E2E)
- [ ] Code review completed
- [ ] Performance benchmarks met
- [ ] Staging environment tested
- [ ] Rollback plan ready
- [ ] Team notified of deployment

---

## 📊 Timeline Summary

| Phase | Duration | Dependencies | Risk Level |
|-------|----------|--------------|------------|
| Phase 1: Foundation | 1-2 days | None | 🔴 HIGH (must complete first) |
| Phase 2: Hooks | 2-3 days | Phase 1 | 🔴 HIGH (core functionality) |
| Phase 3: Components | 2-3 days | Phase 2 | 🟡 MEDIUM (UI updates) |
| Phase 4: Pages | 1-2 days | Phase 3 | 🟡 MEDIUM (integration) |
| Phase 5: Testing | 2-3 days | Phase 4 | 🟢 LOW (quality assurance) |

**Total Timeline:** 8-13 days (1.5 - 2.5 weeks)

---

## 🎯 Quick Start Guide

### Day 1: Setup & Phase 1
```bash
# 1. Create branch
git checkout -b feature/cursor-pagination

# 2. Update types (30 mins)
# Edit: src/shared/types/api.ts
# Add: CursorPaginationMeta, etc.

# 3. Update API services (2-3 hours)
# Edit: post.service.ts, comment.service.ts, etc.

# 4. Test with Postman
# Verify all API calls work
```

### Day 2-3: Phase 2
```bash
# 5. Update React Query hooks
# Edit: usePosts.ts → useInfinitePosts
# Edit: useComments.ts → useInfiniteComments
# etc.

# 6. Test hooks in isolation
# Use React Query Devtools
```

### Day 4-5: Phase 3
```bash
# 7. Update components
# Edit: InfinitePostFeed.tsx
# Edit: CommentTree.tsx (if needed)
# Edit: NotificationList.tsx

# 8. Test components
```

### Day 6-7: Phase 4 & 5
```bash
# 9. Update pages
# Test full user flows

# 10. Write/update tests
# Run full test suite
```

### Day 8+: Deploy
```bash
# 11. Code review
# 12. Staging deployment
# 13. QA testing
# 14. Production deployment
```

---

## 💡 Pro Tips

1. **Start Small, Test Early**
   - Complete Phase 1 fully before moving to Phase 2
   - Test each service function individually

2. **Use React Query Devtools**
   - Watch query states
   - Check cache behavior
   - Debug pagination issues

3. **Cursor is Opaque**
   - Don't try to decode or modify cursor strings
   - Just pass them as-is to next request

4. **Reset is Your Friend**
   - When changing filters → query resets automatically (thanks to queryKey)
   - Embrace the reset behavior

5. **Infinite Scroll vs Load More**
   - Use infinite scroll for feeds (better UX)
   - Use "Load More" button for slower connections or preference

6. **Mobile First**
   - Test on mobile devices
   - Drawer system should work seamlessly

7. **Monitor Backend**
   - Check backend logs during testing
   - Verify cursor encoding/decoding works

---

**Last Updated:** 14 พฤศจิกายน 2568
**Status:** 📋 Ready for Implementation
**Estimated Effort:** 1.5 - 2.5 weeks
**Team Size:** 1-2 developers

**Next Steps:**
1. Review this plan with team
2. Get approval
3. Create feature branch
4. Start Phase 1

---

**Questions or Issues?**
- Review backend documentation
- Check React Query docs
- Ask backend team for API clarifications
- Update this document as you learn!
