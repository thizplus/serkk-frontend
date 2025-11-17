# Post Feed Patterns Analysis

> 📅 วิเคราะห์เมื่อ: 2025-11-17
> 🎯 วัตถุประสงค์: วิเคราะห์รูปแบบ post ที่มีในระบบ เพื่อให้ผู้เชี่ยวชาญช่วยปรับปรุง
> 📊 สถานะ: Current Implementation

---

## 📋 สรุปภาพรวม

### Post Types ที่รองรับ:
```typescript
type PostType = 'text' | 'image' | 'gallery' | 'video';
```

### Media Types:
```typescript
type MediaType = 'image' | 'video' | 'file';
```

### จำนวนรูปแบบที่มี:
- **Post Types:** 4 แบบ (text, image, gallery, video)
- **Media Display Patterns:** 3 แบบ (single-video, single-image, multi-media)
- **Post Variations:** 6 แบบหลัก (รวม crosspost, optimistic)

---

## 🎨 รูปแบบ Post ที่มีในระบบ

### 1. Text-Only Post

**ลักษณะ:**
- ไม่มีรูป/วิดีโอ
- มีแค่ title + content
- สูงน้อยที่สุด

**โครงสร้าง:**
```
┌─────────────────────────────────┐
│ 👤 Author • 2h ago              │ 60px (header)
├─────────────────────────────────┤
│ Title (text-lg, font-semibold)  │ ~40px
│ Content (text-sm, line-clamp-3) │ ~72px (3 lines)
│ #tag1 #tag2                     │ ~36px
│ ❤️ 123  💬 45  🔁  🔖          │ 44px (footer)
└─────────────────────────────────┘

Total: ~252px
```

**Height Estimate:**
- Minimum: ~200px (short content)
- Average: ~250px
- Maximum: ~300px (long content with tags)

---

### 2. Single Image Post

**ลักษณะ:**
- Title + Content
- รูปภาพ 1 รูป
- รูปแสดงแบบ edge-to-edge (ไม่มี padding ซ้าย-ขวา)

**โครงสร้าง:**
```
┌─────────────────────────────────┐
│ 👤 Author • 2h ago              │ 60px
├─────────────────────────────────┤
│ Title                           │ 40px
│ Content (line-clamp-3)          │ 72px
├─────────────────────────────────┤ ← edge-to-edge
│                                 │
│   [     Single Image    ]       │ Variable (400-600px)
│                                 │
├─────────────────────────────────┤
│ #tag1 #tag2                     │ 36px
│ ❤️ 123  💬 45  🔁  🔖          │ 44px
└─────────────────────────────────┘

Total: 652-852px (depends on image aspect ratio)
```

**Image Display:**
- Component: `SingleImageViewer`
- Aspect ratio: ไม่ fixed (รักษา aspect ratio ของรูปจริง)
- Max height: ไม่จำกัด (อาจปัญหาถ้ารูปสูงมาก)
- Lightbox: ✅ เปิดได้ (zoom)

**Height Estimate:**
- Minimum: ~500px (landscape image)
- Average: ~650px
- Maximum: ~1000px+ (portrait image)

---

### 3. Gallery Post (Multiple Images)

**ลักษณะ:**
- Title + Content
- รูปภาพ 2+ รูป
- แสดงเป็น grid

**โครงสร้าง:**
```
┌─────────────────────────────────┐
│ 👤 Author • 2h ago              │ 60px
├─────────────────────────────────┤
│ Title                           │ 40px
│ Content (line-clamp-3)          │ 72px
├─────────────────────────────────┤
│ ┌────────┬────────┐             │
│ │  Img1  │  Img2  │             │ Grid layout
│ ├────────┼────────┤             │ Variable height
│ │  Img3  │  Img4  │             │
│ └────────┴────────┘             │
├─────────────────────────────────┤
│ #tag1 #tag2                     │ 36px
│ ❤️ 123  💬 45  🔁  🔖          │ 44px
└─────────────────────────────────┘

Total: 600-900px (depends on grid rows)
```

**Grid Display:**
- Component: `MultiMediaGrid`
- Layout:
  - 2 images: 1 row, 2 columns
  - 3 images: 2 rows (2+1 or 1+2)
  - 4+ images: 2 rows, 2 columns (+ "more" overlay)
- Aspect ratio: แต่ละรูปใช้ `aspect-square` (1:1)
- Lightbox: ✅ เปิดเป็น carousel

**Height Estimate:**
- 2 images: ~550px (1 row)
- 3-4 images: ~750px (2 rows)
- 5+ images: ~750px (2 rows + overlay)

