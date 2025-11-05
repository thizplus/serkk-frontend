# 📝 Phase 2: Core Content Features

**Duration:** Week 2 (5-7 days)
**Priority:** 🟠 High
**Dependencies:** Phase 1 (Authentication) must be completed
**Status:** 📝 Planning

---

## 🎯 Objectives

1. Implement post feed with pagination
2. Create post functionality
3. Post detail page with full content
4. Edit post functionality
5. Delete post functionality
6. My posts page
7. Basic post interactions (preview)

---

## 📋 Tasks Breakdown

### Step 2.1: Post Feed Implementation (Home Page)
**Duration:** 2 days
**Files to Modify:**
- [ ] `app/page.tsx`
- [ ] `components/post/PostFeed.tsx`
- [ ] `components/post/PostCard.tsx`

**Current Status:**
- ✅ Page structure exists (CSR)
- ✅ Using mock data
- 🔄 Need to connect to real API

**Features to Implement:**
- [ ] Fetch posts from API (`postService.list()` or `postService.getFeed()`)
- [ ] Pagination (infinite scroll or load more button)
- [ ] Loading skeleton
- [ ] Empty state
- [ ] Error handling
- [ ] Pull-to-refresh (mobile)
- [ ] Sorting options (hot, new, top)

**Implementation Steps:**

