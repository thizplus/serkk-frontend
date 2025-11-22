# แผนปรับปรุง Media Layout System - Aspect Ratio & Templates

**วันที่:** 22 พฤศจิกายน 2568
**ผู้วางแผน:** Claude Code
**เป้าหมาย:** ปรับ aspect ratio ให้ดูดีขึ้น และแยก template แต่ละจำนวนให้ชัดเจน

---

## 🎯 เป้าหมายหลัก

### 1. Desktop: อย่างน้อย 1:1 (ไม่ให้แบนเกินไป)
- ✅ Single image: aspect-square (1:1) หรือ aspect-[4/5] (portrait-ish)
- ✅ Multiple images: aspect-square (1:1)

### 2. Mobile: 1:1 หรือแนวสูง (portrait)
- ✅ Single image: aspect-square (1:1) หรือ aspect-[4/5]
- ✅ Multiple images: aspect-square (1:1)

### 3. วิดีโอต้องรู้ Orientation
- ✅ Landscape (width > height) → aspect-video (16:9)
- ✅ Portrait (height > width) → aspect-[3/4]
- ✅ Square → aspect-square (1:1)

### 4. แยก Template ชัดเจน
- ✅ 1 ภาพ
- ✅ 1 วิดีโอ (แยก landscape/portrait)
- ✅ 2 ภาพ
- ✅ 3 ภาพ
- ✅ 4 ภาพ
- ✅ 5 ภาพ
- ✅ 6 ภาพ
- ✅ 7+ ภาพ (แสดง 6 + overlay)

---

## 📊 ปัญหาปัจจุบัน

### 1. Single Image
```tsx
// ❌ ปัญหา: Desktop แบนเกินไป (16:9)
<div className="aspect-[4/5] sm:aspect-[16/9]">
  <img src={url} />
</div>
```
**ผลลัพธ์:**
- Mobile: 4:5 (800x1000) - ✅ โอเค
- Desktop: 16:9 (1600x900) - ❌ แบนมาก!

### 2. Single Video
```tsx
// ❌ ปัญหา: ไม่รู้ว่าวิดีโอเป็นแนวตั้งหรือนอน
<div className="aspect-video"> {/* 16:9 เสมอ */}
  <video src={url} />
</div>
```
**ผลลัพธ์:**
- วิดีโอแนวนอน → ✅ โอเค (16:9)
- วิดีโอแนวตั้ง → ❌ มี letterbox ดำข้างๆ

### 3. Multiple Images
```tsx
// ❌ ปัญหา: Fixed height 320px อาจทำให้ crop มากเกินไป
<div style={{ height: '320px' }}>
  <img className="object-cover" />
</div>
```

### 4. ไม่มี GridLayout6
- 6 ภาพ → ใช้ GridLayout5Plus (แสดงแค่ 5 + overlay "+1")
- 7+ ภาพ → ใช้ GridLayout5Plus (แสดงแค่ 5 + overlay "+N")

---

## 🔧 แนวทางแก้ไข

### ขั้นที่ 1: เพิ่ม Metadata (width, height, duration)

#### ปัจจุบัน
```typescript
interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
}
```

#### ใหม่ (เพิ่ม metadata)
```typescript
interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  width?: number;      // ✅ ต้องมี! สำหรับคำนวณ orientation
  height?: number;     // ✅ ต้องมี! สำหรับคำนวณ orientation
  duration?: number;   // ✅ สำหรับวิดีโอ (seconds)
}
```

#### Helper Function
```typescript
// utils/mediaUtils.ts
export type MediaOrientation = 'landscape' | 'portrait' | 'square';

export function getMediaOrientation(width?: number, height?: number): MediaOrientation {
  if (!width || !height) return 'landscape'; // default

  const ratio = width / height;

  if (ratio > 1.1) return 'landscape';  // width > height
  if (ratio < 0.9) return 'portrait';   // height > width
  return 'square';                      // ~1:1
}

export function getAspectRatioClass(orientation: MediaOrientation, type: 'image' | 'video'): string {
  if (type === 'video') {
    switch (orientation) {
      case 'landscape': return 'aspect-video';      // 16:9
      case 'portrait': return 'aspect-[3/4]';       // 3:4
      case 'square': return 'aspect-square';        // 1:1
    }
  } else {
    switch (orientation) {
      case 'landscape': return 'aspect-[4/3]';      // 4:3
      case 'portrait': return 'aspect-[4/5]';       // 4:5
      case 'square': return 'aspect-square';        // 1:1
    }
  }
}
```

