# 📱 Mobile Drawer System - Implementation Plan

## 🎯 Vision & Goals

### Desktop (≥768px)
- **Maintain existing flow**: Navigate to dedicated pages
- **Examples**:
  - Click post → `/post/[id]` page
  - Click comment icon → `/post/[id]` page
  - Click media → `/post/[id]` page with media focus

### Mobile (<768px)
- **Drawer-first UX**: Keep user in feed context
- **Examples**:
  - Click post → Open **Post Detail Drawer** (media + vote + comments)
  - Click comment icon → Open **Comment Drawer** (comments only)
  - Click media → Open **Media Viewer Drawer** (media gallery + interactions)

### Future Extensibility
- User profile drawer
- Tag/search drawer
- Notification drawer
- Create post drawer
- Settings drawer

---

## 🏗️ System Architecture

### 1. Device Detection Strategy

```typescript
// src/shared/hooks/useDeviceType.ts
import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return deviceType;
}

// Utility hook for conditional behavior
export function useIsMobile(): boolean {
  const deviceType = useDeviceType();
  return deviceType === 'mobile';
}
```

**Why**:
- Real-time detection, handles device rotation
- Reusable across all components
- Can treat tablet as mobile or desktop based on context

---

### 2. Drawer Management System

```typescript
// src/shared/contexts/DrawerContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Post } from '@/types/models';

export type DrawerType =
  | 'post-detail'      // Full post with media + comments
  | 'comment-only'     // Comments only
  | 'media-viewer'     // Media gallery only
  | 'user-profile'     // User profile (future)
  | 'create-post'      // Create post form (future)
  | 'notifications';   // Notifications (future)

interface DrawerState {
  type: DrawerType | null;
  data: any; // Flexible data payload
  isOpen: boolean;
}

interface DrawerContextValue {
  drawer: DrawerState;
  openDrawer: (type: DrawerType, data: any) => void;
  closeDrawer: () => void;
  updateDrawerData: (data: any) => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState>({
    type: null,
    data: null,
    isOpen: false,
  });

  const openDrawer = (type: DrawerType, data: any) => {
    setDrawer({ type, data, isOpen: true });
  };

  const closeDrawer = () => {
    setDrawer({ type: null, data: null, isOpen: false });
  };

  const updateDrawerData = (data: any) => {
    setDrawer((prev) => ({ ...prev, data }));
  };

  return (
    <DrawerContext.Provider value={{ drawer, openDrawer, closeDrawer, updateDrawerData }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
}
```

**Why**:
- Centralized drawer state management
- Type-safe drawer types
- Easy to add new drawer types
- Single source of truth

---

### 3. Drawer Components Architecture

```
src/shared/components/drawers/
├── DrawerManager.tsx           # Master component that renders active drawer
├── PostDetailDrawer.tsx        # Full post (media + vote + comments)
├── CommentDrawer.tsx           # Comments only (from POC6)
├── MediaViewerDrawer.tsx       # Media gallery (from POC5)
├── UserProfileDrawer.tsx       # Future: User profile
├── CreatePostDrawer.tsx        # Future: Create post form
└── NotificationDrawer.tsx      # Future: Notifications
```

#### `DrawerManager.tsx` - Master Renderer
```typescript
// src/shared/components/drawers/DrawerManager.tsx
"use client";

import { useDrawer } from '@/shared/contexts/DrawerContext';
import { PostDetailDrawer } from './PostDetailDrawer';
import { CommentDrawer } from './CommentDrawer';
import { MediaViewerDrawer } from './MediaViewerDrawer';
// Import other drawers as they're built

export function DrawerManager() {
  const { drawer, closeDrawer } = useDrawer();

  if (!drawer.isOpen || !drawer.type) return null;

  switch (drawer.type) {
    case 'post-detail':
      return (
        <PostDetailDrawer
          post={drawer.data.post}
          initialMediaIndex={drawer.data.initialMediaIndex}
          onClose={closeDrawer}
        />
      );

    case 'comment-only':
      return (
        <CommentDrawer
          post={drawer.data.post}
          onClose={closeDrawer}
        />
      );

    case 'media-viewer':
      return (
        <MediaViewerDrawer
          post={drawer.data.post}
          media={drawer.data.media}
          initialIndex={drawer.data.initialIndex}
          onClose={closeDrawer}
        />
      );

    // Future drawers
    case 'user-profile':
      // return <UserProfileDrawer ... />
      return null;

    case 'create-post':
      // return <CreatePostDrawer ... />
      return null;

    case 'notifications':
      // return <NotificationDrawer ... />
      return null;

    default:
      return null;
  }
}
```