#### A. Update page.tsx
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import postService from '@/lib/services/api/post.service';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      // Use getFeed() if authenticated, list() if public
      const response = isAuthenticated
        ? await postService.getFeed({ offset: 0, limit: 20, sortBy: 'hot' })
        : await postService.list({ offset: 0, limit: 20, sortBy: 'hot' });

      if (response.success) {
        setPosts(response.data.posts);
      }
    } catch (err) {
      setError('ไม่สามารถโหลดโพสต์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of implementation
}
```

#### B. Add Pagination
- [ ] Implement infinite scroll with Intersection Observer
- [ ] Or load more button
- [ ] Track offset/page number
- [ ] Merge new posts with existing

#### C. Add Sorting
- [ ] Tabs or dropdown for sorting (Hot, New, Top, Controversial)
- [ ] Update API call when sort changes
- [ ] Remember user preference

**Checklist:**
- [ ] Connect to postService.getFeed() / list()
- [ ] Implement pagination
- [ ] Add loading skeleton
- [ ] Add empty state ("ยังไม่มีโพสต์")
- [ ] Handle errors gracefully
- [ ] Add sort options
- [ ] Test with different user states (logged in/out)

---

### Step 2.2: Create Post Page
**Duration:** 1.5 days
**Files to Modify:**
- [ ] `app/create-post/page.tsx`
- [ ] `components/post/CreatePostForm.tsx`

**Current Status:**
- ✅ Page exists (CSR, Protected)
- ✅ Basic form structure might exist
- 🔄 Need to connect to API

**Features to Implement:**
- [ ] Title input (required, max 300 chars)
- [ ] Content textarea (required, max 40000 chars, with markdown preview)
- [ ] Tags input (max 5 tags, autocomplete from tagService)
- [ ] Media upload (optional, images/videos)
- [ ] Preview mode
- [ ] Save as draft (future)
- [ ] Form validation
- [ ] Loading state during submit
- [ ] Success/error feedback
- [ ] Redirect to new post after creation

**Implementation Steps:**

#### A. Form Structure
```typescript
const createPostSchema = z.object({
  title: z.string().min(1, 'กรุณาใส่หัวข้อ').max(300, 'หัวข้อยาวเกินไป'),
  content: z.string().min(1, 'กรุณาใส่เนื้อหา').max(40000, 'เนื้อหายาวเกินไป'),
  tags: z.array(z.string()).max(5, 'สามารถเลือกได้สูงสุด 5 แท็ก').optional(),
  mediaIds: z.array(z.string()).max(10, 'สามารถอัพโหลดได้สูงสุด 10 ไฟล์').optional(),
});
```

#### B. Connect to API
```typescript
const onSubmit = async (data: CreatePostFormData) => {
  setIsLoading(true);
  try {
    const response = await postService.create({
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      mediaIds: data.mediaIds || [],
    });

    if (response.success) {
      toast.success('สร้างโพสต์สำเร็จ!');
      router.push(`/post/${response.data.id}`);
    }
  } catch (error) {
    toast.error('ไม่สามารถสร้างโพสต์ได้');
  } finally {
    setIsLoading(false);
  }
};
```

#### C. Tag Input with Autocomplete
- [ ] Use tagService.search() for autocomplete
- [ ] Show popular tags
- [ ] Allow creating new tags
- [ ] Visual tag chips

#### D. Media Upload (Basic)
- [ ] Upload button
- [ ] Preview uploaded media
- [ ] Remove media option
- [ ] Connect to mediaService.uploadImage() / uploadVideo()
- [ ] Show upload progress

**Checklist:**
- [ ] Form validation with zod
- [ ] Connect to postService.create()
- [ ] Add character counters
- [ ] Implement tag autocomplete
- [ ] Basic media upload (can be enhanced in Phase 6)
- [ ] Preview mode toggle
- [ ] Loading states
- [ ] Success feedback & redirect

---

### Step 2.3: Post Detail Page
**Duration:** 1.5 days
**Files to Modify:**
- [ ] `app/post/[id]/page.tsx`
- [ ] `components/post/PostCard.tsx` (reuse or create detail variant)

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Fetch post by ID (`postService.getById()`)
- [ ] Display full post content
- [ ] Show post metadata (author, date, votes, comments count)
- [ ] Author info with link to profile
- [ ] Tags with links
- [ ] Media gallery (if any)
- [ ] Loading state
- [ ] 404 handling for non-existent posts
- [ ] SEO optimization (metadata)
- [ ] Social sharing preview

**Rendering Strategy:**
- Use **SSR** for initial load (SEO-friendly)
- Hydrate with CSR for interactions

**Implementation:**

#### A. Server-Side Data Fetching (Optional)
```typescript
// app/post/[id]/page.tsx
export default async function PostDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Server-side fetch for SEO
  let initialPost = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/posts/${params.id}`
    );
    if (response.ok) {
      const data = await response.json();
      initialPost = data.data;
    }
  } catch (error) {
    console.error('Failed to fetch post', error);
  }

  return <PostDetailClient postId={params.id} initialPost={initialPost} />;
}
```

#### B. Client Component
```typescript
'use client';

function PostDetailClient({ postId, initialPost }) {
  const [post, setPost] = useState(initialPost);
  const [isLoading, setIsLoading] = useState(!initialPost);

  useEffect(() => {
    if (!initialPost) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await postService.getById(postId);
      if (response.success) {
        setPost(response.data);
      }
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  // ... render post detail
}
```

**Checklist:**
- [ ] SSR initial data fetch
- [ ] CSR fallback
- [ ] Display full content (with markdown rendering if needed)
- [ ] Show author info
- [ ] Show tags
- [ ] Display media
- [ ] Add metadata for SEO
- [ ] Handle 404 errors
- [ ] Add breadcrumbs

---

### Step 2.4: Edit Post Page
**Duration:** 1 day
**Files to Modify:**
- [ ] `app/edit-post/[id]/page.tsx`
- [ ] Reuse `components/post/CreatePostForm.tsx` or create edit variant

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Fetch existing post data
- [ ] Populate form with existing data
- [ ] Validate ownership (only author can edit)
- [ ] Update post via API
- [ ] Form validation (same as create)
- [ ] Loading/saving states
- [ ] Success/error feedback
- [ ] Redirect after save

**Implementation:**

#### A. Fetch Existing Post
```typescript
useEffect(() => {
  const fetchPost = async () => {
    try {
      const response = await postService.getById(postId);
      if (response.success) {
        const post = response.data;

        // Check ownership
        if (post.author.id !== user?.id) {
          toast.error('คุณไม่มีสิทธิ์แก้ไขโพสต์นี้');
          router.push('/');
          return;
        }

        // Populate form
        form.reset({
          title: post.title,
          content: post.content,
          tags: post.tags.map(t => t.name),
        });
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์ได้');
    }
  };

  fetchPost();
}, [postId]);
```

#### B. Update Post
```typescript
const onSubmit = async (data: EditPostFormData) => {
  setIsLoading(true);
  try {
    const response = await postService.update(postId, {
      title: data.title,
      content: data.content,
      // Note: tags cannot be updated in backend spec
    });

    if (response.success) {
      toast.success('อัพเดทโพสต์สำเร็จ!');
      router.push(`/post/${postId}`);
    }
  } catch (error) {
    toast.error('ไม่สามารถอัพเดทโพสต์ได้');
  } finally {
    setIsLoading(false);
  }
};
```

**Checklist:**
- [ ] Fetch post data
- [ ] Populate form
- [ ] Validate ownership
- [ ] Connect to postService.update()
- [ ] Handle errors
- [ ] Success feedback & redirect
- [ ] Add "Cancel" button (goes back to post detail)

---

### Step 2.5: Delete Post Functionality
**Duration:** 0.5 day
**Files to Modify:**
- [ ] `components/post/PostActions.tsx`
- [ ] `app/post/[id]/page.tsx` (if has delete button here too)

**Current Status:**
- ✅ PostActions component exists
- 🔄 Need to connect to API

**Features to Implement:**
- [ ] Delete button (only for post author)
- [ ] Confirmation dialog
- [ ] API call to delete
- [ ] Loading state during deletion
- [ ] Success feedback
- [ ] Redirect to home after deletion
- [ ] Handle errors

**Implementation:**

```typescript
const handleDelete = async (postId: string) => {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?')) {
    return;
  }

  setIsDeleting(true);
  try {
    const response = await postService.delete(postId);
    if (response.success) {
      toast.success('ลบโพสต์สำเร็จ!');
      router.push('/');
    }
  } catch (error) {
    toast.error('ไม่สามารถลบโพสต์ได้');
  } finally {
    setIsDeleting(false);
  }
};
```

**Checklist:**
- [ ] Show delete button only for post author
- [ ] Add confirmation dialog (use AlertDialog from shadcn)
- [ ] Connect to postService.delete()
- [ ] Loading state
- [ ] Success feedback
- [ ] Redirect after deletion

---

### Step 2.6: My Posts Page
**Duration:** 1 day
**Files to Modify:**
- [ ] `app/my-posts/page.tsx`

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Fetch user's own posts (`postService.getByAuthor(userId)`)
- [ ] Display in grid/list
- [ ] Pagination
- [ ] Empty state ("คุณยังไม่มีโพสต์")
- [ ] Quick actions (edit, delete)
- [ ] Draft posts (future)
- [ ] Stats (total posts, total votes, etc.)

**Implementation:**

```typescript
'use client';

export default function MyPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchMyPosts();
    }
  }, [user?.id]);

  const fetchMyPosts = async () => {
    try {
      const response = await postService.getByAuthor(user!.id, {
        offset: 0,
        limit: 20,
        sortBy: 'new',
      });

      if (response.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์ของคุณได้');
    } finally {
      setIsLoading(false);
    }
  };

  // ... render posts
}
```

**Checklist:**
- [ ] Fetch user's posts
- [ ] Display posts
- [ ] Add quick edit/delete buttons
- [ ] Pagination
- [ ] Empty state
- [ ] Loading skeleton
- [ ] Show post stats

---

## ✅ Definition of Done

### Functional Requirements
- [ ] Users can view post feed on home page
- [ ] Users can create new posts
- [ ] Users can view post details
- [ ] Users can edit their own posts
- [ ] Users can delete their own posts
- [ ] Users can view their own posts in My Posts page
- [ ] Posts display author, date, votes, comments count
- [ ] Posts can have tags
- [ ] Pagination works correctly
- [ ] Empty states are shown when appropriate

### Technical Requirements
- [ ] All forms have validation
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Success/error toasts are displayed
- [ ] Code follows TypeScript best practices
- [ ] Mobile responsive
- [ ] SEO metadata is set for post detail pages

### Testing Checklist
- [ ] ✅ View post feed → Shows posts
- [ ] ✅ Create post → Success, redirects to new post
- [ ] ✅ View post detail → Shows full content
- [ ] ✅ Edit own post → Success, updates content
- [ ] ✅ Try to edit someone else's post → Denied
- [ ] ✅ Delete own post → Success, redirects to home
- [ ] ✅ View My Posts → Shows only user's posts
- [ ] ✅ Pagination → Loads more posts
- [ ] ✅ Empty states → Shows appropriate messages

---

## 🔜 Next Steps

After completing Phase 2, proceed to:
→ **Phase 3: Social Interactions** (`03-phase3-social-interactions.md`)
- Comments system
- Voting system
- Save/bookmark functionality