---

### ขั้นที่ 2: ปรับ SingleImageViewer

#### ปัจจุบัน (❌ Desktop แบนเกินไป)
```tsx
<div className="aspect-[4/5] sm:aspect-[16/9]">
  <img src={url} />
</div>
```

#### ใหม่ (✅ Desktop 1:1 หรือ 4:5)

**Option A: Fixed Aspect (ไม่ใช้ metadata)**
```tsx
// Desktop: aspect-square (1:1)
// Mobile: aspect-[4/5] (portrait-ish)
<div className="aspect-[4/5] sm:aspect-square">
  <img src={url} className="w-full h-full object-cover" />
</div>
```

**Option B: Dynamic Aspect (ใช้ metadata)** ⭐ แนะนำ
```tsx
const orientation = getMediaOrientation(media.width, media.height);
const aspectClass = getAspectRatioClass(orientation, 'image');

<div className={cn("w-full", aspectClass)}>
  <img src={url} className="w-full h-full object-cover" />
</div>
```

**ผลลัพธ์:**
| Image Type | Mobile | Desktop |
|------------|--------|---------|
| Landscape (16:9) | aspect-[4/3] | aspect-[4/3] |
| Portrait (9:16) | aspect-[4/5] | aspect-[4/5] |
| Square (1:1) | aspect-square | aspect-square |

---

### ขั้นที่ 3: ปรับ SingleVideoPlayer (รู้ Orientation)

#### ปัจจุบัน (❌ ไม่รู้ orientation)
```tsx
<div className="aspect-video"> {/* 16:9 เสมอ */}
  <video src={url} />
</div>
```

#### ใหม่ (✅ รู้ orientation)
```tsx
const orientation = getMediaOrientation(media.width, media.height);
const aspectClass = getAspectRatioClass(orientation, 'video');

<div className={cn("w-full", aspectClass)}>
  <video src={url} className="w-full h-full bg-black" controls />
</div>
```

**ผลลัพธ์:**
| Video Type | Aspect Ratio | Example |
|------------|--------------|---------|
| Landscape (1920x1080) | aspect-video (16:9) | YouTube horizontal |
| Portrait (1080x1920) | aspect-[3/4] | TikTok, Instagram Reels |
| Square (1080x1080) | aspect-square (1:1) | Instagram post |

---

### ขั้นที่ 4: ปรับ GridLayouts (ใช้ aspect-square แทน fixed height)

#### ปัจจุบัน (❌ Fixed height 320px)
```tsx
// GridLayout2.tsx
<div className="grid grid-cols-2 gap-1" style={{ height: '320px' }}>
  <MediaItem media={item1} />
  <MediaItem media={item2} />
</div>
```

#### ใหม่ (✅ ใช้ aspect-square)

**Option A: แบบ Responsive (แนะนำสำหรับ Feed)** ⭐
```tsx
// GridLayout2.tsx
<div className="grid grid-cols-2 gap-1">
  {media.map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} />
    </div>
  ))}
</div>
```

**Option B: แบบ Fixed Height (สำหรับ Virtual Scroll)**
```tsx
// GridLayout2.tsx (ถ้าต้องการ fixed height สำหรับ virtual scroll)
<div
  className="grid grid-cols-2 gap-1"
  style={{ height: '400px' }} // ✅ เพิ่มจาก 320 → 400px (ใกล้เคียง 1:1 มากขึ้น)
>
  {media.map((item, index) => (
    <div key={item.id} className="relative w-full h-full overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} />
    </div>
  ))}
</div>
```

**ผลกระทบ:**
- ✅ รูปภาพไม่ถูก crop มากเกินไป
- ✅ Desktop: ดูไม่แบนเกินไป (ใกล้เคียง 1:1)
- ✅ Mobile: ดูไม่แบนเกินไป
- ⚠️ Virtual scroll อาจต้องปรับ (ถ้าใช้ Option A)

---

### ขั้นที่ 5: สร้าง GridLayout6 (สำหรับ 6 ภาพ)

