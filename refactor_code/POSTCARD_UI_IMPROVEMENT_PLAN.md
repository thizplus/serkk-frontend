# แผนการปรับปรุง PostCard UI/UX

## 🎯 ปัญหาที่พบ

### ปัญหาที่ 1: Media มี padding/gap ที่ไม่สวยงาม
**อาการ:**
- Media (รูปภาพ/วิดีโอ) มี padding ซ้าย-ขวา
- ไม่เต็มหน้าจอเหมือน Facebook, Instagram, Twitter
- ดูไม่ immersive

**สาเหตุ:**
```tsx
// AppLayout.tsx line 148
<div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-20 md:pb-4">
  // p-4 = 16px padding รอบๆ

// PostCard.tsx line 87-89
<div className="bg-card border rounded-lg overflow-hidden hover:border-accent transition-colors p-4">
  // p-4 = 16px padding อีกชั้นหนึ่ง

  // Media อยู่ภายใน PostCard ทำให้มี padding รอบๆ
</div>
```

**Total Padding:**
- AppLayout: 16px (p-4)
- PostCard: 16px (p-4)
- **รวม: 32px ห่างจากขอบจอ**

---

### ปัญหาที่ 2: รูปภาพแนวสูงโดนจำกัดความสูง
**อาการ:**
- รูปภาพแนวตั้ง (portrait) โดนจำกัดความสูงที่ 600px (feed) / 800px (detail)
- ไม่เห็นรูปเต็ม ต้อง zoom

**สาเหตุ:**
```tsx
// MediaGrid.tsx line 134, 188
max-h-[600px] // Feed mode
max-h-[800px] // Detail mode

// SingleImageViewer.tsx line 61
max-h-[${maxHeight}px] // 600px or 800px

// constants.ts line 93-95
MAX_HEIGHT: {
  FEED: 600,
  DETAIL: 800,
}
```

**ผลกระทบ:**
- รูปแนวตั้ง (9:16, 3:4) โดนตัดความสูง
- ดูไม่ natural, immersive น้อย

---

## 🎨 เป้าหมายการปรับปรุง

### 1. Media Edge-to-Edge (เหมือน Facebook)
```
┌─────────────────────────────┐
│ PostCard Header (padding)   │
│ Title (padding)             │
│ Content (padding)           │
├─────────────────────────────┤ ← ไม่มี padding
│                             │
│     Media (Full Width)      │
│                             │
├─────────────────────────────┤
│ Tags (padding)              │
│ Actions (padding)           │
└─────────────────────────────┘
```

### 2. รองรับรูปแนวสูงได้ดีขึ้น
- **Feed mode:** เพิ่ม max-height เป็น 800px หรือ 90vh
- **Detail mode:** ไม่จำกัดความสูง หรือใช้ 90vh
- ให้รูปแสดงตามสัดส่วนจริงมากขึ้น

---

## 📋 แผนการดำเนินการ

### Phase 1: ปรับโครงสร้าง PostCard (Media Edge-to-Edge)

#### Task 1.1: Refactor PostCard Structure
**ไฟล์:** `src/features/posts/components/PostCard.tsx`

**เปลี่ยนจาก:**
```tsx
<div className="bg-card border rounded-lg overflow-hidden p-4">
  <Header />
  <Title />
  <Content />
  <Crosspost />
  <Media />     // ← มี padding จาก parent
  <Tags />
  <Actions />
</div>
```

**เป็น:**
```tsx
<div className="bg-card border rounded-lg overflow-hidden">
  {/* Section 1: Content with padding */}
  <div className="p-4 pb-0">
    <Upload Status />
    <Header />
    <Title />
    <Content />
    <Crosspost />
  </div>

  {/* Section 2: Media - NO PADDING (Edge-to-Edge) */}
  {post.media && post.media.length > 0 && (
    <div className="w-full">
      <MediaDisplay
        media={post.media}
        variant={disableNavigation ? 'detail' : 'feed'}
        className="rounded-none"  // ← ไม่มี rounded (เพราะติดขอบ)
      />
    </div>
  )}

  {/* Section 3: Tags & Actions with padding */}
  <div className="p-4 pt-3">
    <Tags />
    <Actions />
  </div>
</div>
```

