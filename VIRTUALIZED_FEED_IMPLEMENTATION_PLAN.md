# แผนการพัฒนา Virtualized Feed (react-virtuoso)

## 📋 สรุปภาพรวม

ทำการเปลี่ยน infinite scroll feed ปัจจุบันเป็น **virtualized feed** ด้วย react-virtuoso เพื่อแก้ปัญหา:
- DOM โตไม่หยุด (200+ posts → 200+ cards ใน DOM)
- Performance ช้าลง เมื่อ scroll ลึก
- Memory leak เมื่อใช้งานนาน

**เป้าหมาย:** DOM มีแค่โพสต์ที่อยู่แถว viewport + buffer → Performance ดีขึ้นมาก

---

## 🧠 Expert Feedback Applied

แผนนี้ปรับตามคำแนะนำของผู้เชี่ยวชาญ:

1. **✅ Focus on Home Feed first** (ไม่ต้องสร้างหน้า POC แยก)
   - เหตุผล: ลด overhead, ทดสอบกับ real traffic ได้เลย

2. **✅ Collect real metrics** (DOM nodes, FPS, Memory)
   - Before: เก็บ baseline ก่อนเปลี่ยน
   - After: เก็บหลังเปลี่ยนเพื่อเปรียบเทียบ

3. **✅ Don't use defaultItemHeight initially**
   - เหตุผล: Layout ทำ predictable แล้ว (VISUAL_FEED_ADJUSTMENTS)
   - ใช้แล้วอาจทำให้ Virtuoso คาดการณ์ผิด

4. **✅ Accept scroll position loss on refresh**
   - เหตุผล: Simple approach, ตามธรรมชาติของ feed
   - User คุ้นเคย (Twitter, Facebook ก็ reset)

5. **✅ Test optimistic posts thoroughly**
   - Upload success
   - Upload failed + retry
   - Refresh with pending upload (IndexedDB restore)

6. **✅ Start with low overscan** (2-5)
   - เพิ่มทีหลังถ้าเห็น white space

---

## 🎯 กลยุทธ์: ทีละ Step แบบปลอดภัย

### Phase 1: Home Feed POC
**ทำที่หน้า Home Feed เลย** (ไม่ต้องสร้างหน้า POC แยก)
- เก็บ metrics Before/After (DOM, FPS, Memory)
- ทดสอบ optimistic posts ทุกสถานะ (upload/success/fail+retry)
- ยอมรับว่า scroll position หายเมื่อ refresh (simple approach)

### Phase 2: Expand to Other Feeds
ถ้า Phase 1 โอเค → ขยายไปหน้าอื่น (profile, tag, saved)

### Phase 3: Fine-tuning
ปรับแต่ง overscan, performance optimization

---

## 📅 Timeline และ Steps

### **Phase 1: Home Feed POC (2-3 วัน)** 🧪

#### Step 1.0: 📊 เก็บ Baseline Metrics (Before)
**ทำก่อนเปลี่ยนอะไร** - วัดประสิทธิภาพปัจจุบันของ Home Feed

1. **เปิด Home Feed** (`/`)
2. **Scroll ไปจนโหลด 100+ posts**
3. **เปิด Chrome DevTools:**
   - **Elements tab** → นับ PostCard ใน DOM → จด
   - **Performance tab** → Record → Scroll → Stop → ดู FPS → จด
   - **Memory tab** → Take heap snapshot → ดู Memory MB → จด

**บันทึก:**
```
📊 BEFORE Metrics (Home Feed - 100+ posts loaded):
- DOM nodes: _____ PostCards
- FPS (scroll): _____ fps
- Memory: _____ MB
```

---

#### Step 1.1: ติดตั้ง Dependencies
```bash
npm install react-virtuoso
```

#### Step 1.2: สร้าง VirtualizedPostFeed Component
**ไฟล์:** `src/features/posts/components/VirtualizedPostFeed.tsx`

