# การวิเคราะห์ระบบ SUEKK ฉบับสมบูรณ์

วันที่วิเคราะห์: 14 พฤศจิกายน 2568

---

## 📊 ภาพรวมระบบ

**SUEKK** ("ใครไม่เสือก ไทยเสือก") เป็นแพลตฟอร์มโซเชียลมีเดียภาษาไทย สร้างด้วย Next.js 16 มี **19 หน้า/routes** หลัก

### Technology Stack

- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.0
- **State Management**: Zustand + TanStack React Query v5
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + Custom components
- **Real-time**: WebSocket connections
- **Media**: Video streaming (HLS.js), Image lightbox (yet-another-react-lightbox)
- **Forms**: Native React forms with validation
- **Authentication**: JWT-based with OAuth support (Google)
- **PWA**: Service Worker with auto-update

---

## 📱 หน้าต่างๆ ในระบบ (19 Routes)

### 1. หน้าหลัก / Content Discovery (4 หน้า)

#### หน้าแรก (`/`)
**Location**: `app/page.tsx`

**Features**:
- ฟีด post แบบ infinite scroll เรียงตาม "hot"
- Post cards พร้อมรูป/วิดีโอแบบ edge-to-edge
- ปุ่มโหวต (upvote/downvote), จำนวนคอมเมนต์
- ปุ่ม share, save, report
- ปุ่ม floating "สร้างโพสต์"
- Real-time updates ผ่าน optimistic UI

**Layout**: AppLayout with sidebar navigation

**Data Fetching**: useInfinitePosts hook with pagination

---

#### หน้าค้นหา (`/search`)
**Location**: `app/search/page.tsx`

**Features**:
- Search bar พร้อม query param sync
- Tabs: Posts / Users
- ผลลัพธ์แบบ real-time
- User cards พร้อมปุ่ม follow
- Post previews พร้อม inline actions

**Search Types**: Full-text search on posts/users/tags

---

#### หน้าแท็ก (`/tag/[tagName]`)
**Location**: `app/tag/[tagName]/page.tsx`

**Features**:
- Posts ที่กรองตามแท็ก
- Sort options: Hot, New, Top
- Infinite scroll
- ปุ่มสร้างโพสต์พร้อมแท็กที่เลือกไว้แล้ว

**Data**: Dynamic with tag statistics

---

#### หน้าโพสต์ที่บันทึก (`/saved`)
**Location**: `app/saved/page.tsx`

**Features**:
- คอลเลคชันโพสต์ที่ bookmark ไว้
- ปุ่ม unsave แบบ quick action
- Empty state guidance เมื่อไม่มีข้อมูล

**Auth Required**: Login redirect

---

### 2. การจัดการโพสต์ (4 หน้า)

#### รายละเอียดโพสต์ (`/post/[id]`)
**Location**: `app/post/[id]/page.tsx`

**Features**:
- แสดงโพสต์แบบเต็ม พร้อมสื่อแบบ edge-to-edge
- ระบบคอมเมนต์แบบซ้อนกัน (tree structure, unlimited depth)
- ปุ่มโหวตทั้งโพสต์และคอมเมนต์
- ตอบกลับคอมเมนต์แบบ inline
- แก้ไข/ลบคอมเมนต์ของตัวเอง
- แสดง crosspost (embedded source post)
- Share, save, report actions

**Data**: ISR with 5-minute revalidation

**SEO**: Dynamic metadata with OG images

---

#### สร้างโพสต์ (`/create-post`)
**Location**: `app/create-post/page.tsx`

**Features**:
- Rich text editor สำหรับ title และ content
- Media upload (images/videos) พร้อม progress tracking
- Tag input พร้อม autocomplete
- Crosspost creation (from query param `?source_id=`)
- Draft auto-save to localStorage
- Optimistic UI พร้อมสถานะการอัพโหลด

**Media Handling**: Auto-upload to R2 CDN, video encoding status tracking

---

#### แก้ไขโพสต์ (`/edit-post/[id]`)
**Location**: `app/edit-post/[id]/page.tsx`

**Features**:
- แก้ไขได้เฉพาะ title, content, และ tags (media ล็อคไว้)
- Authorization check (เฉพาะเจ้าของโพสต์)
- Preview changes before saving

**Restrictions**: ไม่สามารถแก้ไขสื่อหลังสร้างแล้ว

---

#### โพสต์ของฉัน (`/my-posts`)
**Location**: `app/my-posts/page.tsx`