#### Layout Design: 2x3 Grid
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
└─────┴─────┴─────┘
```

#### Implementation
```tsx
// GridLayout6.tsx
export function GridLayout6({
  media,
  editable = false,
  onMediaClick,
  onRemove,
  className,
}: GridLayoutProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-1 overflow-hidden", className)}>
      {media.slice(0, 6).map((item, index) => (
        <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
          <MediaItem
            media={item}
            index={index}
            editable={editable}
            onClick={onMediaClick}
            onRemove={onRemove}
          />
        </div>
      ))}
    </div>
  );
}
```

**ข้อดี:**
- ✅ แสดงครบ 6 ภาพ (ไม่ต้องใช้ overlay "+1")
- ✅ aspect-square ทุกรูป (1:1)
- ✅ Responsive (ปรับขนาดตาม container width)

---

### ขั้นที่ 6: ปรับ GridLayout5Plus (สำหรับ 7+ ภาพ)

#### ปัจจุบัน (แสดงสูงสุด 5 ภาพ)
```tsx
const displayMedia = media.slice(0, 5);
const remainingCount = media.length - 5;
```

#### ใหม่ (แสดงสูงสุด 6 ภาพ)
```tsx
const displayMedia = media.slice(0, 6);
const remainingCount = Math.max(0, media.length - 6);

// Layout: 2x3 grid
<div className="grid grid-cols-3 gap-1">
  {displayMedia.map((item, index) => (
    <div key={item.id} className="aspect-square">
      <MediaItem
        media={item}
        index={index}
        showOverlay={index === 5 && remainingCount > 0}
        remainingCount={remainingCount}
      />
    </div>
  ))}
</div>
```

**ผลลัพธ์:**
- 7 ภาพ → แสดง 6 + overlay "+1"
- 10 ภาพ → แสดง 6 + overlay "+4"
- 20 ภาพ → แสดง 6 + overlay "+14"

---

## 📐 Template แต่ละแบบ (Summary)

### 1. 1 ภาพ (Single Image)

**Layout:**
```
┌─────────────┐
│             │
│   Image     │
│   1:1 or    │
│   4:5       │
│             │
└─────────────┘
```

**Aspect Ratio:**
- Desktop: `aspect-square` (1:1) หรือ `aspect-[4/5]` (ตาม metadata)
- Mobile: `aspect-square` (1:1) หรือ `aspect-[4/5]`

**Component:** `SingleImageViewer.tsx`

**Code:**
```tsx
const orientation = getMediaOrientation(media.width, media.height);
const aspectClass = orientation === 'square' ? 'aspect-square' : 'aspect-[4/5]';

<div className={cn("w-full", aspectClass)}>
  <img src={media.url} className="w-full h-full object-cover" />
</div>
```

---

### 2. 1 วิดีโอ (Single Video)

**Layout Landscape (16:9):**
```
┌──────────────────┐
│                  │
│   Video 16:9     │
│                  │
└──────────────────┘
```

**Layout Portrait (3:4):**
```
┌──────────┐
│          │
│          │
│  Video   │
│   3:4    │
│          │
│          │
└──────────┘
```

**Aspect Ratio (ตาม orientation):**
- Landscape: `aspect-video` (16:9)
- Portrait: `aspect-[3/4]`
- Square: `aspect-square` (1:1)

**Component:** `SingleVideoPlayer.tsx`

**Code:**
```tsx
const orientation = getMediaOrientation(media.width, media.height);
const aspectClass = getAspectRatioClass(orientation, 'video');

<div className={cn("w-full", aspectClass)}>
  <video src={media.url} controls className="w-full h-full bg-black" />
</div>
```

---

### 3. 2 ภาพ (Two Images)

**Layout:**
```
┌───────┬───────┐
│   1   │   2   │
│ 1:1   │ 1:1   │
└───────┴───────┘
```

**Aspect Ratio:**
- ทั้ง 2 รูป: `aspect-square` (1:1)

**Component:** `GridLayout2.tsx`

**Code:**
```tsx
<div className="grid grid-cols-2 gap-1">
  {media.slice(0, 2).map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} {...props} />
    </div>
  ))}
