# 📸 Media Display & Lightbox Refactoring Plan

## 🚨 ปัญหาปัจจุบัน

### 1. UX ไม่ดีในหน้า Feed (/)
- **ปัญหา**: Post ที่มี video เดียว ต้องคลิกเปิด lightbox ก่อน แล้วกด play อีกที (2 steps)
- **ควรเป็น**: คลิก play ได้เลยที่ feed (1 step) เหมือน Facebook, Instagram

### 2. Logic ซับซ้อนและ Duplicate Code
- `MediaGrid.tsx` มี MediaLightbox render ซ้ำ 6 ครั้ง (แต่ละ layout condition)
- Logic ใน `renderMediaItem()` ยาวและซับซ้อน
- Video type detection ซ้ำซ้อน (ใน PostCard และ MediaGrid)

### 3. ไม่มีการแยก Responsibility
- MediaGrid ทำหลายอย่างพร้อมกัน:
  - Render layout (1, 2, 3, 4, 5+ items)
  - Handle video/image rendering
  - Manage lightbox state
  - Handle editable mode

---

## 🎯 เป้าหมาย

### UX Goals
1. **Video ไม่ควรบังคับใช้ lightbox** - ควร play inline ได้เลย
2. **Image ควรใช้ lightbox** - สำหรับ zoom และดูรายละเอียด
3. **Multiple media ควรใช้ lightbox** - เพื่อดู carousel

### Technical Goals
1. แยก component ตาม media type และ count
2. ลด duplicate code
3. ทำให้ maintenance ง่ายขึ้น
4. Support editable mode สำหรับ upload preview

---

## 📊 UX Patterns จาก Major Platforms

### Facebook Feed Behavior

| Media Type | Feed Mode | Post Detail Mode |
|------------|-----------|------------------|
| Single Video | ▶️ Play inline พร้อม controls | ▶️ Play inline พร้อม controls |
| Single Image | 🖼️ Preview → คลิกเปิด lightbox | 🖼️ Full size → คลิกเปิด lightbox (zoom) |
| Multiple Media | 🔲 Grid preview → คลิกเปิด lightbox carousel | 🔲 Grid/Carousel → lightbox |

### Instagram Feed Behavior

| Media Type | Feed Mode | Post Detail Mode |
|------------|-----------|------------------|
| Single Video | ▶️ Play inline (tap to play/pause) | ▶️ Play inline |
| Single Image | 🖼️ Full width display | 🖼️ Full width display |
| Multiple Media | 🎞️ Carousel (swipe) + dots indicator | 🎞️ Carousel (swipe) |

**Note**: Instagram ไม่ใช้ lightbox แบบ popup - ใช้ carousel swipe แทน

### Twitter Feed Behavior

| Media Type | Feed Mode | Post Detail Mode |
|------------|-----------|------------------|
| Single Video | ▶️ Play inline พร้อม controls | ▶️ Play inline |
| Single Image | 🖼️ Preview → คลิกเปิด lightbox | 🖼️ Full size → คลิกเปิด lightbox |
| Multiple Media (2-4) | 🔲 Grid → คลิกเปิด lightbox | 🔲 Grid → lightbox |

---

## 💡 Recommended UX Strategy

### Feed Mode (หน้า / และ feed ทั่วไป)

```
┌─────────────────────────────────────────────┐
│  Media Count & Type    │  Behavior          │
├─────────────────────────────────────────────┤
│  1 Video               │  ▶️ Inline player  │
│                        │  - มี controls     │
│                        │  - ไม่มี lightbox  │
│                        │  - คลิก play ได้เลย│
├─────────────────────────────────────────────┤
│  1 Image               │  🖼️ Preview        │
│                        │  - คลิกเปิด lightbox│
│                        │  - สำหรับ zoom      │
├─────────────────────────────────────────────┤
│  2-4 Media             │  🔲 Grid layout    │
│  (mixed video/image)   │  - คลิกเปิด lightbox│
│                        │  - carousel view    │
├─────────────────────────────────────────────┤
│  5+ Media              │  🔲 Grid + overlay │
│                        │  - แสดง "+N" overlay│
│                        │  - คลิกเปิด lightbox│
└─────────────────────────────────────────────┘
```

### Detail Mode (หน้า post/[id])

```
┌─────────────────────────────────────────────┐
│  Media Count & Type    │  Behavior          │
├─────────────────────────────────────────────┤
│  1 Video               │  ▶️ Inline player  │
│                        │  - max-h-[800px]   │
│                        │  - มี controls     │
│                        │  - ไม่มี lightbox  │
├─────────────────────────────────────────────┤
│  1 Image               │  🖼️ Full display   │
│                        │  - max-h-[800px]   │
│                        │  - คลิกเปิด lightbox│
│                        │  - สำหรับ zoom 3x   │
├─────────────────────────────────────────────┤
│  2+ Media              │  🔲 Grid layout    │
│  (mixed)               │  - คลิกเปิด lightbox│
│                        │  - carousel view    │
└─────────────────────────────────────────────┘
```