**Features**:
- รายการโพสต์ของตัวเอง เรียงใหม่สุดก่อน
- เข้าถึงปุ่มแก้ไข/ลบได้เร็ว
- แสดง statistics (votes, comments)
- Empty state พร้อม CTA "Create Post"

**Auth Required**: Redirects to login if not authenticated

---

### 3. โปรไฟล์ (4 หน้า)

#### โปรไฟล์ผู้ใช้ (`/profile/[username]`)
**Location**: `app/profile/[username]/page.tsx`

**Features**:
- User avatar, bio, location, website
- Karma score, followers/following counts
- Tabs: Posts, Comments
- ปุ่ม Follow/Unfollow (สำหรับผู้อื่น)
- ปุ่ม Chat (direct message)
- ปุ่ม Edit (สำหรับโปรไฟล์ตัวเอง)

**Data**: ISR with 1-hour revalidation

**SEO**: Dynamic metadata with user avatar as OG image

---

#### แก้ไขโปรไฟล์ (`/profile/edit`)
**Location**: `app/profile/edit/page.tsx`

**Features**:
- อัพโหลด avatar พร้อม real-time preview
- แก้ไข display name, bio, location, website
- Form validation พร้อม character limits
- Auto-save on blur

**Media Upload**: Direct upload to R2 with progress indicator

---

#### Followers (`/profile/[username]/followers`)
**Location**: `app/profile/[username]/followers/page.tsx`

**Features**:
- รายการ followers พร้อม avatars
- Quick follow/unfollow actions
- User cards พร้อมแสดง karma

---

#### Following (`/profile/[username]/following`)
**Location**: `app/profile/[username]/following/page.tsx`

**Features**:
- คล้ายกับหน้า followers
- แสดงรายการที่โปรไฟล์นี้กำลังติดตาม

---

### 4. แชท/ข้อความ (2 หน้า)

#### รายการแชท (`/chat`)
**Location**: `app/chat/page.tsx`

**Features**:
- Conversation list พร้อม last message preview
- Unread message badges
- User search dialog เพื่อเริ่มแชทใหม่
- Real-time updates via WebSocket

**Layout**: Desktop sidebar + mobile full-screen

---

#### หน้าสนทนา (`/chat/[username]`)
**Location**: `app/chat/[username]/page.tsx`

**Features**:
- Real-time message display พร้อม auto-scroll
- ส่งข้อความ text
- ส่งสื่อ (images/videos) พร้อม inline preview
- Message status indicators (sent, delivered, read)
- Auto-mark as read หลัง 2 วินาที
- Infinite scroll สำหรับประวัติข้อความ
- ตัวเลือก block user

**Media Support**: Image carousels, video with HLS streaming

**WebSocket**: Live message delivery

---

### 5. การแจ้งเตือน (2 หน้า)

#### หน้าแจ้งเตือน (`/notifications`)
**Location**: `app/notifications/page.tsx`

**Features**:
- Tabs: All, Unread
- Notification types: Reply, Vote, Mention, Follow, System
- Mark as read (single/all)
- Delete notifications
- Click to navigate to source (post/comment/profile)
- Real-time notifications via WebSocket
- Unread badge in nav

**WebSocket**: Live notification delivery

---

#### ตั้งค่าการแจ้งเตือน (`/notifications/settings`)
**Location**: `app/notifications/settings/page.tsx`

**Features**:
- Toggle notification types
- Email preferences
- Push notification settings (PWA)

---

### 6. Authentication (3 หน้า)

#### เข้าสู่ระบบ (`/login`)
**Location**: `app/login/page.tsx`

**Features**:
- Username/password login form
- OAuth login (Google)
- Form validation with error handling
- Redirect after successful login

**Layout**: Centered form with logo

---

#### ลงทะเบียน (`/register`)
**Location**: `app/register/page.tsx`

**Features**:
- Registration form (username, email, password, display name)
- Form validation (unique username, password strength)
- Terms acceptance checkbox

**Layout**: Centered form with logo

---

#### OAuth Callback (`/auth/callback`)
**Location**: `app/auth/callback/page.tsx`

**Features**:
- Handles OAuth redirect
- Stores JWT token
- Auto-redirects to home

---

## 🎨 ระบบ UI Components หลัก

### Layout Components

#### AppLayout
**Location**: `src/shared/components/layouts/AppLayout.tsx`

**Features**:
- Sidebar navigation (desktop)
- Top header with breadcrumbs
- Notification/chat badges
- Theme toggle (light/dark)
- PWA install button
- Mobile bottom navigation

---