```tsx
"use client";

import { Virtuoso } from 'react-virtuoso';
import { PostCard } from './PostCard';
import { OptimisticPostItem } from './OptimisticPostItem';
import { useOptimisticPostStore } from '@/features/posts';
import type { Post } from '@/types';

interface VirtualizedPostFeedProps {
  posts: Post[];
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function VirtualizedPostFeed({
  posts,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: VirtualizedPostFeedProps) {
  // ✅ Optimistic posts แยกนอก Virtuoso
  const optimisticPosts = useOptimisticPostStore((state) => state.posts);
  const pendingPosts = Object.values(optimisticPosts).filter(
    (post) => post.status === 'pending' || post.status === 'uploading'
  );

  return (
    <div className="space-y-4">
      {/* Optimistic Posts - ไม่เข้า virtualized list */}
      {pendingPosts.map((post) => (
        <OptimisticPostItem key={post.tempId} post={post} />
      ))}

      {/* Real Posts - Virtualized */}
      <Virtuoso
        data={posts}
        useWindowScroll  // ✅ ใช้ window scroll แทน container scroll
        overscan={2}     // ✅ เริ่มต่ำก่อน (render 2 items นอก viewport)
        itemContent={(index, post) => (
          <div className="mb-4">
            <PostCard key={post.id} post={post} />
          </div>
        )}
        components={{
          // Loading indicator ตอนโหลดเพิ่ม
          Footer: () => {
            if (!hasNextPage) return null;
            return isFetchingNextPage ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : null;
          },
        }}
        endReached={() => {
          // ✅ เรียก fetchNextPage เมื่อ scroll ใกล้ล่างสุด
          if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
            fetchNextPage();
          }
        }}
      />
    </div>
  );
}
```

#### Step 1.3: Backup InfinitePostFeed เดิม
```bash
# Rename เพื่อเก็บไว้ backup (สำหรับ rollback)
mv src/features/posts/components/InfinitePostFeed.tsx \
   src/features/posts/components/InfinitePostFeed.backup.tsx
```

#### Step 1.4: สร้าง InfinitePostFeed ใหม่ (ใช้ VirtualizedPostFeed)
**ไฟล์:** `src/features/posts/components/InfinitePostFeed.tsx`

```tsx
"use client";

import { VirtualizedPostFeed } from './VirtualizedPostFeed';
import { useInfinitePosts } from '@/features/posts';

interface InfinitePostFeedProps {
  initialPosts?: any;
}

export function InfinitePostFeed({ initialPosts }: InfinitePostFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfinitePosts();

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <VirtualizedPostFeed
      posts={posts}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}
```

#### Step 1.5: 📊 เก็บ After Metrics + ทดสอบ
1. **Refresh หน้า Home Feed** (`/`)
2. **Scroll ไปจนโหลด 100+ posts** (เท่าเดิม)
3. **เปิด Chrome DevTools:**
   - **Elements tab** → นับ PostCard ใน DOM → จด
   - **Performance tab** → Record → Scroll → Stop → ดู FPS → จด
   - **Memory tab** → Take heap snapshot → ดู Memory MB → จด

**บันทึก:**
```
📊 AFTER Metrics (Home Feed - 100+ posts loaded):
- DOM nodes: _____ PostCards (expect ~10-20, not 100+)
- FPS (scroll): _____ fps (expect higher or same)
- Memory: _____ MB (expect lower or same)
```

**Checklist - Performance:**
- [ ] DOM มีแค่ ~10-20 cards (viewport + overscan)
- [ ] FPS เท่าเดิมหรือดีขึ้น
- [ ] Memory ไม่เพิ่ม

**Checklist - Functional:**
- [ ] Scroll ลื่น (ไม่สะดุด)
- [ ] Infinite scroll ทำงาน (fetchNextPage triggered)
- [ ] โหลด 100+ posts แล้วยัง smooth

#### Step 1.6: 🧪 ทดสอบ Optimistic Posts (ทุกสถานะ)

**Test 1: Upload Success**
1. Create post ใหม่ (พร้อม media)
2. ดู optimistic post แสดงด้านบนสุดไหม?
3. รอ upload สำเร็จ
4. Optimistic post หายแล้ว merge กับ feed ไหม?

**Test 2: Upload Failed + Retry**
1. ปิด internet
2. Create post ใหม่
3. ดู "อัปโหลดล้มเหลว" badge ไหม?
4. เปิด internet
5. Click retry → upload สำเร็จไหม?

**Test 3: Refresh with Pending Upload**
1. Create post (ขณะกำลัง upload)
2. Refresh page ทันที
3. Optimistic post restore จาก IndexedDB ไหม?
4. Upload ดำเนินต่อไหม?

**Checklist - Optimistic Posts:**
- [ ] แสดงด้านบนสุด (นอก Virtuoso)
- [ ] กำลัง upload → แสดง loading badge
- [ ] Upload สำเร็จ → หายไป + merge
- [ ] Upload ล้มเหลว → แสดง error + retry button
- [ ] Retry ทำงาน
- [ ] Refresh → restore จาก IndexedDB

---

### **Phase 2: Expand to Other Feeds (2-3 วัน)** 🚀

**⚠️ ทำต่อก็ต่อเมื่อ Phase 1 โอเค + User approve**