**Changes:**
1. แยก PostCard เป็น 3 sections
2. Media section ไม่มี padding ซ้าย-ขวา
3. ใช้ `rounded-none` สำหรับ Media เพื่อให้ติดขอบ
4. ปรับ spacing ระหว่าง sections

---

#### Task 1.2: ปรับ Crosspost Media
**ไฟล์:** `src/features/posts/components/PostCard.tsx` (line 180-233)

**ปัญหา:**
- Crosspost media มี `max-h-80` (320px) ที่แคบเกินไป

**แก้ไข:**
```tsx
{/* Source Post Media */}
{post.sourcePost.media && post.sourcePost.media.length > 0 && (
  <div className="rounded-md overflow-hidden bg-muted max-h-[400px]">
    {/* เพิ่มความสูงเป็น 400px */}
    {post.sourcePost.media[0].type === "video" ? (
      <video
        src={post.sourcePost.media[0].url}
        poster={post.sourcePost.media[0].thumbnail || undefined}
        className="w-full h-auto max-h-[400px] object-contain"
      />
    ) : (
      <Image
        src={post.sourcePost.media[0].url}
        alt="Source post media"
        width={600}
        height={400}
        className="w-full h-auto max-h-[400px] object-contain"
      />
    )}
  </div>
)}
```

---

### Phase 2: ปรับการจำกัดความสูงของ Media

#### Task 2.1: อัปเดต Constants
**ไฟล์:** `src/shared/config/constants.ts`

**เปลี่ยนจาก:**
```typescript
export const MEDIA_DISPLAY = {
  MAX_HEIGHT: {
    FEED: 600,    // pixels - for feed mode
    DETAIL: 800,  // pixels - for detail mode
  },
  // ...
}
```

**เป็น:**
```typescript
export const MEDIA_DISPLAY = {
  MAX_HEIGHT: {
    FEED: 800,     // pixels - เพิ่มจาก 600 → 800
    DETAIL: 1200,  // pixels - เพิ่มจาก 800 → 1200
    MOBILE_VH: 90, // viewport height - 90vh สำหรับ mobile
  },
  // ...
  ASPECT_RATIO: {
    // เพิ่ม config สำหรับ aspect ratio
    MAX_PORTRAIT: '9 / 16',  // รูปแนวตั้งสูงสุด (TikTok/Instagram Story)
    MAX_LANDSCAPE: '16 / 9', // รูปแนวนอนกว้างสุด
    DEFAULT: 'auto',         // ใช้สัดส่วนจริงของรูป
  },
}
```

---

#### Task 2.2: ปรับ MediaGrid Component
**ไฟล์:** `src/shared/components/media/MediaGrid.tsx`

**Changes:**

1. **Single Media - ใช้ max-height ใหม่**
```tsx
// Line 134
<video
  src={item.url}
  poster={item.thumbnail}
  className={cn(
    "rounded-lg",
    // เปลี่ยนจาก max-h-[600px] / max-h-[800px]
    variant === 'detail' ? "max-h-[1200px]" : "max-h-[800px]",
    "max-w-full h-auto"
  )}
  controls={isSingleVideoDetailMode}
  muted={!isSingleVideoDetailMode}
  preload="metadata"
/>
```

2. **Single Image - เหมือนกัน**
```tsx
// Line 188
<img
  src={item.url}
  alt={`Media ${index + 1}`}
  className={cn(
    "rounded-lg",
    variant === 'detail' ? "max-h-[1200px]" : "max-h-[800px]",
    "max-w-full h-auto object-contain"
  )}
/>
```