</div>
```

---

### 4. 3 ภาพ (Three Images)

**Layout (Instagram Style):**
```
┌─────────┬───┐
│         │ 2 │
│    1    ├───┤
│  1:1    │ 3 │
└─────────┴───┘
```

**Aspect Ratio:**
- รูปที่ 1: `aspect-square` (large)
- รูปที่ 2, 3: `aspect-square` (small)

**Component:** `GridLayout3.tsx`

**Code:**
```tsx
<div className="grid grid-cols-2 gap-1">
  {/* Large left */}
  <div className="row-span-2 aspect-square overflow-hidden rounded-lg bg-muted">
    <MediaItem media={media[0]} index={0} {...props} />
  </div>

  {/* Right stacked */}
  <div className="grid grid-rows-2 gap-1">
    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={media[1]} index={1} {...props} />
    </div>
    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={media[2]} index={2} {...props} />
    </div>
  </div>
</div>
```

---

### 5. 4 ภาพ (Four Images)

**Layout:**
```
┌─────┬─────┐
│  1  │  2  │
│ 1:1 │ 1:1 │
├─────┼─────┤
│  3  │  4  │
│ 1:1 │ 1:1 │
└─────┴─────┘
```

**Aspect Ratio:**
- ทั้ง 4 รูป: `aspect-square` (1:1)

**Component:** `GridLayout4.tsx`

**Code:**
```tsx
<div className="grid grid-cols-2 gap-1">
  {media.slice(0, 4).map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} {...props} />
    </div>
  ))}
</div>
```

---

### 6. 5 ภาพ (Five Images)

**Layout (Instagram Style):**
```
┌─────────────┬───┐
│             │ 2 │
│      1      ├───┤
│    Large    │ 3 │
├─────┬───────┴───┤
│  4  │     5     │
└─────┴───────────┘
```

**Aspect Ratio:**
- รูปที่ 1: `aspect-[4/3]` (large)
- รูปที่ 2, 3, 4, 5: `aspect-square` (1:1)

**Component:** `GridLayout5.tsx` (ใหม่ - แยกจาก GridLayout5Plus)

**Code:**
```tsx
<div className="grid grid-cols-3 gap-1">
  {/* Large top-left (2 cols, 2 rows) */}
  <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
    <MediaItem media={media[0]} index={0} {...props} />
  </div>

  {/* Right top */}
  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
    <MediaItem media={media[1]} index={1} {...props} />
  </div>

  {/* Right middle */}
  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
    <MediaItem media={media[2]} index={2} {...props} />
  </div>

  {/* Bottom left */}
  <div className="aspect-square overflow-hidden rounded-lg bg-muted">
    <MediaItem media={media[3]} index={3} {...props} />
  </div>

  {/* Bottom center + right */}
  <div className="col-span-2 aspect-[2/1] overflow-hidden rounded-lg bg-muted grid grid-cols-2 gap-1">
    <MediaItem media={media[4]} index={4} {...props} />
  </div>
</div>
```

---

### 7. 6 ภาพ (Six Images) ✅ ใหม่

**Layout:**
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
│ 1:1 │ 1:1 │ 1:1 │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
│ 1:1 │ 1:1 │ 1:1 │
└─────┴─────┴─────┘
```

**Aspect Ratio:**
- ทั้ง 6 รูป: `aspect-square` (1:1)

**Component:** `GridLayout6.tsx` (ใหม่)

**Code:**
```tsx
<div className="grid grid-cols-3 gap-1">
  {media.slice(0, 6).map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} {...props} />
    </div>
  ))}
</div>
```

---

### 8. 7+ ภาพ (Seven or More Images)

**Layout (แสดงสูงสุด 6 + overlay):**
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
│ 1:1 │ 1:1 │ 1:1 │
├─────┼─────┼─────┤
│  4  │  5  │ 6+N │
│ 1:1 │ 1:1 │ 1:1 │
└─────┴─────┴─────┘
       ↑
   Overlay "+N"
```

**Aspect Ratio:**
- ทั้ง 6 รูป: `aspect-square` (1:1)
- รูปที่ 6: มี overlay "+N"

**Component:** `GridLayout5Plus.tsx` (ปรับให้แสดง 6 รูป)

**Code:**
```tsx
const displayMedia = media.slice(0, 6);
const remainingCount = Math.max(0, media.length - 6);

<div className="grid grid-cols-3 gap-1">
  {displayMedia.map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted relative">
      <MediaItem
        media={item}
        index={index}
        showOverlay={index === 5 && remainingCount > 0}
        remainingCount={remainingCount}
        {...props}
      />
    </div>
  ))}