**Why**:
- Single import in root layout
- Lazy loading ready
- Easy to add new drawers
- Clean separation of concerns

---

### 4. Smart PostCard Component

```typescript
// src/features/posts/components/PostCard.tsx (ENHANCED)
"use client";

import { useRouter } from "next/navigation";
import { useIsMobile } from "@/shared/hooks/useDeviceType";
import { useDrawer } from "@/shared/contexts/DrawerContext";
import type { Post } from "@/types/models";

interface PostCardProps {
  post: Post;
  compact?: boolean;
  disableNavigation?: boolean;
  isOptimistic?: boolean;
  optimisticData?: { ... };
}

export function PostCard({
  post,
  compact = false,
  disableNavigation = false,
  isOptimistic = false,
  optimisticData,
}: PostCardProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { openDrawer } = useDrawer();

  // ... existing hooks

  // 🎯 SMART POST CLICK HANDLER
  const handlePostClick = () => {
    if (disableNavigation) return;

    if (isMobile) {
      // Mobile: Open drawer
      openDrawer('post-detail', {
        post,
        initialMediaIndex: 0,
      });
    } else {
      // Desktop: Navigate to page
      router.push(`/post/${post.id}`);
    }
  };

  // 🎯 SMART COMMENT CLICK HANDLER
  const handleCommentClick = () => {
    if (isMobile) {
      // Mobile: Open comment drawer
      openDrawer('comment-only', { post });
    } else {
      // Desktop: Navigate to post page
      router.push(`/post/${post.id}`);
    }
  };

  // 🎯 SMART MEDIA CLICK HANDLER
  const handleMediaClick = (index: number = 0) => {
    if (isMobile) {
      // Mobile: Open media viewer drawer
      const mediaItems = post.media.map((m) => ({
        id: m.id,
        url: m.url,
        type: m.type,
        thumbnail: m.thumbnail,
      }));

      openDrawer('media-viewer', {
        post,
        media: mediaItems,
        initialIndex: index,
      });
    } else {
      // Desktop: Navigate to post page with media focus
      router.push(`/post/${post.id}?media=${index}`);
    }
  };

  return (
    <div className="bg-card border overflow-hidden hover:border-accent transition-colors">
      {/* Header - clickable */}
      <div onClick={handlePostClick} className="cursor-pointer">
        {/* Author info */}
      </div>

      {/* Title - clickable */}
      <h1 onClick={handlePostClick} className="cursor-pointer">
        {post.title}
      </h1>

      {/* Media - clickable with index */}
      {post.media && post.media.length > 0 && (
        <div onClick={() => handleMediaClick(0)}>
          <MediaDisplay media={post.media} variant="feed" />
        </div>
      )}

      {/* Comment button */}
      <button onClick={handleCommentClick}>
        <MessageSquare size={16} />
        <span>{post.commentCount}</span>
      </button>

      {/* Other actions... */}
    </div>
  );
}
```

**Why**:
- Single component works for both mobile and desktop
- No props needed for drawer behavior
- Automatic device detection
- Future-proof

---

### 5. Root Layout Integration