3. **เพิ่ม mobile responsive**
```tsx
// ใช้ viewport height สำหรับ mobile
className={cn(
  "rounded-lg max-w-full h-auto object-contain",
  variant === 'detail'
    ? "max-h-[1200px] md:max-h-[90vh]" // Desktop: 1200px, Mobile: 90vh
    : "max-h-[800px] md:max-h-[70vh]"  // Desktop: 800px, Mobile: 70vh
)}
```

---

#### Task 2.3: ปรับ SingleImageViewer
**ไฟล์:** `src/shared/components/media/SingleImageViewer.tsx`

```tsx
export function SingleImageViewer({
  media,
  variant = 'feed',
  className,
}: SingleImageViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // อัปเดตค่า max-height
  const maxHeight = variant === 'detail'
    ? MEDIA_DISPLAY.MAX_HEIGHT.DETAIL  // 1200px
    : MEDIA_DISPLAY.MAX_HEIGHT.FEED;   // 800px

  return (
    <>
      <div
        className={cn(
          "w-full rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity",
          className
        )}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={media.url}
          alt="Post image"
          className={cn(
            "rounded-lg max-w-full h-auto object-contain",
            `max-h-[${maxHeight}px] md:max-h-[90vh]`  // ← เพิ่ม responsive
          )}
          style={{ maxHeight: `${maxHeight}px` }}
        />
      </div>

      <MediaLightbox
        media={[media]}
        open={lightboxOpen}
        index={0}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
```

---

#### Task 2.4: ปรับ SingleVideoPlayer
**ไฟล์:** `src/shared/components/media/SingleVideoPlayer.tsx`

```tsx
export function SingleVideoPlayer({
  media,
  variant = 'feed',
  className,
}: SingleVideoPlayerProps) {
  // อัปเดตค่า max-height
  const maxHeight = variant === 'detail'
    ? MEDIA_DISPLAY.MAX_HEIGHT.DETAIL  // 1200px
    : MEDIA_DISPLAY.MAX_HEIGHT.FEED;   // 800px

  return (
    <div className={cn(
      "w-full bg-black rounded-lg overflow-hidden flex items-center justify-center",
      className
    )}>
      <video
        src={media.url}
        poster={media.thumbnail}
        controls={MEDIA_DISPLAY.VIDEO.CONTROLS}
        preload={MEDIA_DISPLAY.VIDEO.PRELOAD}
        className={cn(
          "rounded-lg max-w-full h-auto",
          `max-h-[${maxHeight}px] md:max-h-[90vh]`  // ← เพิ่ม responsive
        )}
        style={{ maxHeight: `${maxHeight}px` }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
```

---

### Phase 3: ปรับ AppLayout (Optional)

#### Task 3.1: ลด Container Padding (ถ้าต้องการ)
**ไฟล์:** `src/shared/components/layouts/AppLayout.tsx`

**Current:**
```tsx
// Line 148
<div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-20 md:pb-4">
```

**Option 1: ลด padding เป็น p-2 (8px)**
```tsx
<div className="flex flex-1 flex-col gap-4 p-2 pt-4 pb-20 md:pb-4">
  // ลดจาก 16px → 8px
</div>
```

**Option 2: ใช้ px-4 py-0 สำหรับ content area**
```tsx
<div className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-20 md:pb-4">
  // มี padding ซ้าย-ขวา แต่ไม่มี padding บน-ล่างระหว่าง posts
</div>
```

**Option 3: ไม่เปลี่ยน (ดีที่สุด)**
- เก็บ p-4 ไว้
- ให้ PostCard จัดการ edge-to-edge เอง
- ง่ายต่อการ maintain

---

## 🎨 ผลลัพธ์ที่คาดหวัง