</div>
```

---

## 🗂️ File Structure Changes

### ไฟล์ที่ต้องแก้ไข

```
src/shared/
├── components/media/
│   ├── SingleImageViewer.tsx      ✅ แก้ไข (ใช้ aspect-square แทน 16:9)
│   ├── SingleVideoPlayer.tsx      ✅ แก้ไข (ใช้ orientation-based aspect)
│   ├── GridLayout2.tsx            ✅ แก้ไข (ใช้ aspect-square)
│   ├── GridLayout3.tsx            ✅ แก้ไข (ใช้ aspect-square)
│   ├── GridLayout4.tsx            ✅ แก้ไข (ใช้ aspect-square)
│   ├── GridLayout5.tsx            ✅ สร้างใหม่ (แยกจาก GridLayout5Plus)
│   ├── GridLayout6.tsx            ✅ สร้างใหม่ (2x3 grid)
│   ├── GridLayout5Plus.tsx        ✅ แก้ไข (สำหรับ 7+ รูป, แสดง 6 + overlay)
│   ├── MultiMediaGrid.tsx         ✅ แก้ไข (เพิ่ม case 5, 6)
│   └── types.ts                   ✅ แก้ไข (เพิ่ม width, height)
├── utils/
│   └── mediaUtils.ts              ✅ สร้างใหม่ (helper functions)
└── config/
    └── constants.ts               ✅ แก้ไข (เพิ่ม aspect ratio constants)
```

### ไฟล์ที่ต้องสร้างใหม่

1. **src/shared/utils/mediaUtils.ts**
   - `getMediaOrientation()`
   - `getAspectRatioClass()`
   - `formatDuration()` (bonus)

2. **src/shared/components/media/GridLayout5.tsx**
   - สำหรับ 5 ภาพเท่านั้น
   - แยกจาก GridLayout5Plus

3. **src/shared/components/media/GridLayout6.tsx**
   - สำหรับ 6 ภาพเท่านั้น
   - 2x3 grid, aspect-square

---

## 📋 Implementation Plan (Step by Step)

### Phase 1: เพิ่ม Types & Utils (30 นาที)

#### Step 1.1: แก้ไข types.ts
```typescript
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  width?: number;      // ✅ ใหม่
  height?: number;     // ✅ ใหม่
  duration?: number;   // ✅ ใหม่ (seconds)
}
```

#### Step 1.2: สร้าง mediaUtils.ts
```typescript
export type MediaOrientation = 'landscape' | 'portrait' | 'square';

export function getMediaOrientation(width?: number, height?: number): MediaOrientation {
  if (!width || !height) return 'landscape'; // default
  const ratio = width / height;
  if (ratio > 1.1) return 'landscape';
  if (ratio < 0.9) return 'portrait';
  return 'square';
}

export function getAspectRatioClass(orientation: MediaOrientation, type: 'image' | 'video'): string {
  // ... implementation
}

export function formatDuration(seconds: number): string {
  // ... implementation
}
```

#### Step 1.3: เพิ่ม constants ใน constants.ts
```typescript
ASPECT_RATIO: {
  SINGLE_IMAGE_MOBILE: 'aspect-square',       // ✅ เปลี่ยนจาก aspect-[4/5]
  SINGLE_IMAGE_DESKTOP: 'aspect-square',      // ✅ เปลี่ยนจาก aspect-[16/9]
  VIDEO_LANDSCAPE: 'aspect-video',            // 16:9
  VIDEO_PORTRAIT: 'aspect-[3/4]',             // 3:4
  VIDEO_SQUARE: 'aspect-square',              // 1:1
  IMAGE_LANDSCAPE: 'aspect-[4/3]',            // 4:3
  IMAGE_PORTRAIT: 'aspect-[4/5]',             // 4:5
  IMAGE_SQUARE: 'aspect-square',              // 1:1
  GRID_ITEM: 'aspect-square',                 // 1:1 (for all grid items)
}
```

---

### Phase 2: ปรับ Single Image/Video (30 นาที)

#### Step 2.1: แก้ไข SingleImageViewer.tsx
```tsx
// Option A: Fixed aspect-square (ง่ายที่สุด)
<div className="aspect-square">
  <img src={media.url} className="w-full h-full object-cover" />