**Key Principle**:
- ✅ Video = Always inline playable (ไม่ต้องเปิด lightbox)
- ✅ Image = Lightbox for zoom
- ✅ Multiple media = Lightbox carousel

---

## 🏗️ Proposed Component Architecture

### Current Structure (ปัญหา)

```
PostCard
  └── MediaGrid (ทำงานมากเกินไป)
      ├── renderMediaItem() (ซับซ้อน)
      ├── getGridClass() (layout logic)
      ├── Lightbox state (local state)
      └── MediaLightbox × 6 (duplicate)
```

### New Structure (แก้ไข)

```
PostCard
  └── MediaDisplay (Smart Component - ตัดสินใจ layout)
      ├── SingleVideoPlayer ─────────► HLSVideoPlayer
      │   ├── Video controls
      │   ├── No lightbox
      │   └── Responsive sizing
      │
      ├── SingleImageViewer
      │   ├── Image preview
      │   ├── Click → Open lightbox
      │   └── MediaLightbox (conditional)
      │
      └── MultiMediaGrid
          ├── GridLayout2
          ├── GridLayout3
          ├── GridLayout4
          └── GridLayout5Plus
          └── MediaLightbox (shared instance)
```

---

## 📁 Proposed File Structure

```
src/shared/components/media/
├── MediaDisplay.tsx          # 🎯 Smart component (main entry)
├── SingleVideoPlayer.tsx     # 🎬 Single video inline player
├── SingleImageViewer.tsx     # 🖼️ Single image with lightbox
├── MultiMediaGrid/
│   ├── index.tsx            # Main grid component
│   ├── GridLayout2.tsx      # 2 items layout
│   ├── GridLayout3.tsx      # 3 items layout (1 large + 2 small)
│   ├── GridLayout4.tsx      # 2x2 grid
│   └── GridLayout5Plus.tsx  # 5+ Instagram style
├── MediaLightbox.tsx         # 💡 Lightbox wrapper (unchanged)
├── MediaItem.tsx             # 🔲 Individual media item (reusable)
└── types.ts                  # TypeScript types
```

---

## 🎨 Component Design

### 1. MediaDisplay (Smart Component)

**Responsibility**:
- วิเคราะห์ media array
- เลือก component ที่เหมาะสม
- ส่ง props ต่อ

```typescript
interface MediaDisplayProps {
  media: MediaItem[];
  variant?: 'feed' | 'detail';
  editable?: boolean;
  onRemove?: (index: number) => void;
  className?: string;
}

export function MediaDisplay({ media, variant = 'feed', editable, ... }: MediaDisplayProps) {
  // 🧮 Calculate media composition
  const mediaStats = useMemo(() => ({
    total: media.length,
    videos: media.filter(m => m.type === 'video').length,
    images: media.filter(m => m.type === 'image').length,
    isSingleVideo: media.length === 1 && media[0].type === 'video',
    isSingleImage: media.length === 1 && media[0].type === 'image',
  }), [media]);

  // 🎯 Route to appropriate component
  if (mediaStats.isSingleVideo && !editable) {
    return <SingleVideoPlayer media={media[0]} variant={variant} />;
  }

  if (mediaStats.isSingleImage) {
    return <SingleImageViewer media={media[0]} variant={variant} />;
  }

  return <MultiMediaGrid media={media} variant={variant} editable={editable} onRemove={onRemove} />;
}
```

**Benefits**:
- ✅ Single responsibility - แค่ route ไป component ที่ถูกต้อง
- ✅ Easy to test
- ✅ Clear decision logic

---

### 2. SingleVideoPlayer

**Responsibility**: แสดง video เดียว พร้อม controls inline

```typescript
interface SingleVideoPlayerProps {
  media: MediaItem;
  variant: 'feed' | 'detail';
  className?: string;
}

export function SingleVideoPlayer({ media, variant, className }: SingleVideoPlayerProps) {
  const maxHeight = variant === 'detail' ? 'max-h-[800px]' : 'max-h-[600px]';

  return (
    <div className={cn("w-full bg-black rounded-lg overflow-hidden flex items-center justify-center", className)}>
      <video
        src={media.url}
        poster={media.thumbnail}
        controls // ✅ Always show controls
        preload="metadata"
        className={cn("rounded-lg max-w-full h-auto", maxHeight)}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
```

**Features**:
- ✅ No lightbox wrapper
- ✅ Direct video controls
- ✅ Responsive sizing
- ✅ Clean and simple