#### ChatLayout
**Location**: `src/shared/components/layouts/ChatLayout.tsx`

**Features**:
- Conversation sidebar
- Message window
- User profile header
- Mobile-optimized

---

### Navigation Components

#### AppSidebar
**Location**: `src/shared/components/navigation/AppSidebar.tsx`

**Main Menu Items**:
- Home
- Search
- Notifications (with badge)
- Messages (with badge)
- Create Post
- My Posts
- Saved Posts
- User profile dropdown
- Help/Support links

---

#### MobileBottomNav
**Location**: `src/shared/components/layouts/MobileBottomNav.tsx`

**Features**:
- Fixed bottom bar (5 items)
- Active state indicators
- Profile avatar display
- Unread badges

---

### Post Components

#### PostCard
**Location**: `src/features/posts/components/PostCard.tsx`

**Features**:
- Author info with avatar
- Title + content preview
- Media display (edge-to-edge)
- Crosspost indicator
- Vote buttons (badge style)
- Comment count
- Share dropdown
- Save button
- Tag badges (clickable)
- Optimistic UI support (upload progress)

---

#### InfinitePostFeed
**Location**: `src/features/posts/components/InfinitePostFeed.tsx`

**Features**:
- Infinite scroll with intersection observer
- Loading states
- Empty states
- Error handling
- Optimistic updates

---

#### VoteButtons
**Location**: `src/features/posts/components/VoteButtons.tsx`

**Features**:
- Upvote/downvote
- Score display
- Color-coded (green for up, red for down)
- Horizontal/vertical orientations

---

#### MediaDisplay
**Location**: `src/shared/components/media/`

**Features**:
- Image gallery with lightbox
- Video player with HLS streaming
- Thumbnail generation
- Aspect ratio preservation
- Portrait/landscape optimizations
- Encoding status for videos

---

### Comment Components

#### CommentTree
**Location**: `src/features/comments/components/CommentTree.tsx`

**Features**:
- Recursive tree rendering
- Collapsible threads
- Nested replies (unlimited depth)
- Indentation with visual guides

---

#### CommentCard
**Location**: `src/features/comments/components/CommentCard.tsx`

**Features**:
- Author info
- Content with linkification
- Vote buttons
- Reply button
- Edit/delete (own comments)
- Time ago display

---

#### CommentForm
**Location**: `src/features/comments/components/CommentForm.tsx`

**Features**:
- Auto-expanding textarea
- Submit button
- Character counter
- Loading state

---

### Form Components

#### LoginForm
**Location**: `src/features/auth/components/LoginForm.tsx`

**Features**:
- Username/email input
- Password input with toggle visibility
- Remember me checkbox
- OAuth buttons (Google)

---

#### RegisterForm
**Location**: `src/features/auth/components/RegisterForm.tsx`

**Features**:
- Multi-step validation
- Unique username check
- Password strength indicator
- Terms acceptance

---

#### CreatePostForm
**Location**: `src/features/posts/components/CreatePostForm.tsx`

**Features**:
- Title input (max 200 chars)
- Content textarea (max 10,000 chars)
- Tag input with autocomplete
- Media uploader with drag-drop
- Preview mode
- Draft recovery

---

## ⚡ ฟีเจอร์หลักและ User Flows

### 1. Content Creation Flow

**ขั้นตอน**:
1. User clicks "Create Post" button
2. Form displays with title/content/tags/media fields
3. User uploads media (optional) → Auto-uploads to R2
4. User adds tags → Autocomplete suggestions
5. User submits → Optimistic UI shows post immediately
6. Background: API creates post, returns real ID
7. UI updates with real post data
8. Redirect to post detail page

---

### 2. Voting System

**คุณสมบัติ**:
- **Upvote/Downvote** on posts and comments
- **Toggle behavior**: Click same vote = remove, click opposite = switch
- **Real-time updates**: Optimistic UI + WebSocket sync
- **Karma calculation**: User karma updates on votes
- **Hot algorithm**: Post ranking based on votes + time

---

### 3. Comment System

**คุณสมบัติ**:
- **Nested replies**: Unlimited depth with tree structure
- **Inline reply**: Click reply → Form appears below comment
- **Edit/delete**: Own comments only, within edit window
- **Vote on comments**: Same as posts
- **Linkification**: Auto-link URLs, mentions (@username), hashtags

---

### 4. Real-time Chat

**ขั้นตอน**:
1. User searches for username or opens conversation
2. WebSocket connection established
3. Messages appear instantly (both directions)
4. Media messages: Upload → Send with preview
5. Read receipts: Auto-mark as read after 2 seconds
6. Unread badges update across app