</div>

// Option B: Dynamic ตาม metadata (ดีที่สุด)
const orientation = getMediaOrientation(media.width, media.height);
const aspectClass = getAspectRatioClass(orientation, 'image');
<div className={cn("w-full", aspectClass)}>
  <img src={media.url} className="w-full h-full object-cover" />
</div>
```

#### Step 2.2: แก้ไข SingleVideoPlayer.tsx
```tsx
const orientation = getMediaOrientation(media.width, media.height);
const aspectClass = getAspectRatioClass(orientation, 'video');

<div className={cn("w-full", aspectClass)}>
  <video src={media.url} controls className="w-full h-full bg-black" />
</div>
```

---

### Phase 3: ปรับ Grid Layouts (1 ชั่วโมง)

#### Step 3.1: แก้ไข GridLayout2.tsx
```tsx
// ลบ fixed height, ใช้ aspect-square แทน
<div className="grid grid-cols-2 gap-1">
  {media.slice(0, 2).map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} {...props} />
    </div>
  ))}
</div>
```

#### Step 3.2: แก้ไข GridLayout3.tsx
```tsx
// ใช้ aspect-square ทุกรูป
<div className="grid grid-cols-2 gap-1">
  <div className="row-span-2 aspect-square overflow-hidden rounded-lg bg-muted">
    <MediaItem media={media[0]} index={0} {...props} />
  </div>
  <div className="grid grid-rows-2 gap-1">
    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={media[1]} index={1} {...props} />
    </div>
    <div className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={media[2]} index={2} {...props} />
    </div>
  </div>
</div>
```

#### Step 3.3: แก้ไข GridLayout4.tsx
```tsx
// ใช้ aspect-square ทุกรูป
<div className="grid grid-cols-2 gap-1">
  {media.slice(0, 4).map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
      <MediaItem media={item} index={index} {...props} />
    </div>
  ))}
</div>
```

---

### Phase 4: สร้าง GridLayout5, GridLayout6 (1 ชั่วโมง)

#### Step 4.1: สร้าง GridLayout5.tsx (ใหม่)
```tsx
// Instagram-style mixed layout สำหรับ 5 ภาพเท่านั้น
export function GridLayout5({ media, ...props }: GridLayoutProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {/* Large top-left (2x2) */}
      <div className="col-span-2 row-span-2 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        <MediaItem media={media[0]} index={0} {...props} />
      </div>

      {/* Right side + bottom */}
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <MediaItem media={media[1]} index={1} {...props} />
      </div>
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <MediaItem media={media[2]} index={2} {...props} />
      </div>
      <div className="aspect-square overflow-hidden rounded-lg bg-muted">
        <MediaItem media={media[3]} index={3} {...props} />
      </div>
      <div className="col-span-2 aspect-[2/1] overflow-hidden rounded-lg bg-muted">
        <MediaItem media={media[4]} index={4} {...props} />
      </div>
    </div>
  );
}
```

#### Step 4.2: สร้าง GridLayout6.tsx (ใหม่)
```tsx
// 2x3 grid, aspect-square ทุกรูป
export function GridLayout6({ media, ...props }: GridLayoutProps) {
  return (
    <div className="grid grid-cols-3 gap-1">
      {media.slice(0, 6).map((item, index) => (
        <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted">
          <MediaItem media={item} index={index} {...props} />
        </div>
      ))}
    </div>
  );
}
```

---

### Phase 5: ปรับ GridLayout5Plus & MultiMediaGrid (30 นาที)

#### Step 5.1: แก้ไข GridLayout5Plus.tsx
```tsx
// สำหรับ 7+ ภาพ (แสดงสูงสุด 6 + overlay)
const displayMedia = media.slice(0, 6); // ✅ เปลี่ยนจาก 5 → 6
const remainingCount = Math.max(0, media.length - 6);

<div className="grid grid-cols-3 gap-1">
  {displayMedia.map((item, index) => (
    <div key={item.id} className="aspect-square overflow-hidden rounded-lg bg-muted relative">
      <MediaItem
        media={item}
        index={index}
        showOverlay={index === 5 && remainingCount > 0}
        remainingCount={remainingCount}
        {...props}
      />
    </div>
  ))}