---

### 4. Single Video Post

**ลักษณะ:**
- Title + Content
- วิดีโอ 1 วิดีโอ
- แสดงแบบ inline player

**โครงสร้าง:**
```
┌─────────────────────────────────┐
│ 👤 Author • 2h ago              │ 60px
├─────────────────────────────────┤
│ Title                           │ 40px
│ Content (line-clamp-3)          │ 72px
├─────────────────────────────────┤
│  ┌──────────────────────┐       │
│  │   Video Player       │       │ 16:9 aspect ratio
│  │   [  ▶  Play  ]     │       │
│  └──────────────────────┘       │
├─────────────────────────────────┤
│ #tag1 #tag2                     │ 36px
│ ❤️ 123  💬 45  🔁  🔖          │ 44px
└─────────────────────────────────┘

Total: ~650px (16:9 video)
```

**Video Display:**
- Component: `SingleVideoPlayer`
- Aspect ratio: 16:9 (forced)
- Controls: Native HTML5 controls
- Autoplay: ❌ (user must click play)
- Muted: ✅ (when autoplay)
- Lightbox: ❌ (plays inline)

**Height Estimate:**
- Fixed: ~650px (16:9 video player)

---

### 5. Crosspost

**ลักษณะ:**
- โพสต์ที่ share จากโพสต์อื่น
- มี source post แสดงด้านใน
- Source post มี border-left สีฟ้า

**โครงสร้าง:**
```
┌─────────────────────────────────┐
│ 👤 Author • 2h ago              │ 60px
├─────────────────────────────────┤
│ Title (ของ crosspost)           │ 40px
│ Content (ของ crosspost)         │ 72px
├─────────────────────────────────┤
│ ┃ 🔁 โพสต์ข้ามจาก @user       │ ← Source post
│ ┃ ┌───────────────────────┐     │
│ ┃ │ Source Title          │     │
│ ┃ │ Source Content        │     │
│ ┃ │ [Source Media]        │     │
│ ┃ └───────────────────────┘     │
├─────────────────────────────────┤
│ #tag1 #tag2                     │ 36px
│ ❤️ 123  💬 45  🔁  🔖          │ 44px
└─────────────────────────────────┘

Total: 800-1000px
```

**Source Post Media:**
- แสดงแค่ media แรก
- Max height: 320px
- Clickable → navigate to source post

**Height Estimate:**
- Without media: ~500px
- With media: ~800-1000px

---

### 6. Optimistic Post (Uploading)

**ลักษณะ:**
- โพสต์ที่กำลังอัปโหลด
- แสดงทันทีหลัง submit (Phase 2)
- มี loading indicator

**โครงสร้าง:**
```
┌─────────────────────────────────┐
│ [⏳ กำลังอัปโหลด...]           │ 40px (badge)
│ 👤 Author • just now            │ 60px
├─────────────────────────────────┤
│ Title                           │ 40px
│ Content                         │ 72px
├─────────────────────────────────┤
│ [    Media with overlay   ]     │
│   🔄 Loading spinner            │ Variable
│   กำลังอัปโหลดวิดีโอ...         │
├─────────────────────────────────┤
│ (no tags, no actions)           │
└─────────────────────────────────┘

Total: Similar to regular post + 40px badge
```