#### Step 2.1: Profile Feed
**ไฟล์:** `app/profile/[username]/page.tsx`

เปลี่ยนจาก:
```tsx
<InfinitePostFeed /> // เดิม
```

เป็น:
```tsx
<VirtualizedPostFeed
  posts={userPosts}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  fetchNextPage={fetchNextPage}
/>
```

#### Step 2.2: Tag Feed
**ไฟล์:** `app/tag/[tagName]/TagPageContent.tsx`

เปลี่ยนแบบเดียวกัน

#### Step 2.3: Saved Posts
**ไฟล์:** `app/saved/page.tsx`

เปลี่ยนแบบเดียวกัน

**Checklist แต่ละหน้า:**
- [ ] Feed โหลดถูกต้อง
- [ ] Infinite scroll ทำงาน
- [ ] Empty state แสดงถูกต้อง
- [ ] Performance ดี

---

### **Phase 3: Fine-tuning (1-2 วัน)** ⚡

**ทำต่อเมื่อ Phase 2 เสร็จ + เจอปัญหา performance**

#### Tuning 1: ปรับ Overscan
- เห็น white space เวลา scroll เร็ว → เพิ่ม `overscan={5}` หรือ `overscan={10}` (จำนวน items)
- Scroll เร็วมากๆ ยังเห็น white space → ใช้ `increaseViewportBy={{ top: 200, bottom: 200 }}` (pixels)

#### Tuning 2: Layout Shift (ถ้าเจอ)
- โพสต์ความสูงกระโดด → ใช้ `defaultItemHeight={600}` (ค่าเฉลี่ย)
- **⚠️ แนะนำ:** ไม่ต้องใช้ในตอนแรก เพราะ media heights ทำ predictable แล้ว

#### Tuning 3: Scroll Position Restoration (ถ้าต้องการ)
- ใช้ `initialTopMostItemIndex` + sessionStorage
- **⚠️ แนะนำ:** ยอมรับว่า refresh = reset (simple approach)

---

## ⚙️ การ Fine-tune Overscan

### เริ่มต้น: overscan={2}
- Render 2 items ก่อนและหลัง viewport
- ดี: Performance ดี, DOM น้อย
- เสีย: อาจเห็น white space เวลา scroll เร็ว

### ถ้า Scroll เร็วแล้วเห็น White Space → เพิ่ม Overscan (จำนวน items)
```tsx
<Virtuoso
  overscan={5}  // เพิ่มเป็น 5 items
/>
```

### ถ้ายังเห็น → ใช้ increaseViewportBy (pixels)
```tsx
<Virtuoso
  increaseViewportBy={{ top: 200, bottom: 200 }}  // ขยาย viewport ด้วย pixels
/>
```

**แนะนำ:**
- **overscan** (จำนวน items):
  - Mobile: `overscan={2-3}`
  - Desktop: `overscan={5-10}`
- **increaseViewportBy** (pixels):
  - ถ้าโพสต์สูงมาก: `increaseViewportBy={{ top: 200, bottom: 200 }}`
  - หรือใช้ `increaseViewportBy={{ top: 400, bottom: 400 }}` ถ้า scroll เร็วมากๆ

---

## 🔗 Integration กับ React Query

### ✅ สิ่งที่ทำอยู่แล้ว (ไม่ต้องเปลี่ยน)
```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfinitePosts();

const posts = data?.pages.flatMap((page) => page.posts) ?? [];
```

### ✅ Handle Edge Cases
```tsx
endReached={() => {
  // ✅ Guard: ป้องกันเรียกซ้ำ
  if (hasNextPage && !isFetchingNextPage && fetchNextPage) {
    fetchNextPage();
  }
}}
```

### ⚠️ Potential Issues

#### Issue 1: ScrollRestoration
**ปัญหา:** Refresh page แล้ว scroll position หาย

**แก้ไข:**
- ใช้ `initialTopMostItemIndex` prop ของ Virtuoso
- เก็บ scroll position ใน sessionStorage
- Restore เมื่อ mount

```tsx
const [scrollIndex, setScrollIndex] = useState(0);

<Virtuoso
  initialTopMostItemIndex={scrollIndex}
  rangeChanged={(range) => {
    sessionStorage.setItem('scrollIndex', range.startIndex.toString());
  }}
/>
```

#### Issue 2: Optimistic Posts หาย
**ปัญหา:** Create post → refresh → optimistic post หาย

**แก้ไข:** ระบบ IndexedDB persistence ทำอยู่แล้ว (Phase 2) ✅

---

## 🧪 Testing Checklist