</div>
```

#### Step 5.2: แก้ไข MultiMediaGrid.tsx
```tsx
// เพิ่ม case 5 และ 6
const LayoutComponent = useMemo(() => {
  switch (media.length) {
    case 2: return GridLayout2;
    case 3: return GridLayout3;
    case 4: return GridLayout4;
    case 5: return GridLayout5;        // ✅ ใหม่
    case 6: return GridLayout6;        // ✅ ใหม่
    default: return GridLayout5Plus;   // 7+ ภาพ
  }
}, [media.length]);
```

---

### Phase 6: Export & Update Index (10 นาที)

#### Step 6.1: แก้ไข index.ts
```typescript
export { GridLayout5 } from './GridLayout5';  // ✅ ใหม่
export { GridLayout6 } from './GridLayout6';  // ✅ ใหม่
```

---

## ⚠️ ข้อควรระวัง & Trade-offs

### 1. Virtual Scroll Performance
**ปัญหา:**
- เดิมใช้ fixed height 320px เพื่อ virtual scroll stability
- ถ้าเปลี่ยนเป็น aspect-square อาจทำให้ height ไม่คงที่ (ขึ้นกับ container width)

**แนวทางแก้:**
- **Option A:** ยังใช้ fixed height แต่เพิ่มเป็น 400-500px (ดูไม่แบนเกินไป)
- **Option B:** ใช้ aspect-square + set min/max-height
- **Option C:** ใช้ CSS `container-queries` (modern browsers)

**แนะนำ:** Option B
```tsx
<div className="aspect-square" style={{ minHeight: '300px', maxHeight: '600px' }}>
  <MediaItem ... />
</div>
```

---

### 2. Backend ต้อง Return width, height, duration

**ปัญหา:**
- ปัจจุบัน backend อาจไม่ return metadata ครบ

**แนวทางแก้:**
1. **Backend:** เพิ่ม field `width`, `height`, `duration` ใน API response
2. **Frontend:** ใช้ fallback ถ้าไม่มี metadata
```tsx
const orientation = getMediaOrientation(media.width, media.height);
// ถ้าไม่มี width/height → default เป็น 'landscape'
```

3. **Migration:** Video ที่มีอยู่แล้วอาจต้อง re-process เพื่อเพิ่ม metadata

---

### 3. Aspect Ratio ของ GridLayout5 อาจไม่สมดุล

**ปัญหา:**
- รูปที่ 1: aspect-[4/3] (large)
- รูปอื่น: aspect-square
- อาจดูไม่สมดุล

**แนวทางแก้:**
- **Option A:** ใช้ aspect-square ทุกรูป (simple, สมดุล)
- **Option B:** ใช้ mixed aspect (Instagram-style, สวยกว่าแต่ซับซ้อน)

**แนะนำ:** Option A (ง่ายกว่า, maintenance ง่าย)

---

### 4. Mobile: ความกว้างของ Grid อาจเล็กเกินไป

**ปัญหา:**
- 3 columns grid บน mobile → แต่ละรูปกว้างแค่ ~100px
- อาจเล็กเกินไป

**แนวทางแก้:**
```tsx
<div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
  {/* Mobile: 2 columns, Desktop: 3 columns */}