---

### 5. Follow/Social Graph

**คุณสมบัติ**:
- **Follow button**: On profile pages
- **Followers/Following pages**: Lists with quick actions
- **Follow notifications**: Real-time alert to followed user
- **Feed algorithm**: Posts from followed users boosted

---

### 6. Media Handling

**คุณสมบัติ**:
- **Images**: Multiple uploads, carousel display, lightbox view
- **Videos**: Upload → Encode (FFmpeg backend) → HLS streaming
- **Encoding status**: Progress indicator, ready notification
- **Thumbnails**: Auto-generated for videos
- **CDN**: Cloudflare R2 for all media

---

### 7. Search & Discovery

**คุณสมบัติ**:
- **Full-text search**: Posts, users, tags
- **Filters**: Sort by hot/new/top
- **Tag pages**: Click tag → See all posts with tag
- **Trending tags**: (Future feature placeholder)

---

### 8. Notifications

**คุณสมบัติ**:
- **Types**: Reply, vote, mention, follow, system
- **Delivery**: WebSocket for real-time, polling fallback
- **Actions**: Mark read, delete, navigate to source
- **Badge**: Unread count in header
- **Settings**: Customize notification preferences

---

### 9. PWA Features

**คุณสมบัติ**:
- **Install prompt**: Auto-shows on mobile
- **Service worker**: Caches pages/assets
- **Offline support**: Basic navigation works offline
- **Auto-update**: Prompts user when new version available
- **Push notifications**: (Placeholder for future)

---

## 🗄️ State Management Architecture

### Zustand Stores

#### Auth Store
**Location**: `src/features/auth/stores/authStore.ts`

**State**:
- User data (id, username, displayName, avatar)
- Login/logout actions
- Token management
- Hydration status

---

#### Chat Store
**Location**: `src/features/chat/stores/chat/`

**State**:
- Conversations list
- Active conversation
- Messages by conversation ID
- Unread count
- WebSocket connection

---

### React Query (TanStack Query)

#### Query Keys Pattern

```typescript
['posts'] → All posts
['posts', postId] → Single post
['posts', 'user', userId] → User posts
['posts', 'tag', tagId] → Tag posts
['comments', postId] → Post comments
['users', 'profile'] → Current user profile
['users', 'username', username] → Other user profile
['notifications'] → All notifications
```

---

#### Infinite Queries

- Posts feed (`useInfinitePosts`)
- User posts (`useInfiniteUserPosts`)
- Messages (`useInfiniteMessages`)
- Tag posts (`useInfinitePostsByTagId`)

---

#### Mutations

- Create/update/delete posts
- Create/update/delete comments
- Vote (post/comment)
- Follow/unfollow
- Save/unsave posts

---

#### Optimistic Updates

- Votes update immediately (rolled back on error)
- Posts show before API confirmation
- Comments appear instantly

---

## 📐 Data Fetching Strategies

### 1. CSR (Client-Side Rendering)
- ส่วนใหญ่ใช้ `'use client'` with React Query
- Real-time data updates
- Optimistic UI

### 2. ISR (Incremental Static Regeneration)
- **Profile pages**: 1 hour revalidation
- **Post detail**: 5 minutes revalidation
- **Login/register**: 1 day revalidation

### 3. Dynamic Metadata
- Generated at request time for SEO
- OG images for posts and profiles

### 4. Prefetching
- Hover on links → Prefetch data
- Faster navigation

---

## 🎯 Interactive Elements Summary

### Buttons & Actions

- **Create Post** (header + mobile nav)
- **Upvote/Downvote** (posts + comments)
- **Comment** (opens reply form)
- **Share** (dropdown: Copy link, Crosspost, Twitter)
- **Save/Bookmark** (toggle saved state)
- **Follow/Unfollow** (profile pages)
- **Edit Profile** (avatar upload, bio edit)
- **Send Message** (chat window)
- **Mark as Read** (notifications)
- **Delete** (own posts/comments)

---

### Forms

- Login, Register, Create Post, Edit Post
- Comment form (with nested replies)
- Chat message input (with media upload)
- Profile edit form
- Search bar
- Tag input

---

### Navigation

- Sidebar (desktop)
- Bottom nav (mobile)
- Breadcrumbs (desktop)
- Back button (mobile)
- Profile dropdown menu

---

### Modals/Dialogs

- Delete confirmation (posts/comments)
- User search (new chat)
- Media lightbox (full-screen images)
- PWA install prompt