### Performance Testing
- [ ] **Feed ยาว 200+ posts**
  - Scroll ลื่นไหม? (60 FPS)
  - DOM มีแค่ ~10-20 cards
  - Memory ไม่เพิ่มเรื่อยๆ

- [ ] **Scroll เร็วมาก**
  - เห็น white space ไหม?
  - Content โหลดทันไหม?
  - Layout shift มีไหม?

- [ ] **ทดสอบบนมือถือจริง**
  - iOS Safari
  - Android Chrome
  - Scroll smooth ไหม?
  - Touch response ดีไหม?

### Functional Testing
- [ ] **Infinite Scroll**
  - โหลดหน้าถัดไปถูกต้องไหม?
  - ไม่เรียก API ซ้ำ (duplicate requests)
  - Loading indicator แสดงถูกต้องไหม?

- [ ] **Optimistic Posts**
  - แสดงด้านบนสุดไหม? (นอก Virtuoso)
  - กำลัง upload → แสดง progress ไหม?
  - Upload สำเร็จ → หายไปแล้ว merge กับ feed ไหม?
  - Upload ล้มเหลว → แสดง error + retry ไหม?

- [ ] **Refresh Scenarios**
  - Refresh page → feed โหลดใหม่ถูกต้องไหม?
  - Optimistic posts restore จาก IndexedDB ไหม?
  - Scroll position (อาจหายไป - acceptable)

- [ ] **Empty States**
  - Feed ว่าง → แสดง empty state ไหม?
  - No more posts → ซ่อน loading indicator ไหม?

### Edge Cases
- [ ] **Login/Logout**
  - Feed reset ถูกต้องไหม?
  - ไม่ error

- [ ] **Network Issues**
  - Offline → แสดง error ไหม?
  - Retry ทำงานไหม?

- [ ] **Multiple Tabs**
  - เปิด 2 tabs → ทำงานปกติไหม?
  - Create post ใน tab A → tab B เห็นไหม? (WebSocket)

---

## ⚠️ Risks และ Mitigation

### Risk 1: Layout Shift
**ปัญหา:** Virtuoso คาดการณ์ความสูงผิด → layout กระโดด

**Mitigation:**
- ✅ ทำ media height predictable แล้ว (Phase ก่อนหน้า)
- **⚠️ Expert Recommendation:** ไม่ต้องใช้ `defaultItemHeight` ในตอนแรก
- เหตุผล: Layout ทำ predictable แล้ว, ใช้แล้วอาจทำให้ Virtuoso คาดการณ์ผิด
- ถ้ายังเจอ layout shift: ให้รายงานกลับมาก่อน (อาจมีสาเหตุอื่น)

### Risk 2: Scroll Position หาย
**ปัญหา:** Refresh page → scroll กลับไปบนสุด

**Mitigation:**
- **✅ Expert Recommendation:** ยอมรับว่า refresh = reset (simple approach)
- เหตุผล: ตามธรรมชาติของ feed, ไม่ซับซ้อน, user คุ้นเคย
- ถ้าจำเป็นจริงๆ: ใช้ `initialTopMostItemIndex` + sessionStorage ใน Phase 3

### Risk 3: Optimistic Posts ไม่ทำงาน
**ปัญหา:** Create post → ไม่เห็นใน feed

**Mitigation:**
- แยก optimistic posts นอก Virtuoso (ทำแล้ว)
- ทดสอบว่า useOptimisticPostStore ทำงานถูกต้อง

### Risk 4: Performance แย่ลงแทนที่จะดีขึ้น
**ปัญหา:** overscan สูงเกิน / implementation ผิด

**Mitigation:**
- เริ่มจาก overscan={2}
- วัด performance ก่อน-หลัง (Chrome DevTools Performance tab)
- ถ้าแย่ลง → ตรวจสอบ:
  - PostCard มี useMemo หรือไม่?
  - Re-render บ่อยไปไหม?

### Risk 5: ทำแล้วผู้ใช้งานสับสน
**ปัญหา:** UX เปลี่ยน (scroll position หาย, etc.)

**Mitigation:**
- ทดสอบกับ user จริงก่อน deploy
- เตรียม rollback plan (เก็บ InfinitePostFeed.backup.tsx ไว้)

---

## 📊 Success Metrics

### Performance
- ✅ DOM nodes ลดลง 80%+ (จาก 200 cards → 15 cards)
- ✅ Memory usage คงที่ (ไม่เพิ่มตาม posts)
- ✅ FPS ≥ 55 เมื่อ scroll (mobile)
- ✅ FPS = 60 เมื่อ scroll (desktop)