### Before (ปัจจุบัน)
```
┌─────────────────────────────┐
│ ◄─ 32px gap ─►              │
│  ┌─────────────────────┐    │
│  │ PostCard            │    │
│  │  ┌───────────────┐  │    │
│  │  │ Media         │  │    │ ← มี padding รอบๆ
│  │  │ (600px max)   │  │    │
│  │  └───────────────┘  │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

### After (หลังปรับปรุง)
```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ PostCard Header         │ │
│ │ Title, Content          │ │
│ ├─────────────────────────┤ │
│ │ Media (Edge-to-Edge)    │ │ ← เต็มความกว้าง
│ │ (800px/1200px max)      │ │ ← สูงขึ้น
│ ├─────────────────────────┤ │
│ │ Tags, Actions           │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## 📊 Comparison Table

| Feature | Before | After | Improvement |
|---------|--------|-------|-------------|
| **Media Width** | Container - 32px | Full Width | ✅ Edge-to-edge |
| **Feed Max Height** | 600px | 800px | ✅ +33% |
| **Detail Max Height** | 800px | 1200px | ✅ +50% |
| **Mobile Height** | Fixed | 90vh responsive | ✅ Adaptive |
| **Portrait Support** | Poor (ถูกตัด) | Good (แสดงได้มากขึ้น) | ✅ Better |
| **UX** | พอใช้ | ดีขึ้น | ✅ More immersive |

---

## 🔄 Implementation Steps

### Step 1: Backup
```bash
cp src/features/posts/components/PostCard.tsx src/features/posts/components/PostCard.tsx.backup
cp src/shared/config/constants.ts src/shared/config/constants.ts.backup
```

### Step 2: Update Constants
```bash
# Edit: src/shared/config/constants.ts
# เปลี่ยน MEDIA_DISPLAY.MAX_HEIGHT
```

### Step 3: Refactor PostCard
```bash
# Edit: src/features/posts/components/PostCard.tsx
# แยก sections, ปรับ media edge-to-edge
```

### Step 4: Update Media Components
```bash
# Edit: src/shared/components/media/MediaGrid.tsx
# Edit: src/shared/components/media/SingleImageViewer.tsx
# Edit: src/shared/components/media/SingleVideoPlayer.tsx
# อัปเดต max-height ใหม่
```

### Step 5: Test
```bash
npm run dev
# ทดสอบทุกหน้า:
# - / (feed)
# - /post/[id] (detail)
# - /my-posts
# - /saved
# - /profile/[username]
```

### Step 6: Verify
- ✅ Media แสดงแบบ edge-to-edge
- ✅ รูปแนวสูงแสดงได้มากขึ้น
- ✅ Responsive ใน mobile
- ✅ Lightbox ยังใช้งานได้
- ✅ Video controls ยังใช้งานได้

---

## 🚨 Potential Issues

### Issue 1: Border Radius ที่ขอบ Media
**ปัญหา:**
- Media edge-to-edge จะทำให้ rounded-lg ของ PostCard ไม่เห็นที่ขอบ media

**แก้ไข:**
```tsx
// ถ้า media อยู่บนสุด → ใช้ rounded-t-lg
// ถ้า media อยู่ล่างสุด → ใช้ rounded-b-lg
// ถ้า media อยู่ตรงกลาง → ไม่ต้อง rounded
```

### Issue 2: Mobile Performance
**ปัญหา:**
- รูปใหญ่ (1200px) อาจช้าใน mobile

**แก้ไข:**
- ใช้ responsive max-height (90vh)
- ใช้ lazy loading
- ใช้ Next.js Image optimization

### Issue 3: Crosspost Confusion
**ปัญหา:**
- Crosspost media อยู่ใน muted box แต่ main media edge-to-edge อาจสับสน

**แก้ไข:**
- เก็บ crosspost media ไว้ใน padding area (ตามเดิม)
- ทำให้ชัดเจนว่า crosspost เป็นส่วนหนึ่งของ content

---

## 📱 Mobile Considerations

### Viewport Height Strategy
```tsx
// Mobile: ใช้ vh เพื่อป้องกันรูปใหญ่เกิน scroll
className={cn(
  "max-h-[800px]",           // Desktop fallback
  "max-h-[70vh]",            // Mobile: 70% viewport
  "lg:max-h-[800px]"         // Desktop: fixed 800px
)}
```