---

## 🏗️ Frontend Patterns & Architecture

### Component Composition
- **Atomic design**: atoms → molecules → organisms
- **Feature-based structure**: Each feature has components/hooks/types
- **Barrel exports**: Clean imports via index.ts

---

### Custom Hooks

- `useToggleVote` - Handle voting logic
- `useToggleFollow` - Handle follow/unfollow
- `useToggleSave` - Handle save/bookmark
- `useInfinitePosts` - Infinite scroll posts
- `useWebSocket` - Real-time connections

---

### Error Handling

- **Error Boundaries**: Graceful error handling
- **Loading States**: Skeleton screens, spinners
- **Empty States**: Helpful CTAs when no data

---

### Performance Optimizations

- **Code Splitting**: Dynamic imports for heavy components
- **Image Optimization**: Next.js Image with lazy loading
- **Virtual Scrolling**: For long comment threads
- **Debounced Search**: Reduces API calls
- **Optimistic UI**: Instant feedback before API response
- **Service Worker**: Caches assets for faster loads

---

### Accessibility

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Tab order, Enter/Escape handlers
- **Focus Management**: Modals trap focus
- **Color Contrast**: WCAG AA compliant

---

### Security

- **JWT Authentication**: HttpOnly cookies (handled by backend)
- **CSRF Protection**: Token validation
- **XSS Prevention**: Sanitized user input
- **Rate Limiting**: (Backend enforced)
- **Input Validation**: Client + server side

---

## 📊 สรุปจุดเด่นของระบบ

### ✅ ฟีเจอร์หลัก

1. **19 routes** ครอบคลุมฟีเจอร์โซเชียลมีเดียหลัก
2. **Real-time functionality** ผ่าน WebSockets (chat, notifications)
3. **Comprehensive UI components** พร้อม Radix UI
4. **Optimistic updates** สำหรับ UX ที่ตอบสนองเร็ว
5. **PWA capabilities** สำหรับประสบการณ์แบบแอพ
6. **SEO optimization** ด้วย dynamic metadata
7. **Mobile-first design** responsive layouts ทั้งหมด
8. **Rich media support** (images, videos with streaming)
9. **Nested comment system** ซ้อนได้ไม่จำกัดระดับ
10. **Advanced search & discovery** features

---

### 🎨 UX Highlights

- **Edge-to-edge media**: รูปและวิดีโอแสดงเต็มพื้นที่
- **Badge-style vote buttons**: ดีไซน์สะอาดตา ไม่รก
- **Infinite scroll**: ไม่ต้อง pagination
- **Auto-save drafts**: ไม่สูญเสียข้อมูล
- **Real-time updates**: เห็นการเปลี่ยนแปลงทันที
- **Optimistic UI**: ไม่ต้องรอ API
- **Empty states**: มี guidance ชัดเจน
- **Loading states**: Skeleton screens ลดความรู้สึกรอคอย

---

### 🔧 Technical Strengths

- **Modern React patterns**: Hooks, Context
- **Type-safe**: TypeScript throughout
- **Well-structured**: Feature-based architecture
- **Scalable**: Modular components
- **Maintainable**: Clear separation of concerns
- **Performant**: Code splitting, lazy loading
- **Accessible**: WCAG compliant
- **Secure**: Multiple layers of protection

---

## 📝 หมายเหตุสำหรับการ Redesign

### จุดที่อาจต้องปรับปรุง

1. **Performance**:
   - Virtual scrolling สำหรับ feed ยาวๆ
   - Image lazy loading optimization
   - Bundle size optimization

2. **UX**:
   - Skeleton loading states ที่สอดคล้องกันทั่วระบบ
   - Better error messages
   - More intuitive navigation flows

3. **Features**:
   - Advanced search filters
   - Trending tags/posts
   - Post analytics
   - User blocking/reporting
   - Moderation tools

4. **Accessibility**:
   - Keyboard shortcuts
   - Better screen reader support
   - High contrast mode

5. **Mobile**:
   - Gesture navigation
   - Better mobile media handling
   - Offline-first approach

---

## 🚀 Next Steps for Redesign

1. **Prioritize improvements** based on user feedback
2. **Create wireframes** for new/updated pages
3. **Design system** refinement (colors, typography, spacing)
4. **Component library** consolidation
5. **Performance audit** and optimization plan
6. **Accessibility audit** and improvements
7. **User testing** for new flows

---

*Document created: November 14, 2025*
*Last updated: November 14, 2025*