```typescript
// app/layout.tsx (ROOT LAYOUT)
import { DrawerProvider } from '@/shared/contexts/DrawerContext';
import { DrawerManager } from '@/shared/components/drawers/DrawerManager';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <body>
        <QueryClientProvider client={queryClient}>
          <DrawerProvider>
            {/* Main app content */}
            {children}

            {/* Global drawer manager - renders active drawer */}
            <DrawerManager />
          </DrawerProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

**Why**:
- One-time setup
- Works across entire app
- No prop drilling
- Clean architecture

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Priority: HIGH)
- [ ] Create `src/shared/hooks/useDeviceType.ts`
- [ ] Create `src/shared/contexts/DrawerContext.tsx`
- [ ] Create `src/shared/components/drawers/` directory
- [ ] Add `DrawerProvider` to root layout
- [ ] Add `DrawerManager` to root layout

### Phase 2: Core Drawers (Priority: HIGH)
- [ ] Migrate `POC5_Drawer.tsx` → `PostDetailDrawer.tsx`
  - Full post content
  - Media gallery (vertical scroll)
  - Vote buttons
  - Comment form + tree
  - Height: 100vh

- [ ] Migrate `POC6_CommentDrawer.tsx` → `CommentDrawer.tsx`
  - Post title + vote (sticky header)
  - Comment form + tree
  - Height: 90vh

- [ ] Create `MediaViewerDrawer.tsx`
  - Media gallery only (horizontal swipe)
  - Similar to POC1-4 but without comments
  - Height: 100vh

### Phase 3: Smart Components (Priority: HIGH)
- [ ] Update `PostCard.tsx` with smart handlers:
  - `handlePostClick` → drawer on mobile, navigate on desktop
  - `handleCommentClick` → drawer on mobile, navigate on desktop
  - `handleMediaClick` → drawer on mobile, navigate on desktop

- [ ] Update other post-related components:
  - `PostDetail.tsx` (if exists)
  - `MediaGrid.tsx`
  - `MediaItem.tsx`

### Phase 4: Testing (Priority: HIGH)
- [ ] Test on real mobile device (not just Chrome DevTools)
- [ ] Test device rotation (portrait ↔ landscape)
- [ ] Test tablet behavior (decide: mobile or desktop?)
- [ ] Test all drawer types:
  - Post detail drawer
  - Comment drawer
  - Media viewer drawer

- [ ] Test state persistence:
  - Votes update in drawer → reflect in feed
  - Comments added in drawer → reflect in feed
  - Close drawer → feed shows updated data

### Phase 5: Future Enhancements (Priority: MEDIUM)
- [ ] User Profile Drawer
  - User info + posts + followers
  - Quick follow/unfollow

- [ ] Create Post Drawer
  - Post form in drawer
  - Media upload preview
  - Tag selection

- [ ] Notification Drawer
  - Real-time notifications
  - Mark as read

- [ ] Search/Filter Drawer
  - Quick filters
  - Tag search
  - User search

### Phase 6: Optimization (Priority: LOW)
- [ ] Lazy load drawer components
- [ ] Add drawer transition animations
- [ ] Implement drawer stack (drawer within drawer?)
- [ ] Add gesture hints (swipe down to close)
- [ ] Preload drawer data on hover (desktop)

---

## 🎨 UX Patterns

### Mobile Drawer Behaviors

| Action | Desktop | Mobile |
|--------|---------|--------|
| Click post title | Navigate to `/post/[id]` | Open **Post Detail Drawer** |
| Click post media | Navigate to `/post/[id]` | Open **Media Viewer Drawer** |
| Click comment icon | Navigate to `/post/[id]` | Open **Comment Drawer** |
| Click author avatar | Navigate to `/profile/[username]` | Open **User Profile Drawer** (future) |
| Click tag | Navigate to `/tag/[name]` | Navigate to `/tag/[name]` (keep page) |
| Click notification | Navigate to related page | Open related drawer |

### Drawer Hierarchy

```
Feed Page (Mobile)
  ├─ Post Detail Drawer (100vh)
  │   ├─ Media (vertical scroll)
  │   ├─ Vote buttons
  │   ├─ Comment form
  │   └─ Comment tree
  │
  ├─ Comment Drawer (90vh)
  │   ├─ Post info (sticky)
  │   ├─ Comment form
  │   └─ Comment tree
  │
  └─ Media Viewer Drawer (100vh)
      ├─ Media gallery (horizontal swipe)
      ├─ Close button
      └─ Counter (1/5)
```

---

## 🔄 Migration Strategy

### Step 1: Add Infrastructure (No Breaking Changes)
```bash
# Week 1
- Add DrawerContext
- Add DrawerManager
- Add useDeviceType hook
- Wrap app in DrawerProvider
```

### Step 2: Create Drawer Components (Parallel Development)
```bash
# Week 1-2
- Build PostDetailDrawer (from POC5)
- Build CommentDrawer (from POC6)
- Build MediaViewerDrawer (new)
```

### Step 3: Update PostCard (Feature Flag)
```typescript
// Environment variable for gradual rollout
const ENABLE_MOBILE_DRAWERS = process.env.NEXT_PUBLIC_ENABLE_MOBILE_DRAWERS === 'true';

const handlePostClick = () => {
  if (ENABLE_MOBILE_DRAWERS && isMobile) {
    openDrawer('post-detail', { post });
  } else {
    router.push(`/post/${post.id}`);
  }
};
```

### Step 4: Gradual Rollout
```bash
# Week 3
- Enable for 10% of users (A/B testing)
- Monitor metrics: engagement, bounce rate, errors
- Collect user feedback