</div>
```

---

## 📊 Comparison: Before vs After

### Single Image

| | Before | After (Option A) | After (Option B) |
|---|--------|------------------|------------------|
| Mobile | aspect-[4/5] (800x1000) | aspect-square (800x800) | aspect-[4/5] (800x1000) |
| Desktop | aspect-[16/9] (1600x900) ❌ | aspect-square (1600x1600) ✅ | aspect-[4/5] (1600x2000) ✅ |
| Metadata | ไม่ต้องการ | ไม่ต้องการ | ต้องการ width, height |

**แนะนำ:** Option A (ง่ายที่สุด, ดูดีทั้ง mobile และ desktop)

---

### Single Video

| | Before | After |
|---|--------|-------|
| Landscape | aspect-video (16:9) ✅ | aspect-video (16:9) ✅ |
| Portrait | aspect-video (16:9) ❌ (letterbox) | aspect-[3/4] ✅ (full screen) |
| Square | aspect-video (16:9) ❌ | aspect-square ✅ |
| Metadata | ไม่ต้องการ | ต้องการ width, height |

**แนะนำ:** ใช้ After (ต้อง return width, height จาก backend)

---

### Multiple Images (Grid)

| จำนวน | Before | After |
|-------|--------|-------|
| 2 | Fixed height 320px | aspect-square (responsive) ✅ |
| 3 | Fixed height 320px | aspect-square (responsive) ✅ |
| 4 | Fixed height 320px | aspect-square (responsive) ✅ |
| 5 | แสดง 5 + แบน | แสดง 5 + aspect-square ✅ |
| 6 | แสดง 5 + overlay "+1" ❌ | แสดงครบ 6 ✅ |
| 7+ | แสดง 5 + overlay "+N" | แสดง 6 + overlay "+N" ✅ |

---

## ✅ Expected Results

### Desktop
- ✅ Single image: ไม่แบนเกินไป (aspect-square หรือ 4:5)
- ✅ Multiple images: ดูสมดุล (aspect-square ทุกรูป)
- ✅ Video portrait: เต็มจอ ไม่มี letterbox

### Mobile
- ✅ Single image: ดูดี (aspect-square หรือ 4:5)
- ✅ Multiple images: ดูสมดุล (aspect-square)
- ✅ Grid 6 รูป: 2 columns (ไม่เล็กเกินไป)

### General
- ✅ แสดง 6 รูป (ไม่ต้องใช้ overlay "+1")
- ✅ Video รู้ orientation (landscape/portrait/square)
- ✅ Consistent aspect ratios across all layouts

---

## 🚀 Next Steps

### Immediate (ทำได้เลย - ไม่ต้อง backend)
1. ✅ Phase 1: เพิ่ม types & utils
2. ✅ Phase 2: ปรับ Single Image ให้ใช้ aspect-square (fixed)
3. ✅ Phase 3: ปรับ Grid Layouts ให้ใช้ aspect-square
4. ✅ Phase 4: สร้าง GridLayout5, GridLayout6
5. ✅ Phase 5: ปรับ MultiMediaGrid

### Future (ต้องรอ backend)
1. ⏳ Backend: เพิ่ม `width`, `height`, `duration` ใน API
2. ⏳ Frontend: ใช้ dynamic aspect ratio ตาม metadata
3. ⏳ Migration: Re-process videos เพื่อเพิ่ม metadata

---

## 🎨 Design Mockups

### Desktop View (Before vs After)

**Before:**
```
Single Image (16:9 - แบนมาก)
┌────────────────────────────┐
│                            │
│         Image              │
│                            │
└────────────────────────────┘

2 Images (Fixed height 320px)
┌─────────────┬─────────────┐
│     1       │      2      │
│             │             │
└─────────────┴─────────────┘
```

**After:**
```
Single Image (1:1 - ดูดี)
┌──────────────┐
│              │
│              │
│    Image     │
│              │
│              │
└──────────────┘

2 Images (aspect-square)
┌──────┬──────┐
│      │      │
│  1   │  2   │
│      │      │
└──────┴──────┘
```

---

## 📝 Summary

### ความเป็นไปได้: ✅ **เป็นไปได้ทั้งหมด!**

### ข้อดี:
- ✅ Desktop ไม่แบนเกินไป (aspect-square)
- ✅ Mobile ดูดี (aspect-square หรือ 4:5)
- ✅ Video รู้ orientation (landscape/portrait/square)
- ✅ แสดงครบ 6 รูป (ไม่ต้องใช้ overlay "+1")
- ✅ Consistent aspect ratios
- ✅ Modular & maintainable

### ข้อเสีย:
- ⚠️ ต้อง return `width`, `height` จาก backend (สำหรับ dynamic aspect)
- ⚠️ Virtual scroll อาจต้องปรับ (ถ้าใช้ responsive aspect)
- ⚠️ Migration: videos เก่าอาจไม่มี metadata

### แนะนำ:
**เริ่มจาก Phase 1-5 ก่อน (ใช้ fixed aspect-square)**
→ ไม่ต้องรอ backend
→ ได้ผลลัพธ์ที่ดีทันที
→ Phase 6 (dynamic aspect) ค่อยทำทีหลังเมื่อ backend พร้อม

---

**คุณเห็นด้วยกับแผนนี้ไหมครับ? หรือต้องการปรับแต่งอะไรเพิ่มเติม?**