**Differences from Regular Post:**
- ✅ Has upload status badge
- ✅ Has loading overlay on media
- ❌ No tags (not saved yet)
- ❌ No action buttons (can't vote/comment)
- ❌ Not clickable

**Height Estimate:**
- Text-only: ~300px
- With media: ~650-900px

---

## 📐 Height Ranges Summary

| Post Type | Min Height | Avg Height | Max Height | Variable? |
|-----------|-----------|-----------|-----------|-----------|
| Text-only | 200px | 250px | 300px | ✅ (content length) |
| Single Image | 500px | 650px | 1000px+ | ✅✅ (image aspect) |
| Gallery (2-4) | 550px | 750px | 900px | ✅ (grid rows) |
| Single Video | 650px | 650px | 650px | ❌ (fixed 16:9) |
| Crosspost | 500px | 800px | 1000px | ✅✅ (nested content) |
| Optimistic | +40px | +40px | +40px | ✅ (base + badge) |

**สรุป:**
- **Most Predictable:** Single Video (fixed height)
- **Least Predictable:** Single Image, Crosspost (dynamic content)
- **Average Range:** 250px - 900px

---

## 🎯 ปัญหาที่พบ (Current Issues)

### 1. **Height Variability ⚠️**

**ปัญหา:** Single Image posts มี height ที่ไม่แน่นอนมาก

**ตัวอย่าง:**
- Portrait image (9:16): ~1200px
- Landscape image (16:9): ~400px
- Square image (1:1): ~600px

**ผลกระทบ:**
- Virtual scrolling ต้อง measure height จริง
- Scroll jump เมื่อรูปโหลดเสร็จ

**แนวทางแก้:**
- Option A: Force max-height (เช่น 600px)
- Option B: Force aspect ratio (เช่น 4:5 เหมือน Instagram)
- Option C: Measure height + cache

---

### 2. **No Image Placeholder/Skeleton**

**ปัญหา:** รูปโหลดช้า → height เปลี่ยนทีหลัง

**ปัจจุบัน:**
- ไม่มี skeleton loader
- ไม่มี fixed aspect ratio
- Height คำนวณหลังรูปโหลด

**ผลกระทบ:**
- Scroll jump
- Layout shift (poor CLS score)

**แนวทางแก้:**
- เพิ่ม skeleton loader
- Reserve space ด้วย aspect-ratio CSS
- Progressive image loading (blur → sharp)

---

### 3. **Crosspost Nested Height**

**ปัญหา:** Crosspost มี nested content → height ซับซ้อน

**สูตรคำนวณ:**
```
Crosspost Height =
  Header (60px) +
  Title (40px) +
  Content (72px) +
  Source Post Container (
    Header (24px) +
    Title (20px) +
    Content (32px) +
    Media (0-320px)
  ) +
  Tags (36px) +
  Footer (44px)

= 288px + Source Media (0-320px)
= 288-608px
```

**ผลกระทบ:**
- ยากต่อการ estimate height
- ต้อง measure จริง

---

### 4. **Gallery Grid Layout**

**ปัญหา:** Grid layout ไม่ consistent

**ปัจจุบัน:**
- 2 images: 2 columns, 1 row
- 3 images: ? (unknown layout)
- 4 images: 2x2 grid
- 5+ images: 2x2 + overlay

**ปัญหา:**
- Layout logic ซับซ้อน
- Height ไม่แน่นอน

**แนวทางแก้:**
- กำหนด layout rules ชัดเจน
- ใช้ aspect-square ทุกรูป (consistent)

---

### 5. **Video Aspect Ratio**

**ปัญหา:** บังคับ 16:9 แต่วิดีโอจริงอาจเป็น 9:16 (portrait)

**ปัจจุบัน:**
- Force 16:9 ทุกวิดีโอ
- Portrait video → แสดงผิดรูป

**ผลกระทบ:**
- Portrait video มี black bars
- ไม่เหมาะกับ TikTok-style content

**แนวทางแก้:**
- Option A: รักษา aspect ratio จริง (แต่ height ไม่แน่นอน)
- Option B: Max height + contain (แสดง black bars)
- Option C: Detect orientation → ใช้ aspect ที่เหมาะสม

---

## 💡 Recommendations for Expert Review

### 1. Image Display Strategy

**คำถาม:**
- ควรบังคับ aspect ratio หรือไม่?
- Instagram ใช้ 4:5, Twitter ใช้ max-height 500px
- Max height ควรเป็นเท่าไร?

**ตัวเลือก:**

**A. Fixed Aspect Ratio (เหมือน Instagram)**
```css
.image-container {
  aspect-ratio: 4 / 5;
  max-height: 600px;
}
```
- ✅ Height predictable
- ✅ UI consistent
- ❌ ตัดรูปบางรูป

**B. Max Height + Contain**
```css
.image-container {
  max-height: 600px;
  object-fit: contain;
}
```
- ✅ ไม่ตัดรูป
- ⚠️ Height ยังไม่แน่นอน
- ⚠️ Portrait images สูงเต็ม 600px

**C. Dynamic with Skeleton**
```css
.image-skeleton {
  aspect-ratio: 16 / 9; /* default */
  min-height: 300px;
}
```
- ✅ Flexible
- ✅ No crop
- ⚠️ ต้อง measure height จริง
- ⚠️ Skeleton อาจผิดจาก actual size

---

### 2. Gallery Layout Rules

**ควรกำหนด layout ยังไง?**

**ตัวอย่างจาก Facebook:**
- 2 images: 2 columns, equal width
- 3 images: 1 large (left) + 2 small (right)
- 4 images: 2x2 grid
- 5+ images: complex layout

**ตัวอย่างจาก Instagram:**
- ทุกรูป aspect-square
- Always 1 row
- Scroll horizontal

**ควรเลือกแบบไหน?**

---

### 3. Video Aspect Ratio

**ควรรองรับ portrait video หรือไม่?**

**ปัจจุบัน:** Force 16:9 ทุกวิดีโอ

**ตัวเลือก:**

**A. Auto-detect orientation**
```typescript
if (video.width > video.height) {
  aspectRatio = '16/9'; // landscape
} else {
  aspectRatio = '9/16'; // portrait
}
```
- ✅ เหมาะกับ TikTok-style
- ⚠️ Height ไม่แน่นอน
- ⚠️ Portrait video สูงมาก

**B. Max height for all**
```css
.video-container {
  max-height: 600px;
  aspect-ratio: 16 / 9;
}
```
- ✅ Consistent height
- ❌ Portrait video ดูไม่ดี

---

### 4. Crosspost Display

**ควรจำกัด height ของ source post หรือไม่?**

**ปัจจุบัน:**
- Source post แสดงเต็ม
- อาจสูงมาก

**ตัวเลือก:**

**A. Collapsed by default**
- แสดงแค่ title + preview
- Click to expand

**B. Max height + "See more"**
```css
.source-post-content {
  max-height: 200px;
  overflow: hidden;
}
```

**C. แสดงเต็ม (current)**
- อาจสูงเกินไป

---

### 5. Skeleton/Placeholder

**ควรใช้ skeleton loader หรือไม่?**

**ตัวอย่าง:**
```typescript
{!imageLoaded && (
  <div className="aspect-[4/5] bg-gray-200 animate-pulse" />
)}
<img
  src={url}
  onLoad={() => setImageLoaded(true)}
  className={imageLoaded ? 'block' : 'hidden'}
/>
```

**หรือใช้ blur placeholder (LQIP)?**
```typescript
<img
  src={thumbnailUrl} // low quality
  className="blur-sm"
/>
<img
  src={fullUrl} // full quality
  onLoad={onLoad}
/>
```

---

## 📊 Height Estimation Formula

### สำหรับ Virtual Scrolling:

```typescript
function estimatePostHeight(post: Post): number {
  let height = 0;

  // Header
  height += 60;

  // Title
  height += 40;

  // Content (if expanded)
  if (post.content) {
    const lines = Math.min(3, Math.ceil(post.content.length / 60));
    height += lines * 24;
  }

  // Media
  if (post.media && post.media.length > 0) {
    if (post.type === 'text') {
      // No media
    } else if (post.type === 'video') {
      height += 400; // 16:9 video
    } else if (post.type === 'image') {
      height += 600; // Single image (estimated)
    } else if (post.type === 'gallery') {
      height += 650; // Gallery grid
    }
  }

  // Crosspost
  if (post.sourcePost) {
    height += 200; // Source post base
    if (post.sourcePost.media && post.sourcePost.media.length > 0) {
      height += 320; // Source media
    }
  }

  // Tags
  if (post.tags && post.tags.length > 0) {
    height += 36;
  }

  // Footer
  height += 44;

  // Padding/margins
  height += 20;

  return height;
}
```

**ความแม่นยำ:** ~80-90% (ขึ้นกับ media aspect ratio)

---

## 🎨 UI Improvements Suggestions

### 1. Consistent Image Display
- กำหนด max-height: 600px
- ใช้ aspect-ratio CSS
- เพิ่ม skeleton loader

### 2. Gallery Layout Rules
- 2 images: 1 row
- 3-4 images: 2 rows (2x2)
- 5+ images: 2 rows + overlay
- ทุกรูป aspect-square

### 3. Video Player
- Detect orientation
- Portrait: max-height 800px
- Landscape: 16:9 aspect ratio

### 4. Crosspost
- Limit source post height: 400px
- Add "See more" button

### 5. Skeleton Loading
- Show blur placeholder
- Reserve space ด้วย aspect-ratio
- Smooth transition

---

## ✅ Checklist for Expert Review

- [ ] ควรบังคับ image aspect ratio หรือไม่?
- [ ] Max height ของรูปควรเป็นเท่าไร?
- [ ] Gallery layout ควรเป็นแบบไหน?
- [ ] ควรรองรับ portrait video หรือไม่?
- [ ] Crosspost ควรจำกัด height หรือไม่?
- [ ] ควรใช้ skeleton loader หรือไม่?
- [ ] Height estimation formula ถูกต้องหรือไม่?

---

**สรุป:** ระบบมี 6 รูปแบบหลัก แต่ความสูงไม่แน่นอน (200-1000px+) ต้องปรับให้ consistent ก่อนทำ virtual scrolling