**Alternative**: ใช้ `HLSVideoPlayer` สำหรับ HLS streaming

---

### 3. SingleImageViewer

**Responsibility**: แสดง image เดียว พร้อม lightbox สำหรับ zoom

```typescript
interface SingleImageViewerProps {
  media: MediaItem;
  variant: 'feed' | 'detail';
  className?: string;
}

export function SingleImageViewer({ media, variant, className }: SingleImageViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const maxHeight = variant === 'detail' ? 'max-h-[800px]' : 'max-h-[600px]';

  return (
    <>
      <div
        className={cn("w-full rounded-lg overflow-hidden cursor-pointer hover:opacity-95 transition-opacity", className)}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={media.url}
          alt="Post image"
          className={cn("rounded-lg max-w-full h-auto object-contain", maxHeight)}
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

**Features**:
- ✅ Click to open lightbox
- ✅ Zoom support (3x)
- ✅ ESC to close
- ✅ Clean separation of concerns

---

### 4. MultiMediaGrid

**Responsibility**: แสดง multiple media ด้วย grid layout

```typescript
interface MultiMediaGridProps {
  media: MediaItem[];
  variant: 'feed' | 'detail';
  editable?: boolean;
  onRemove?: (index: number) => void;
  className?: string;
}

export function MultiMediaGrid({ media, variant, editable, onRemove, className }: MultiMediaGridProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleMediaClick = (index: number) => {
    if (!editable) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  // 🎨 Choose layout based on count
  const Layout = useMemo(() => {
    switch (media.length) {
      case 2: return GridLayout2;
      case 3: return GridLayout3;
      case 4: return GridLayout4;
      default: return GridLayout5Plus;
    }
  }, [media.length]);

  return (
    <>
      <Layout
        media={media}
        variant={variant}
        editable={editable}
        onMediaClick={handleMediaClick}
        onRemove={onRemove}
        className={className}
      />

      {/* 💡 Single lightbox instance */}
      {!editable && (
        <MediaLightbox
          media={media}
          open={lightboxOpen}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
```

**Benefits**:
- ✅ Single lightbox instance (ไม่ duplicate)
- ✅ Dynamic layout selection
- ✅ Shared logic for all grid layouts

---

### 5. GridLayout Components

**Example: GridLayout3.tsx**

```typescript
interface GridLayoutProps {
  media: MediaItem[];
  variant: 'feed' | 'detail';
  editable?: boolean;
  onMediaClick: (index: number) => void;
  onRemove?: (index: number) => void;
  className?: string;
}

export function GridLayout3({ media, editable, onMediaClick, onRemove, className }: GridLayoutProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {/* Large left image */}
      <MediaItem
        media={media[0]}
        index={0}
        className="row-span-2"
        editable={editable}
        onClick={onMediaClick}
        onRemove={onRemove}
      />

      {/* Right column: 2 stacked images */}
      <div className="grid grid-rows-2 gap-2">
        <MediaItem media={media[1]} index={1} editable={editable} onClick={onMediaClick} onRemove={onRemove} />
        <MediaItem media={media[2]} index={2} editable={editable} onClick={onMediaClick} onRemove={onRemove} />
      </div>
    </div>
  );
}
```

**Benefits**:
- ✅ Layout-specific logic isolated
- ✅ Reusable MediaItem component
- ✅ Easy to modify individual layouts

---

### 6. MediaItem (Reusable)

**Responsibility**: แสดง media item เดียวใน grid

```typescript
interface MediaItemProps {
  media: MediaItem;
  index: number;
  editable?: boolean;
  onClick: (index: number) => void;
  onRemove?: (index: number) => void;
  showOverlay?: boolean; // +N remaining
  className?: string;
}

export function MediaItem({ media, index, editable, onClick, onRemove, showOverlay, className }: MediaItemProps) {
  const isVideo = media.type === 'video';

  return (
    <div
      className={cn(
        "relative rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-all bg-muted aspect-square",
        !editable && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={() => !editable && onClick(index)}
    >
      {isVideo ? (
        <video
          src={media.url}
          poster={media.thumbnail}
          className="w-full h-full object-cover"
          muted
          preload="metadata"
        />
      ) : (
        <Image
          src={media.url}
          alt={`Media ${index + 1}`}
          fill
          className="object-cover"
        />
      )}

      {/* Video badge */}
      {isVideo && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 text-white text-xs rounded-md">
          Video
        </div>
      )}

      {/* Play icon overlay for video */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="h-12 w-12 text-white fill-white" />
        </div>
      )}

      {/* Remove button (editable mode) */}
      {editable && onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(index); }}
          className="absolute top-2 right-2 p-2 bg-black/70 text-white rounded-full opacity-0 group-hover:opacity-100"
        >
          <X size={18} />
        </button>
      )}

      {/* +N overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <span className="text-white text-5xl font-bold">+N</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🔄 Migration Strategy

### Phase 1: Create New Components (ไม่กระทบของเดิม)

**Tasks**:
1. ✅ สร้างโฟลเดอร์ `src/shared/components/media/` (ใหม่)
2. ✅ สร้าง `MediaDisplay.tsx`
3. ✅ สร้าง `SingleVideoPlayer.tsx`
4. ✅ สร้าง `SingleImageViewer.tsx`
5. ✅ สร้าง `MultiMediaGrid/index.tsx`
6. ✅ สร้าง layout components (GridLayout2-5Plus)
7. ✅ สร้าง `MediaItem.tsx`
8. ✅ Export ทั้งหมดใน `src/shared/components/media/index.ts`

**Testing**: Test แยกใน Storybook หรือ isolated page

---

### Phase 2: Update PostCard (Gradual Migration)

**Before**:
```typescript
<MediaGrid
  media={post.media}
  variant={disableNavigation ? 'detail' : 'feed'}
/>
```

**After**:
```typescript
<MediaDisplay
  media={post.media}
  variant={disableNavigation ? 'detail' : 'feed'}
/>
```

**Benefits**:
- ✅ API เหมือนเดิม (drop-in replacement)
- ✅ Backward compatible

---

### Phase 3: Deprecate Old MediaGrid (Optional)

**Tasks**:
1. ⚠️ Mark `MediaGrid.tsx` as deprecated
2. ✅ Update all imports to use `MediaDisplay`
3. ✅ Remove old `MediaGrid.tsx` after verification

---

## 📋 Implementation Checklist

### Core Components
- [ ] Create `MediaDisplay.tsx` (smart component)
- [ ] Create `SingleVideoPlayer.tsx` (inline video)
- [ ] Create `SingleImageViewer.tsx` (image + lightbox)
- [ ] Create `MultiMediaGrid/index.tsx` (grid wrapper)
- [ ] Create `GridLayout2.tsx`
- [ ] Create `GridLayout3.tsx`
- [ ] Create `GridLayout4.tsx`
- [ ] Create `GridLayout5Plus.tsx`
- [ ] Create `MediaItem.tsx` (reusable item)

### Integration
- [ ] Update `PostCard.tsx` to use `MediaDisplay`
- [ ] Test in feed mode (/)
- [ ] Test in detail mode (post/[id])
- [ ] Test editable mode (create-post)

### Testing
- [ ] Test single video playback
- [ ] Test single image lightbox
- [ ] Test multiple media lightbox
- [ ] Test responsive layouts
- [ ] Test keyboard navigation (ESC)

### Cleanup
- [ ] Remove old `MediaGrid.tsx`
- [ ] Update documentation
- [ ] Remove duplicate code

---

## 🎯 Expected Outcomes

### UX Improvements
✅ **Feed**: Video play ได้เลย (ไม่ต้องเปิด lightbox) - ลดจาก 2 clicks → 1 click
✅ **Detail**: Video ใหญ่ขึ้น (max-h-800px), มี controls สะดวก
✅ **Image**: Lightbox zoom ทำงานได้ดีขึ้น
✅ **Multiple**: Carousel navigation ชัดเจนขึ้น

### Code Quality
✅ **Separation of Concerns**: แต่ละ component มี responsibility ชัดเจน
✅ **Reusability**: MediaItem, layouts reusable
✅ **Maintainability**: แก้ layout แค่ 1 file (ไม่ต้องแก้หลายจุด)
✅ **Testability**: แต่ละ component test ได้อิสระ
✅ **No Duplication**: MediaLightbox render แค่ครั้งเดียว

### Performance
✅ **Lazy Loading**: Video/Image load on demand
✅ **Optimized Rendering**: ลด re-renders ที่ไม่จำเป็น
✅ **Bundle Size**: Split components → better code splitting

---

## 🚀 Next Steps

1. **Review & Approve** แนวทางนี้
2. **Start Implementation** (Phase 1)
3. **Test Thoroughly** ใน dev environment
4. **Gradual Rollout** (Phase 2)
5. **Monitor & Iterate** based on user feedback

---

## 📚 References

- Facebook Media Handling: [Inline video with controls](https://www.facebook.com)
- Instagram Media Patterns: [Carousel UI](https://www.instagram.com)
- Twitter Media Display: [Grid + Lightbox](https://twitter.com)
- yet-another-react-lightbox: [Documentation](https://yet-another-react-lightbox.com)
- Next.js Image Optimization: [Docs](https://nextjs.org/docs/app/building-your-application/optimizing/images)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-11
**Author**: Claude Code
**Status**: Proposed (รอ approval)
