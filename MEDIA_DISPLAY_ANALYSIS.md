# รายงานวิเคราะห์ระบบแสดงผลรูปภาพและวิดีโอ (Media Display System)

**วันที่วิเคราะห์:** 22 พฤศจิกายน 2568
**ผู้วิเคราะห์:** Claude Code
**เวอร์ชัน:** 1.0

---

## 📋 สารบัญ

1. [ภาพรวมระบบ](#ภาพรวมระบบ)
2. [สถาปัตยกรรม Components](#สถาปัตยกรรม-components)
3. [การแสดงผลแต่ละประเภท](#การแสดงผลแต่ละประเภท)
4. [การตั้งค่าและ Constants](#การตั้งค่าและ-constants)
5. [ปัญหาที่พบและข้อจำกัด](#ปัญหาที่พบและข้อจำกัด)
6. [คำแนะนำและแนวทางแก้ไข](#คำแนะนำและแนวทางแก้ไข)

---

## 🎯 ภาพรวมระบบ

ระบบแสดงผลรูปภาพและวิดีโอของโปรเจกต์นี้ออกแบบมาให้รองรับ:

- ✅ รูปภาพเดี่ยว (Single Image)
- ✅ วิดีโอเดี่ยว (Single Video)
- ✅ รูปภาพหลายภาพ (2-5+ ภาพ)
- ✅ วิดีโอผสมรูปภาพ (Mixed Media)
- ✅ Lightbox สำหรับ zoom และ carousel
- ✅ Responsive design (Mobile + Desktop)
- ✅ Virtual scroll optimization (Fixed height)

### สถาปัตยกรรมแบบ 2 Versions

ปัจจุบันระบบมี **2 versions** ทำงานควบคู่กัน:

#### **Version 1: MediaGrid (Legacy)**
- ไฟล์: `src/shared/components/media/MediaGrid.tsx`
- ใช้ใน: `CreatePostForm.tsx` (upload preview)
- ลักษณะ: All-in-one component ที่จัดการทั้ง layout และ rendering
- จำนวนบรรทัด: ~365 บรรทัด
- ⚠️ **มี logic ซับซ้อนอยู่ใน component เดียว**

#### **Version 2: MediaDisplay + GridLayouts (Modern)**
- ไฟล์หลัก: `src/shared/components/media/MediaDisplay.tsx`
- ใช้ใน: `PostCard.tsx`, `PostDetail.tsx`
- ลักษณะ: Modular architecture แยก component ตามหน้าที่
- ⚡ **Recommended สำหรับใช้งานใหม่**

---

## 🏗️ สถาปัตยกรรม Components

### Version 2: Modern Architecture (แนะนำ)

```
MediaDisplay.tsx (Smart Router)
├── SingleVideoPlayer.tsx        → 1 วิดีโอ (inline player)
├── SingleImageViewer.tsx        → 1 รูปภาพ (with lightbox)
└── MultiMediaGrid.tsx           → 2+ media items
    ├── GridLayout2.tsx          → 2 ภาพ (2 columns)
    ├── GridLayout3.tsx          → 3 ภาพ (1 large + 2 small)
    ├── GridLayout4.tsx          → 4 ภาพ (2x2 grid)
    └── GridLayout5Plus.tsx      → 5+ ภาพ (Instagram style)
        └── MediaItem.tsx        → Reusable media item
            └── MediaLightbox.tsx → Fullscreen viewer
```

### หน้าที่ของแต่ละ Component

| Component | หน้าที่ | Input | Output |
|-----------|---------|-------|--------|
| **MediaDisplay** | Smart router เลือก component ที่เหมาะสม | `media[]`, `variant`, `editable` | Rendered media |
| **SingleVideoPlayer** | แสดง video เดียวพร้อม controls | `media` (video) | `<video>` with controls |
| **SingleImageViewer** | แสดงรูปเดียวพร้อม lightbox | `media` (image) | `<img>` + lightbox |
| **MultiMediaGrid** | เลือก GridLayout ตามจำนวน media | `media[]` (2+) | Rendered grid |
| **GridLayout2** | Layout 2 ภาพ (2 columns) | `media[2]` | 2-column grid |
| **GridLayout3** | Layout 3 ภาพ (1 large + 2 small) | `media[3]` | Instagram-style grid |
| **GridLayout4** | Layout 4 ภาพ (2x2) | `media[4]` | 2x2 grid |
| **GridLayout5Plus** | Layout 5+ ภาพ (แสดงสูงสุด 5) | `media[5+]` | Mixed layout + overlay |
| **MediaItem** | Reusable media item | `media`, `index` | Single media item |
| **MediaLightbox** | Fullscreen viewer | `media[]`, `index` | Lightbox modal |

---

## 📐 การแสดงผลแต่ละประเภท

### 1. วิดีโอเดี่ยว (Single Video)

**Component:** `SingleVideoPlayer.tsx`

**Layout:**
```
┌─────────────────────────┐
│                         │
│    <video controls>     │
│     aspect-video        │
│      (16:9 ratio)       │
│                         │
└─────────────────────────┘
```

**คุณสมบัติ:**
- ✅ Native HTML5 video player
- ✅ Built-in controls (play, pause, volume, fullscreen)
- ✅ Aspect ratio: 16:9 (aspect-video)
- ✅ Max height: 600px (feed) / 800px (detail)
- ✅ Poster image support
- ✅ Preload: metadata
- ❌ **ไม่มี lightbox** (เล่นได้เลย inline)

**Code snippet:**
```tsx
// PostCard.tsx line 326
<MediaDisplay
  media={[{ id: '1', url: 'video.mp4', type: 'video' }]}
  variant="feed"
/>
```

---

### 2. รูปภาพเดี่ยว (Single Image)

**Component:** `SingleImageViewer.tsx`

**Layout:**
```
┌─────────────────────────┐
│                         │
│      <img>              │
│   aspect-[4/5] mobile   │
│   aspect-[16/9] desktop │
│                         │
│  (Click to open zoom)   │
└─────────────────────────┘
```

**คุณสมบัติ:**
- ✅ Responsive aspect ratio (4:5 mobile, 16:9 desktop)
- ✅ Max height: 600px (feed) / 800px (detail)
- ✅ Lightbox สำหรับ zoom (3x)
- ✅ Hover effect (opacity)
- ✅ Lazy loading
- ✅ Object-fit: cover

**Aspect Ratios:**
- Mobile: `aspect-[4/5]` (Instagram-style portrait)
- Desktop: `sm:aspect-[16/9]` (Landscape)

---

### 3. สองรูป (2 Images/Videos)

**Component:** `GridLayout2.tsx`

**Layout:**
```
┌───────────┬───────────┐
│           │           │
│     1     │     2     │
│           │           │
└───────────┴───────────┘
```

**คุณสมบัติ:**
- Grid: 2 columns (grid-cols-2)
- Fixed height: **320px**
- Gap: 1 (gap-1 = 4px)
- ✅ Side-by-side layout
- ✅ Equal width
- ✅ Lightbox carousel

**ไฟล์:** `src/shared/components/media/GridLayout2.tsx` (50 บรรทัด)

---

### 4. สามรูป (3 Images/Videos)

**Component:** `GridLayout3.tsx`

**Layout:**
```
┌─────────────┬─────┐
│             │  2  │
│      1      ├─────┤
│   (Large)   │  3  │
└─────────────┴─────┘
```

**คุณสมบัติ:**
- Grid: 2 columns (grid-cols-2)
- Left: Large image (row-span-2)
- Right: 2 stacked images (grid-rows-2)
- Fixed height: **320px**
- Gap: 1 (gap-1 = 4px)
- ✅ Instagram-style layout
- ✅ Lightbox carousel

**โครงสร้าง:**
```html
<div class="grid grid-cols-2 gap-1">
  <MediaItem media[0] className="row-span-2" />
  <div class="grid grid-rows-2 gap-1">
    <MediaItem media[1] />
    <MediaItem media[2] />
  </div>
</div>
```

**ไฟล์:** `src/shared/components/media/GridLayout3.tsx` (69 บรรทัด)

---

### 5. สี่รูป (4 Images/Videos)

**Component:** `GridLayout4.tsx`

**Layout:**
```
┌───────────┬───────────┐
│     1     │     2     │
├───────────┼───────────┤
│     3     │     4     │
└───────────┴───────────┘
```

**คุณสมบัติ:**
- Grid: 2x2 (grid-cols-2)
- Fixed height: **320px**
- Gap: 1 (gap-1 = 4px)
- ✅ Balanced layout
- ✅ Equal size items
- ✅ Lightbox carousel

**ไฟล์:** `src/shared/components/media/GridLayout4.tsx` (52 บรรทัด)

---

### 6. ห้ารูป (5 Images/Videos)

**Component:** `GridLayout5Plus.tsx`

**Layout:**
```
┌─────────────────┬─────┐
│                 │  2  │
│        1        ├─────┤
│     (Large)     │  3  │
├─────────┬───────┴─────┤
│    4    │      5      │
└─────────┴─────────────┘
```

**คุณสมบัติ:**
- Grid: 3 columns (grid-cols-3)
- Top-left: Large image (col-span-2 row-span-2)
- Right: 2 stacked images
- Bottom: 2 smaller images
- Fixed height: **320px**
- Gap: 1 (gap-1 = 4px)
- ✅ Instagram-style mixed layout
- ✅ Lightbox carousel

**ไฟล์:** `src/shared/components/media/GridLayout5Plus.tsx` (97 บรรทัด)

---

### 7. หกรูปขึ้นไป (6+ Images/Videos)

**Component:** `GridLayout5Plus.tsx` (เดียวกับ 5 รูป)

**Layout:**
```
┌─────────────────┬─────┐
│                 │  2  │
│        1        ├─────┤
│     (Large)     │  3  │
├─────────┬───────┴─────┤
│    4    │  5 (+N)     │
└─────────┴─────────────┘
       ↑
    Overlay "+N"
```

**คุณสมบัติ:**
- แสดงสูงสุด: **5 รูป**
- รูปที่ 5: แสดง overlay "+N" (N = จำนวนรูปที่เหลือ)
- เช่น 10 รูป → แสดง 5 รูป + overlay "+5"
- Fixed height: **320px**
- ✅ Lightbox แสดงทั้งหมด (ไม่จำกัด 5 รูป)
- ✅ Carousel navigation

**Overlay Design:**
```tsx
// GridLayout5Plus.tsx line 86-92
<MediaItem
  media={displayMedia[4]}
  index={4}
  showOverlay={remainingCount > 0}
  remainingCount={remainingCount}
/>
```

**การคำนวณรูปที่เหลือ:**
```tsx
const remainingCount = Math.max(0, media.length - 5);
// media.length = 10 → remainingCount = 5
// media.length = 6  → remainingCount = 1
// media.length = 5  → remainingCount = 0
```

---

## ⚙️ การตั้งค่าและ Constants

### ไฟล์ Config
`src/shared/config/constants.ts`

### 1. FORM_LIMITS.MEDIA

```typescript
MEDIA: {
  MAX_FILES: 20,                    // จำนวนไฟล์สูงสุดที่อัปโหลดได้
  MAX_SIZE_MB: 100,                 // ขนาดไฟล์สูงสุด (MB)
  MAX_SIZE_BYTES: 100 * 1024 * 1024,
  CONCURRENT_UPLOADS: 8,            // อัปโหลดพร้อมกัน 8 ไฟล์
  PREVIEW_MAX_DISPLAY: 5,           // แสดงสูงสุด 5 ไฟล์ใน grid
}
```

### 2. MEDIA_DISPLAY

#### Max Heights
```typescript
MAX_HEIGHT: {
  FEED: 800,              // Feed mode (PostCard)
  DETAIL: 1200,           // Detail mode (PostDetail)
  CROSSPOST: 320,         // Crosspost preview
  CROSSPOST_MEDIA: 192,   // Media in crosspost
}
```

#### Grid Settings
```typescript
GRID: {
  GAP: 2,                 // gap-2 (8px) - default
  GAP_COMPACT: 1,         // gap-1 (4px) - fixed-height layouts
  HEIGHT_FIXED: 320,      // Fixed height (px) - virtual scroll optimization
  PREVIEW_MAX_DISPLAY: 5, // แสดงสูงสุด 5 items
}
```

#### Aspect Ratios
```typescript
ASPECT_RATIO: {
  SINGLE_IMAGE_MOBILE: 'aspect-[4/5]',   // Instagram portrait
  SINGLE_IMAGE_DESKTOP: 'aspect-[16/9]', // Landscape
  VIDEO: 'aspect-video',                 // 16:9
  SQUARE: 'aspect-square',               // 1:1
}
```

#### Lightbox Settings
```typescript
LIGHTBOX: {
  MAX_ZOOM: 3,                // 3x zoom
  ANIMATION_DURATION: 250,    // ms
  ENABLE_INFINITE_LOOP: false,
}
```

#### Video Settings
```typescript
VIDEO: {
  PRELOAD: 'metadata',        // 'none' | 'metadata' | 'auto'
  CONTROLS: true,             // Show controls
  MUTED_IN_GRID: true,        // Mute in grid preview
  AUTO_PLAY: false,           // No autoplay
}
```

---

## 🐛 ปัญหาที่พบและข้อจำกัด

### 1. ⚠️ มี 2 Versions ของ MediaGrid

**ปัญหา:**
- `MediaGrid.tsx` (เก่า) ใช้ใน CreatePostForm
- `MediaDisplay.tsx` + GridLayouts (ใหม่) ใช้ใน PostCard, PostDetail
- **Code duplication** และ maintenance ยาก

**ตำแหน่ง:**
- Legacy: `src/shared/components/media/MediaGrid.tsx` (365 บรรทัด)
- Modern: `src/shared/components/media/MediaDisplay.tsx` (110 บรรทัด)

**ผลกระทบ:**
- ต้อง maintain 2 codebase
- Bug fix ต้องทำ 2 ที่
- Inconsistent behavior ระหว่าง upload preview และ post display

**แนวทางแก้ไข:**
```typescript
// ใน CreatePostForm.tsx line 16
// เปลี่ยนจาก:
import { MediaGrid } from "@/components/media/MediaGrid";

// เป็น:
import { MediaDisplay } from "@/components/media";
```

---

### 2. ⚠️ จำนวนรูปที่แสดงจำกัดที่ 5 ภาพ

**ปัญหา:**
- แสดงสูงสุด 5 ภาพ ส่วนที่เหลือแสดงเป็น "+N"
- ไม่เหมาะกับ Post ที่มีรูปเยอะ (เช่น 20 รูป)

**ตัวอย่าง:**
- 6 รูป → แสดง 5 รูป + overlay "+1"
- 10 รูป → แสดง 5 รูป + overlay "+5"
- 20 รูป → แสดง 5 รูป + overlay "+15"

**ตำแหน่ง:**
```typescript
// constants.ts line 122
PREVIEW_MAX_DISPLAY: 5,

// GridLayout5Plus.tsx line 34
const displayMedia = media.slice(0, MEDIA_DISPLAY.GRID.PREVIEW_MAX_DISPLAY);
```

**แนวทางแก้ไข:**

#### Option 1: เพิ่มจำนวนรูปที่แสดง
```typescript
// ปรับเป็น 9 หรือ 12
PREVIEW_MAX_DISPLAY: 9,
```
- ข้อดี: แสดงรูปได้มากขึ้น
- ข้อเสีย: Layout ซับซ้อนขึ้น, ต้องออกแบบ GridLayout6-9

#### Option 2: Scrollable Carousel
```typescript
// สร้าง ScrollableMediaGrid
<ScrollableMediaGrid media={media} />
```
- ข้อดี: แสดงได้ไม่จำกัด
- ข้อเสีย: ต้องสร้าง component ใหม่

#### Option 3: "Show More" Button
```typescript
// เพิ่มปุ่ม "ดูทั้งหมด" เมื่อคลิกจะเปิด Lightbox
<button onClick={() => openLightbox(0)}>
  ดูทั้งหมด {media.length} รูป
</button>
```
- ข้อดี: เรียบง่าย, UX ดี
- ข้อเสีย: ต้องมี Lightbox

---

### 3. ⚠️ Fixed Height อาจทำให้รูปบางภาพ crop มากเกินไป

**ปัญหา:**
- ทุก grid ใช้ fixed height = 320px
- รูปแนวตั้ง (portrait) จะถูก crop มาก
- รูปแนวนอน (landscape) อาจมี whitespace

**ตำแหน่ง:**
```typescript
// GridLayout2.tsx line 35
style={{ height: `${MEDIA_DISPLAY.GRID.HEIGHT_FIXED}px` }}
// ↓
style={{ height: '320px' }}
```

**ตัวอย่าง:**
```
รูปขนาด 1080x1920 (portrait)
↓
Grid height: 320px
↓
ถูก crop เหลือแค่ส่วนบน
```

**แนวทางแก้ไข:**

#### Option 1: Dynamic Height
```typescript
// คำนวณ height จาก aspect ratio เฉลี่ย
const avgAspectRatio = media.reduce((sum, m) => sum + m.width / m.height, 0) / media.length;
const height = Math.min(600, containerWidth / avgAspectRatio);
```
- ข้อดี: ไม่ crop
- ข้อเสีย: ต้องมี width/height metadata, virtual scroll ทำงานยาก

#### Option 2: Smart Crop (Object Position)
```typescript
// ปรับ object-position ตาม focal point
<Image
  src={media.url}
  style={{ objectPosition: media.focalPoint || 'center' }}
/>
```
- ข้อดี: Crop ที่จุดสำคัญ
- ข้อเสีย: ต้องมี focal point metadata

---

### 4. ⚠️ ไม่มี Layout สำหรับ 6, 7, 8, 9 รูป

**ปัญหา:**
- มีแค่ Layout 2, 3, 4, 5+
- 6-9 รูปจะใช้ Layout5Plus (แสดงแค่ 5 รูป)

**ตัวอย่าง:**
```
6 รูป → GridLayout5Plus (แสดง 5 + overlay "+1")
7 รูป → GridLayout5Plus (แสดง 5 + overlay "+2")
8 รูป → GridLayout5Plus (แสดง 5 + overlay "+3")
9 รูป → GridLayout5Plus (แสดง 5 + overlay "+4")
```

**แนวทางแก้ไข:**

#### สร้าง GridLayout6, 7, 8, 9

**GridLayout6 (2x3)**
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
└─────┴─────┴─────┘
```

**GridLayout9 (3x3)**
```
┌─────┬─────┬─────┐
│  1  │  2  │  3  │
├─────┼─────┼─────┤
│  4  │  5  │  6  │
├─────┼─────┼─────┤
│  7  │  8  │  9  │
└─────┴─────┴─────┘
```

**Code:**
```tsx
// MultiMediaGrid.tsx
const LayoutComponent = useMemo(() => {
  switch (media.length) {
    case 2: return GridLayout2;
    case 3: return GridLayout3;
    case 4: return GridLayout4;
    case 5: return GridLayout5;
    case 6: return GridLayout6;  // ใหม่
    case 7: return GridLayout7;  // ใหม่
    case 8: return GridLayout8;  // ใหม่
    case 9: return GridLayout9;  // ใหม่
    default: return GridLayout5Plus;
  }
}, [media.length]);
```

---

### 5. ⚠️ วิดีโอในโหมด Grid ไม่มี Duration/Progress Indicator

**ปัญหา:**
- Video thumbnail ไม่แสดงระยะเวลา (duration)
- ไม่มี progress bar สำหรับวิดีโอใน lightbox

**ตัวอย่าง:**
```
┌─────────────┐
│   [PLAY]    │  ← ไม่รู้ความยาวกี่นาที
│   Video     │
└─────────────┘
```

**แนวทางแก้ไข:**

#### เพิ่ม Duration Badge
```tsx
// MediaItem.tsx
{isVideo && (
  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded">
    {formatDuration(media.duration)}
  </div>
)}
```

**ข้อมูลที่ต้องเพิ่มใน Media type:**
```typescript
interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  duration?: number;  // ✅ ใหม่ (seconds)
  width?: number;     // ✅ ใหม่
  height?: number;    // ✅ ใหม่
}
```

---

### 6. ⚠️ Mobile: รูปภาพแนวตั้งอาจใหญ่เกินไป

**ปัญหา:**
- SingleImageViewer ใช้ aspect-[4/5] บน mobile
- รูปแนวตั้งจะสูงมาก → ต้อง scroll เยอะ

**ตัวอย่าง:**
```
Mobile screen height: 844px
Image aspect: 4/5
↓
Image height: ~1055px (เกินจอ)
```

**ตำแหน่ง:**
```tsx
// SingleImageViewer.tsx line 70
className={cn(
  "w-full",
  MEDIA_DISPLAY.ASPECT_RATIO.SINGLE_IMAGE_MOBILE,  // aspect-[4/5]
)}
```

**แนวทางแก้ไข:**

#### เพิ่ม max-height
```tsx
<div
  className={cn(
    "w-full",
    "aspect-[4/5]",
    "sm:aspect-[16/9]",
    "max-h-[80vh]"  // ✅ จำกัดความสูงไม่เกิน 80% ของหน้าจอ
  )}
>
```

---

### 7. ⚠️ Lightbox: ไม่มี Download Button

**ปัญหา:**
- User ไม่สามารถ download รูป/วิดีโอได้
- ต้อง right-click → save (ไม่สะดวก)

**แนวทางแก้ไข:**

#### เพิ่ม Download Plugin
```tsx
// MediaLightbox.tsx
import Download from "yet-another-react-lightbox/plugins/download";

<Lightbox
  plugins={[Video, Zoom, Download]}  // ✅ เพิ่ม Download
/>
```

---

## 💡 คำแนะนำและแนวทางแก้ไข

### Priority 1: รวม MediaGrid เป็น MediaDisplay

**เหตุผล:**
- ลด code duplication
- Consistent behavior
- ง่ายต่อ maintenance

**Action Items:**
1. ✅ แก้ไข `CreatePostForm.tsx` ให้ใช้ `MediaDisplay` แทน `MediaGrid`
2. ✅ ลบ `MediaGrid.tsx` (legacy)
3. ✅ Test upload preview ว่าทำงานปกติ

**Code Change:**
```tsx
// CreatePostForm.tsx line 875-883
// เปลี่ยนจาก:
<MediaGrid
  media={optimisticMediaFiles.map((m, index) => ({
    id: `preview-${index}`,
    url: m.preview,
    type: m.file.type.startsWith('video/') ? 'video' : 'image',
  }))}
  maxDisplay={FORM_LIMITS.MEDIA.PREVIEW_MAX_DISPLAY}
  onRemove={handleRemoveMedia}
  editable
/>

// เป็น:
<MediaDisplay
  media={optimisticMediaFiles.map((m, index) => ({
    id: `preview-${index}`,
    url: m.preview,
    type: m.file.type.startsWith('video/') ? 'video' : 'image',
  }))}
  editable
  onRemove={handleRemoveMedia}
/>
```

---

### Priority 2: สร้าง GridLayout สำหรับ 6-9 รูป

**เหตุผล:**
- แสดงรูปได้มากขึ้น
- ไม่ต้องพึ่ง overlay "+N"
- UX ดีขึ้น

**Action Items:**
1. สร้าง `GridLayout6.tsx` (2x3 grid)
2. สร้าง `GridLayout7.tsx` (mixed layout)
3. สร้าง `GridLayout8.tsx` (2x4 grid)
4. สร้าง `GridLayout9.tsx` (3x3 grid)
5. แก้ไข `MultiMediaGrid.tsx` ให้เลือก layout ตามจำนวน

**GridLayout6 Template:**
```tsx
// GridLayout6.tsx
export function GridLayout6({ media, ...props }: GridLayoutProps) {
  return (
    <div
      className="grid grid-cols-3 gap-1 overflow-hidden"
      style={{ height: '320px' }}
    >
      {media.slice(0, 6).map((item, index) => (
        <MediaItem key={item.id} media={item} index={index} {...props} />
      ))}
    </div>
  );
}
```

---

### Priority 3: เพิ่ม Video Duration Indicator

**เหตุผล:**
- User ต้องรู้ความยาววิดีโอก่อนคลิก
- Standard feature ใน YouTube, Instagram

**Action Items:**
1. เพิ่ม `duration` field ใน `MediaItem` type
2. Backend ต้อง return duration metadata
3. แสดง duration badge ใน `MediaItem.tsx`
4. Format เป็น "MM:SS" หรือ "HH:MM:SS"

**Code:**
```tsx
// types.ts
export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  duration?: number;  // ✅ seconds
}

// MediaItem.tsx
{isVideo && media.duration && (
  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 text-white text-xs rounded font-mono">
    {formatDuration(media.duration)}
  </div>
)}

// utils.ts
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

---

### Priority 4: ปรับ Single Image ให้เหมาะกับ Mobile

**เหตุผล:**
- รูปแนวตั้งสูงเกินไปบน mobile
- ต้อง scroll มาก

**Action Items:**
```tsx
// SingleImageViewer.tsx
<div
  className={cn(
    "w-full",
    "aspect-[4/5]",
    "sm:aspect-[16/9]",
    "max-h-[80vh]"  // ✅ จำกัดความสูง
  )}
>
```

---

### Priority 5: เพิ่ม Download Button ใน Lightbox

**Action Items:**
```bash
# Install download plugin
npm install yet-another-react-lightbox
```

```tsx
// MediaLightbox.tsx
import Download from "yet-another-react-lightbox/plugins/download";

<Lightbox
  plugins={[Video, Zoom, Download]}
  download={{
    download: async ({ slide }) => {
      // Custom download logic
      window.open(slide.src, '_blank');
    },
  }}
/>
```

---

## 📊 สรุปการแสดงผลแต่ละแบบ

| จำนวน Media | Component | Layout | Fixed Height | Max Display |
|-------------|-----------|--------|--------------|-------------|
| 1 video | SingleVideoPlayer | Full width, aspect-video | ❌ (max 600/800px) | 1 |
| 1 image | SingleImageViewer | Full width, responsive aspect | ❌ (max 600/800px) | 1 |
| 2 items | GridLayout2 | 2 columns | ✅ 320px | 2 |
| 3 items | GridLayout3 | 1 large + 2 small | ✅ 320px | 3 |
| 4 items | GridLayout4 | 2x2 grid | ✅ 320px | 4 |
| 5 items | GridLayout5Plus | Mixed layout | ✅ 320px | 5 |
| 6+ items | GridLayout5Plus | Mixed layout + overlay | ✅ 320px | 5 (แสดง +N) |

---

## 🎨 Design Patterns

### 1. Smart Component Pattern
`MediaDisplay` เป็น "router" ที่เลือก component ที่เหมาะสม:
```tsx
if (single video) → SingleVideoPlayer
if (single image) → SingleImageViewer
if (multiple) → MultiMediaGrid
```

### 2. Fixed Height for Virtual Scroll
ทุก grid ใช้ `height: 320px` เพื่อ:
- ✅ Predictable height (Virtual scroll ทำงานได้)
- ✅ Consistent layout
- ✅ ไม่ reflow เมื่อโหลด

### 3. Responsive Aspect Ratios
```tsx
// Mobile: Portrait (4:5)
className="aspect-[4/5]"

// Desktop: Landscape (16:9)
className="sm:aspect-[16/9]"
```

### 4. Lightbox Integration
- Single image: Lightbox for zoom
- Single video: **No lightbox** (play inline)
- Multiple: Lightbox carousel

---

## 📁 ไฟล์ที่เกี่ยวข้อง

### Core Components (Modern)
```
src/shared/components/media/
├── MediaDisplay.tsx          (110 บรรทัด) - Smart router
├── SingleVideoPlayer.tsx     (62 บรรทัด)  - Single video
├── SingleImageViewer.tsx     (95 บรรทัด)  - Single image
├── MultiMediaGrid.tsx        (94 บรรทัด)  - Multiple media router
├── GridLayout2.tsx           (50 บรรทัด)  - 2 items
├── GridLayout3.tsx           (69 บรรทัด)  - 3 items
├── GridLayout4.tsx           (52 บรรทัด)  - 4 items
├── GridLayout5Plus.tsx       (97 บรรทัด)  - 5+ items
├── MediaItem.tsx             (122 บรรทัด) - Reusable item
├── MediaLightbox.tsx         (98 บรรทัด)  - Fullscreen viewer
├── types.ts                  (42 บรรทัด)  - TypeScript types
└── index.ts                  - Exports
```

### Legacy Component (ควรลบ)
```
src/shared/components/media/
└── MediaGrid.tsx             (365 บรรทัด) - ⚠️ Legacy, ใช้ใน CreatePostForm
```

### Config
```
src/shared/config/
└── constants.ts              (162 บรรทัด) - MEDIA_DISPLAY, FORM_LIMITS
```

### Usage
```
src/features/posts/components/
├── PostCard.tsx              - ใช้ MediaDisplay (ใหม่)
├── PostDetail.tsx            - ใช้ MediaDisplay (ใหม่)
└── CreatePostForm.tsx        - ใช้ MediaGrid (เก่า) ⚠️ ควรแก้
```

---

## 🚀 Next Steps

### Immediate (ภายใน 1 สัปดาห์)
- [ ] แก้ไข CreatePostForm ให้ใช้ MediaDisplay
- [ ] ลบ MediaGrid.tsx (legacy)
- [ ] Test ทุก use case

### Short-term (ภายใน 1 เดือน)
- [ ] สร้าง GridLayout6-9
- [ ] เพิ่ม video duration indicator
- [ ] เพิ่ม download button ใน lightbox
- [ ] ปรับ single image max-height บน mobile

### Long-term (ภายใน 3 เดือน)
- [ ] Implement scrollable carousel สำหรับ 10+ รูป
- [ ] เพิ่ม image optimization (lazy load, blur placeholder)
- [ ] เพิ่ม video preload strategy
- [ ] Performance optimization (virtual scroll, intersection observer)

---

## 📝 บันทึกการเปลี่ยนแปลง

### v1.0 (22 พ.ย. 2568)
- ✅ วิเคราะห์สถาปัตยกรรมปัจจุบัน
- ✅ ระบุปัญหาและข้อจำกัด
- ✅ เสนอแนวทางแก้ไข
- ✅ สร้างเอกสารวิเคราะห์ครบถ้วน

---

**หมายเหตุ:** เอกสารนี้สร้างโดย Claude Code โดยวิเคราะห์จาก codebase จริง ณ วันที่ 22 พฤศจิกายน 2568