### Touch Interactions
- Media ยังคลิกเปิด Lightbox ได้
- Video ยัง control ได้
- Zoom ใน Lightbox ใช้ pinch-to-zoom

---

## 🎯 Success Metrics

### Performance
- [ ] Page load time ไม่เพิ่มมากกว่า 10%
- [ ] Lighthouse score ≥ 90
- [ ] No layout shift (CLS < 0.1)

### UX
- [ ] Media แสดงแบบ edge-to-edge ในทุกหน้า
- [ ] รูปแนวสูงแสดงได้มากขึ้น 30-50%
- [ ] Responsive ใน mobile, tablet, desktop

### Visual
- [ ] ดูเหมือน Facebook/Instagram feed
- [ ] Consistent spacing
- [ ] No broken layouts

---

## 🔍 Testing Checklist

### Visual Testing
- [ ] Feed page (/) - multiple posts
- [ ] Post detail page - single/multiple media
- [ ] My posts page
- [ ] Saved posts page
- [ ] Profile page
- [ ] Tag page
- [ ] Search results

### Media Types
- [ ] Single image (landscape)
- [ ] Single image (portrait 9:16)
- [ ] Single video
- [ ] Multiple images (2, 3, 4, 5+)
- [ ] Multiple videos
- [ ] Mixed (image + video)
- [ ] Crosspost with media

### Devices
- [ ] Mobile (375px)
- [ ] Tablet (768px)
- [ ] Desktop (1024px)
- [ ] Large desktop (1920px)

### Edge Cases
- [ ] Very tall image (1:3 aspect ratio)
- [ ] Very wide image (3:1 aspect ratio)
- [ ] Animated GIF
- [ ] Large video (>100MB)
- [ ] No media (text-only post)

---

## 📝 Rollback Plan

หากเกิดปัญหา สามารถ rollback ได้โดย:

```bash
# Restore backups
mv src/features/posts/components/PostCard.tsx.backup src/features/posts/components/PostCard.tsx
mv src/shared/config/constants.ts.backup src/shared/config/constants.ts

# Restart dev server
npm run dev
```

---

## 🚀 Next Steps

1. **Review** แผนนี้กับทีม
2. **Implement** Phase 1 (PostCard refactor)
3. **Test** ใน staging environment
4. **Deploy** to production
5. **Monitor** user feedback และ analytics
6. **Iterate** ตาม feedback

---

## 💡 Future Enhancements

### 1. Adaptive Media Height
- ใช้ ML/AI detect รูปแนวตั้ง → ปรับ max-height อัตโนมัติ
- รองรับ ultra-wide (21:9) และ ultra-tall (9:21)

### 2. Smart Cropping
- Auto-crop รูปแนวนอนให้เหมาะกับ feed
- แสดง "See full image" button

### 3. Infinite Canvas
- ไม่จำกัด max-height สำหรับ long images
- ใช้ virtual scroll

### 4. Comparison View
- Toggle ระหว่าง original vs cropped
- A/B test UX

---

## 📚 References

### Design Inspiration
- **Facebook:** Edge-to-edge media, adaptive height
- **Instagram:** Grid layout, square crops
- **Twitter:** Full-width media, 16:9 max
- **Pinterest:** Masonry layout, unlimited height

### Technical Resources
- [CSS aspect-ratio](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- [Responsive images](https://web.dev/responsive-images/)
- [Core Web Vitals](https://web.dev/vitals/)

---

## ✅ Summary

แผนนี้จะทำให้ PostCard:
1. **ดูดีขึ้น** - Media edge-to-edge เหมือน Facebook
2. **แสดงรูปได้มากขึ้น** - เพิ่ม max-height 33-50%
3. **Responsive** - รองรับ mobile, tablet, desktop
4. **Maintainable** - แยก concerns ชัดเจน

การเปลี่ยนแปลงส่วนใหญ่เป็น **non-breaking changes** และสามารถ **rollback** ได้ง่าย ✨