### Functional
- ✅ Infinite scroll ทำงาน 100%
- ✅ Optimistic posts ทำงาน 100%
- ✅ ไม่มี critical bugs ใน production

### User Experience
- ✅ Scroll smooth ไม่สะดุด
- ✅ ไม่เห็น white space (หรือน้อยมาก)
- ✅ Loading ไม่ช้ากว่าเดิม

---

## 🔄 Rollback Plan

ถ้าเจอปัญหาร้ายแรงใน production:

### Step 1: Restore Backup
```bash
# Restore InfinitePostFeed เดิม
mv src/features/posts/components/InfinitePostFeed.backup.tsx \
   src/features/posts/components/InfinitePostFeed.tsx
```

### Step 2: Revert Component Usage
แก้ทุกหน้าที่ใช้ VirtualizedPostFeed → กลับไปใช้ InfinitePostFeed

### Step 3: Deploy
```bash
npm run build
# Deploy to production
```

---

## 📝 Implementation Checklist

### Pre-implementation
- [ ] Review แผนนี้
- [ ] ตรวจสอบว่า media heights stable แล้ว (✅ ทำแล้ว - VISUAL_FEED_ADJUSTMENTS)
- [ ] เตรียม testing environment

### Phase 1: Home Feed POC (2-3 วัน)
- [ ] **Step 1.0:** เก็บ Baseline Metrics (DOM, FPS, Memory)
- [ ] **Step 1.1:** ติดตั้ง react-virtuoso
- [ ] **Step 1.2:** สร้าง VirtualizedPostFeed component
- [ ] **Step 1.3:** Backup InfinitePostFeed เดิม
- [ ] **Step 1.4:** สร้าง InfinitePostFeed ใหม่ (wrapper)
- [ ] **Step 1.5:** เก็บ After Metrics + ทดสอบ performance
- [ ] **Step 1.6:** ทดสอบ Optimistic Posts (upload/success/fail+retry)
- [ ] สรุปผล + รายงาน user (รอ approve ก่อนทำต่อ)

### Phase 2: Expand (2-3 วัน) - ⚠️ ทำต่อเมื่อ Phase 1 approved
- [ ] Migrate profile feed
- [ ] Migrate tag feed
- [ ] Migrate saved feed
- [ ] ทดสอบทุกหน้า
- [ ] Fix bugs ถ้ามี

### Phase 3: Fine-tuning (1-2 วัน) - ⚠️ Optional
- [ ] ปรับ overscan (ถ้าเห็น white space)
- [ ] Handle layout shift (ถ้าเจอ - ไม่น่าจะเจอ)
- [ ] Scroll restoration (ถ้าจำเป็น)

### Deployment (เมื่อทุก Phase เสร็จ)
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Final QA
- [ ] Deploy to production
- [ ] Monitor metrics

---

## 🎯 Expected Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1: Home Feed POC | 2-3 วัน | Metrics collection + Apply to home feed + Testing |
| Phase 2: Expand | 2-3 วัน | แทนที่หน้าอื่นๆ (profile, tag, saved) |
| Phase 3: Fine-tuning | 1-2 วัน | ปรับแต่ง overscan, performance (ถ้าจำเป็น) |
| **Total** | **5-8 วัน** | **รวมทั้งหมด** |

**⚠️ Note:** Phase 2 & 3 จะทำก็ต่อเมื่อ Phase 1 โอเค + User approve

---

## 💡 Tips & Best Practices

### 1. อย่าใจร้อน
- เริ่มจาก POC ก่อนเสมอ
- ทดสอบให้ดีก่อนขยายไปหน้าอื่น

### 2. วัด Performance จริง
- ใช้ Chrome DevTools Performance tab
- ทดสอบบนมือถือจริง (ไม่ใช่แค่ emulator)

### 3. เก็บ Backup
- เก็บ InfinitePostFeed เดิมไว้เสมอ
- Git commit ก่อนทำทุกครั้ง

### 4. ทดสอบ Edge Cases
- Login/logout
- Network issues
- Empty states
- Optimistic posts

### 5. Listen to Users
- ถ้า user บอกว่า scroll สะดุด → ลด overscan
- ถ้า user บอกว่าเห็น white space → เพิ่ม overscan

---

## 📚 Resources

- [react-virtuoso Documentation](https://virtuoso.dev/)
- [React Query Infinite Queries](https://tanstack.com/query/latest/docs/react/guides/infinite-queries)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)

---

**Status:** ✅ Ready to Start Phase 1
**Last Updated:** 2025-11-17
**Version:** 1.1 (Updated with Expert Feedback)