# Week 4
- Enable for 50% of users
- Fix issues found

# Week 5
- Enable for 100% of users
- Remove feature flag
```

### Step 5: Cleanup
```bash
# Week 6
- Remove POC code (app/poc-media-viewer/)
- Remove feature flags
- Update documentation
```

---

## 📊 Success Metrics

### User Engagement
- [ ] Time spent on feed (expect: +30%)
- [ ] Comments per session (expect: +20%)
- [ ] Posts viewed per session (expect: +40%)

### Technical Performance
- [ ] Drawer open time (target: <200ms)
- [ ] Smooth 60fps animations
- [ ] No layout shift (CLS: 0)
- [ ] Memory usage (target: <50MB)

### User Satisfaction
- [ ] Net Promoter Score (NPS)
- [ ] User feedback surveys
- [ ] Support tickets (expect: -50%)

---

## 🚨 Potential Issues & Solutions

### Issue 1: URL State Management
**Problem**: User opens drawer, but URL doesn't change. Browser back button doesn't work.

**Solution**: Update URL with query params
```typescript
const openDrawer = (type: DrawerType, data: any) => {
  // Update URL without navigation
  const url = new URL(window.location.href);
  url.searchParams.set('drawer', type);
  url.searchParams.set('id', data.post?.id || '');
  window.history.pushState({}, '', url);

  setDrawer({ type, data, isOpen: true });
};

// Handle browser back button
useEffect(() => {
  const handlePopState = () => {
    closeDrawer();
  };
  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, []);
```

### Issue 2: Deep Linking
**Problem**: User shares link with drawer state, but it doesn't work.

**Solution**: Parse URL on load
```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const drawerType = params.get('drawer');
  const postId = params.get('id');

  if (drawerType && postId && isMobile) {
    // Fetch post data and open drawer
    fetchPost(postId).then((post) => {
      openDrawer(drawerType as DrawerType, { post });
    });
  }
}, []);
```

### Issue 3: Video Playback
**Problem**: Video keeps playing when drawer closes.

**Solution**: Pause on close
```typescript
const closeDrawer = () => {
  // Pause all videos
  document.querySelectorAll('video').forEach((video) => {
    video.pause();
  });

  setDrawer({ type: null, data: null, isOpen: false });
};
```

### Issue 4: Scroll Lock
**Problem**: Background feed scrolls when drawer is open.

**Solution**: Lock body scroll
```typescript
useEffect(() => {
  if (drawer.isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
}, [drawer.isOpen]);
```

---

## 🎓 Learning from POC

### What Worked Well ✅
1. **Shadcn Drawer** (Vaul): Perfect for mobile, swipe-down to dismiss
2. **Vertical Scroll**: More familiar than horizontal swipe for content
3. **100vh**: Full-screen feels native
4. **Integrated Comments**: All-in-one experience
5. **Simple Stack**: No complex virtualization needed

### What to Avoid ❌
1. **Virtualization**: Overkill for <100 images, causes bugs
2. **Complex Gestures**: Keep it simple (vertical scroll + swipe down)
3. **Separate Media/Comment Drawers**: Users prefer all-in-one (POC5 > POC6)
4. **Image Counters**: Visual noise, remove them
5. **Borders on Media**: Break immersion, use edge-to-edge

### Key Insights 💡
1. **Mobile users want speed**: Drawers beat page navigation
2. **Context matters**: Staying in feed > full page transitions
3. **One drawer type dominates**: Post Detail Drawer (POC5) is most useful
4. **Comment-only drawer has niche use**: Quick replies without media
5. **Desktop users are fine**: No need to change working patterns

---

## 🚀 Next Steps

1. **Review this plan** with team/stakeholders
2. **Create GitHub issues** for each checklist item
3. **Set up feature flag** in environment config
4. **Start Phase 1** (Foundation) this week
5. **Build Phase 2** (Core Drawers) next week
6. **Launch beta** to small user group in 2 weeks

---

## 📚 Technical References

- **Vaul (Shadcn Drawer)**: https://github.com/emilkowalski/vaul
- **React Context**: https://react.dev/reference/react/useContext
- **Next.js Client Components**: https://nextjs.org/docs/app/building-your-application/rendering/client-components
- **Mobile-First Design**: https://web.dev/responsive-web-design-basics/
- **Feature Flags**: https://docs.flagsmith.com/

---

**Created**: 2025-01-14
**Version**: 1.0
**Status**: 📋 Planning Phase
