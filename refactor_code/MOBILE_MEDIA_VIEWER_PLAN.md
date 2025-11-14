# แผนการพัฒนา Mobile Media Viewer (Facebook-style)

วันที่: 14 พฤศจิกายน 2568

---

## 🎯 เป้าหมาย

ปรับปรุง Media Viewer ให้:
- **Mobile**: ใช้ Full-screen Carousel (เหมือน Facebook Mobile)
- **Desktop**: ใช้ Lightbox แบบเดิม (yet-another-react-lightbox)

---

## 📊 การวิเคราะห์ระบบปัจจุบัน

### ✅ Components ที่มีอยู่

1. **MediaDisplay.tsx** (Smart Component)
   - ตัดสินใจว่าจะใช้ component ไหน
   - Logic: Single video → SingleVideoPlayer
   - Logic: Single image → SingleImageViewer
   - Logic: Multiple media → MultiMediaGrid

2. **MediaLightbox.tsx**
   - ใช้ `yet-another-react-lightbox`
   - รองรับ image + video
   - มี zoom, carousel, keyboard nav

3. **SingleImageViewer.tsx**
   - แสดงรูปเดียว
   - คลิกเปิด lightbox

4. **MultiMediaGrid.tsx**
   - แสดง grid layout (2, 3, 4, 5+ items)
   - คลิกเปิด lightbox carousel

### ⚠️ ปัญหาปัจจุบัน

1. **ไม่แยก Desktop/Mobile**
   - ใช้ lightbox เหมือนกันทั้ง desktop และ mobile
   - Mobile ไม่ได้ native-like gesture (swipe down to close)

2. **UX บน Mobile ไม่ดีเท่าที่ควร**
   - ไม่มี swipe down to dismiss
   - ไม่มี full-screen takeover
   - ไม่มี page indicator ที่ชัดเจน

3. **Lightbox ไม่เหมาะกับ Mobile**
   - มี backdrop overlay (มืดๆ)
   - ไม่รู้สึก native
   - Gesture ไม่เหนียวเหมือน app

---

## 🎨 ออกแบบ Solution ใหม่

### Architecture ใหม่

```
MediaDisplay (Smart Component)
├── Desktop Detection
│   ├── SingleImageViewer → MediaLightbox (เดิม)
│   └── MultiMediaGrid → MediaLightbox (เดิม)
│
└── Mobile Detection
    ├── SingleImageViewer → MobileMediaViewer (ใหม่)
    └── MultiMediaGrid → MobileMediaViewer (ใหม่)
```

### Component ใหม่ที่ต้องสร้าง

#### 1. **MobileMediaViewer.tsx** (Main Component)
```tsx
Features:
- Full-screen (position: fixed, inset: 0)
- Horizontal carousel (swipe left/right)
- Swipe down to dismiss
- Top bar (close button, page indicator)
- Bottom bar (caption - optional)
- Pinch to zoom
- Smooth transitions
```

#### 2. **useMediaDetection.tsx** (Hook)
```tsx
export function useMediaDetection() {
  return {
    isMobile: boolean,
    isDesktop: boolean,
    isTouchDevice: boolean,
  }
}
```

---

## 📦 Library Selection

### ตัวเลือก Carousel Libraries:

| Library | ขนาด | Pros | Cons | คะแนน |
|---------|------|------|------|-------|
| **embla-carousel-react** | ~6KB | เบา, gesture ดี, autoplay | ต้อง config เยอะ | ⭐⭐⭐⭐⭐ |
| **swiper** | ~140KB | ฟีเจอร์เยอะ, ใช้กันเยอะ | หนัก, overkill | ⭐⭐⭐ |
| **keen-slider** | ~5KB | เบามาก, smooth | ฟีเจอร์น้อย | ⭐⭐⭐⭐ |
| **react-responsive-carousel** | ~25KB | ใช้ง่าย | ไม่ค่อย maintain | ⭐⭐ |

### 🏆 คำแนะนำ: **Embla Carousel**

**เหตุผล**:
- ✅ เบามาก (6KB gzipped)
- ✅ Gesture-based (native-like)
- ✅ TypeScript support ดี
- ✅ Autoplay, loop, drag
- ✅ Plugin system (zoom, autoplay)
- ✅ Performance สูง (GPU-accelerated)
- ✅ Accessibility support

**ติดตั้ง**:
```bash
npm install embla-carousel-react
npm install embla-carousel-autoplay (optional)
```

---

## 🛠️ แผนการทำงาน (Step-by-Step)

### Phase 1: Setup & Foundation (30 นาที)

#### ✅ Step 1.1: ติดตั้ง Dependencies
```bash
npm install embla-carousel-react
```

#### ✅ Step 1.2: สร้าง Hook สำหรับ detect device
**File**: `src/shared/hooks/useMediaDetection.ts`
```tsx
export function useMediaDetection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
}
```

---

### Phase 2: Mobile Media Viewer Component (1 ชั่วโมง)

#### ✅ Step 2.1: สร้าง Base Component
**File**: `src/shared/components/media/MobileMediaViewer.tsx`

**Features**:
- Full-screen layout
- Close button (top right)
- Page indicator (top center) "1 / 5"
- Embla carousel integration

**Layout**:
```tsx
<div className="fixed inset-0 z-50 bg-black">
  {/* Top Bar */}
  <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4">
    <div className="text-white text-sm">{currentIndex + 1} / {total}</div>
    <button onClick={onClose}>✕</button>
  </div>

  {/* Carousel */}
  <div className="h-full flex items-center">
    <EmblaCarousel>
      {media.map((item) => (
        <MediaSlide item={item} />
      ))}
    </EmblaCarousel>
  </div>
</div>
```

#### ✅ Step 2.2: สร้าง Media Slide Component
**File**: `src/shared/components/media/MobileMediaSlide.tsx`

**Features**:
- แสดงรูป (responsive, contain)
- แสดงวิดีโอ (HTML5 player)
- Pinch to zoom (สำหรับรูป)

#### ✅ Step 2.3: เพิ่ม Swipe Down to Dismiss
**ใช้**: `framer-motion` (ถ้ามีอยู่แล้ว) หรือ custom gesture handler

```tsx
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={0.7}
  onDragEnd={(e, info) => {
    if (info.offset.y > 100) {
      onClose();
    }
  }}
>
  {/* Content */}
</motion.div>
```

**หมายเหตุ**: ถ้าไม่มี framer-motion ให้ใช้ native touch events แทน

---

### Phase 3: Integration (30 นาที)

#### ✅ Step 3.1: ปรับ MediaDisplay.tsx
**File**: `src/shared/components/media/MediaDisplay.tsx`

```tsx
import { useMediaDetection } from '@/hooks/useMediaDetection';
import { MobileMediaViewer } from './MobileMediaViewer';

export function MediaDisplay({ media, variant, ... }) {
  const { isMobile } = useMediaDetection();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // ถ้าเป็น mobile และมีหลายรูป/รูปเดียว → ใช้ MobileMediaViewer
  if (isMobile) {
    return (
      <>
        <GridOrSingleImage onClick={() => setViewerOpen(true)} />

        <MobileMediaViewer
          media={media}
          open={viewerOpen}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  // Desktop → ใช้ lightbox เดิม
  return <OriginalBehavior />;
}
```

#### ✅ Step 3.2: ปรับ SingleImageViewer.tsx
**เพิ่ม**: รองรับ mobile viewer

```tsx
export function SingleImageViewer({ media, variant }) {
  const { isMobile } = useMediaDetection();
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <img onClick={() => setViewerOpen(true)} />

      {isMobile ? (
        <MobileMediaViewer
          media={[media]}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      ) : (
        <MediaLightbox
          media={[media]}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
```

#### ✅ Step 3.3: ปรับ MultiMediaGrid.tsx
**เพิ่ม**: รองรับ mobile viewer

```tsx
export function MultiMediaGrid({ media }) {
  const { isMobile } = useMediaDetection();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const handleMediaClick = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <GridLayout onClick={handleMediaClick} />

      {isMobile ? (
        <MobileMediaViewer
          media={media}
          open={viewerOpen}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      ) : (
        <MediaLightbox
          media={media}
          open={viewerOpen}
          index={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
```

---

### Phase 4: Styling & UX Polish (30 นาที)

#### ✅ Step 4.1: ปรับ Transitions
- Fade in/out animation
- Slide animation เมื่อเปลี่ยนรูป
- Smooth swipe down dismiss

#### ✅ Step 4.2: เพิ่ม Page Indicator
- จุดเล็กๆ (dots) หรือ "1 / 5"
- แสดงตรงกลางบน หรือ ล่างตรงกลาง

#### ✅ Step 4.3: เพิ่ม Loading State
- Skeleton loader ระหว่างโหลดรูป
- Spinner สำหรับวิดีโอ

#### ✅ Step 4.4: Test Gestures
- Swipe left/right (เปลี่ยนรูป)
- Swipe down (ปิด)
- Pinch to zoom (รูป)
- Tap to toggle controls

---

### Phase 5: Testing & Edge Cases (30 นาที)

#### ✅ Step 5.1: Test บน Mobile จริง
- iOS Safari
- Chrome Android
- Edge cases: rotate device, slow network

#### ✅ Step 5.2: Test บน Desktop
- ตรวจสอบว่า lightbox เดิมยังใช้งานได้
- Responsive breakpoint (768px)

#### ✅ Step 5.3: Test Edge Cases
- รูปเดียว
- หลายรูป (2, 3, 4, 5+)
- วิดีโอเดียว
- ผสมรูป + วิดีโอ
- รูปขนาดใหญ่มาก
- เน็ตช้า

---

## 📁 File Structure ใหม่

```
src/shared/components/media/
├── MediaDisplay.tsx (ปรับ - เพิ่ม mobile detection)
├── SingleImageViewer.tsx (ปรับ - เพิ่ม mobile viewer)
├── MultiMediaGrid.tsx (ปรับ - เพิ่ม mobile viewer)
├── MediaLightbox.tsx (เดิม - ใช้ต่อสำหรับ desktop)
├── MobileMediaViewer.tsx (ใหม่)
├── MobileMediaSlide.tsx (ใหม่)
└── types.ts (เพิ่ม types ใหม่)

src/shared/hooks/
└── useMediaDetection.ts (ใหม่)
```

---

## 🎨 UI/UX Specifications

### Mobile Media Viewer

#### Layout
```
┌─────────────────────────┐
│ [1/5]         [✕]       │ ← Top Bar (h-14, bg-gradient fade)
├─────────────────────────┤
│                         │
│                         │
│    [  รูป/วิดีโอ  ]     │ ← Carousel (swipeable)
│                         │
│                         │
├─────────────────────────┤
│  ● ○ ○ ○ ○              │ ← Page Dots (optional)
└─────────────────────────┘
```

#### Colors
- Background: `bg-black` (solid black)
- Text: `text-white`
- Close button: `text-white hover:text-gray-300`
- Page indicator: `text-white/80`

#### Animations
- Open: Fade in (200ms)
- Close: Fade out (200ms)
- Slide change: Transform X (300ms ease-out)
- Swipe dismiss: Spring animation

#### Gestures
- **Swipe Left**: ถัดไป
- **Swipe Right**: ก่อนหน้า
- **Swipe Down >100px**: ปิด
- **Pinch**: Zoom (รูปเท่านั้น)
- **Double Tap**: Zoom in/out

---

## 🔧 Technical Considerations

### Performance
- ✅ Lazy load รูปที่ยังไม่ถึง
- ✅ Preload รูปถัดไป (n+1, n-1)
- ✅ Use `loading="lazy"` for images
- ✅ Optimize video poster images

### Accessibility
- ✅ Keyboard support (desktop fallback)
  - Arrow keys: Navigate
  - ESC: Close
- ✅ Focus management (trap focus in viewer)
- ✅ ARIA labels
- ✅ Screen reader support

### Browser Support
- ✅ iOS Safari 13+
- ✅ Chrome Android 90+
- ✅ Modern browsers (CSS touch-action)

### Edge Cases
- ✅ Single image: ซ่อน navigation arrows
- ✅ Video autoplay: ไม่ autoplay (ให้ user กด)
- ✅ Large images: ใช้ object-contain
- ✅ Network error: แสดง placeholder/retry

---

## ⚙️ Configuration Options

### Props for MobileMediaViewer

```typescript
interface MobileMediaViewerProps {
  media: MediaItem[];              // รายการ media
  open: boolean;                   // เปิด/ปิด viewer
  initialIndex?: number;           // เริ่มที่รูปไหน (default: 0)
  onClose: () => void;             // Callback เมื่อปิด

  // Optional
  showPageIndicator?: boolean;     // แสดง "1/5" (default: true)
  showDots?: boolean;              // แสดง dots (default: false)
  enableZoom?: boolean;            // เปิด pinch zoom (default: true)
  swipeThreshold?: number;         // px to dismiss (default: 100)
  autoPlay?: boolean;              // auto slide (default: false)
  autoPlayInterval?: number;       // ms (default: 3000)
}
```

---

## 🧪 Testing Checklist

### Functional Tests
- [ ] เปิด viewer จากรูปเดียว
- [ ] เปิด viewer จาก grid หลายรูป
- [ ] Swipe left/right เปลี่ยนรูป
- [ ] Swipe down ปิด viewer
- [ ] ปุ่มปิดทำงาน
- [ ] Page indicator แสดงถูกต้อง
- [ ] รูปแสดงเต็มหน้าจอ (contain)
- [ ] วิดีโอเล่นได้
- [ ] Pinch to zoom ทำงาน (รูป)

### Visual Tests
- [ ] Transition นุ่มนวล
- [ ] ไม่มี layout shift
- [ ] Page indicator อ่านง่าย
- [ ] ปุ่มปิดเห็นชัด
- [ ] รูปไม่บิดเบี้ยว (aspect ratio)

### Responsive Tests
- [ ] iPhone (375px)
- [ ] iPhone Plus (414px)
- [ ] Android (360px)
- [ ] Tablet (768px)
- [ ] Landscape mode

### Performance Tests
- [ ] เปิดเร็ว (<200ms)
- [ ] Swipe smooth (60fps)
- [ ] No memory leaks
- [ ] Lazy load ทำงาน

---

## 📊 Expected Outcome

### Before (ปัจจุบัน)
- Mobile ใช้ lightbox แบบเดิม (มี backdrop)
- ไม่มี swipe down to dismiss
- UX ไม่ native-like

### After (หลังทำเสร็จ)
- ✅ Mobile ใช้ full-screen carousel (เหมือน Facebook)
- ✅ Swipe down to dismiss
- ✅ Native-like gesture
- ✅ Page indicator ชัดเจน
- ✅ Performance ดีขึ้น (เบากว่า lightbox)
- ✅ Desktop ยังใช้ lightbox เดิม (ไม่เปลี่ยน)

---

## 🚀 Deployment Plan

### Step 1: Development
1. ติดตั้ง dependencies
2. สร้าง components ตามแผน
3. Integration กับระบบเดิม

### Step 2: Testing
1. Test local (dev server)
2. Test mobile (device emulator)
3. Test จริงบน mobile device

### Step 3: Review & Polish
1. Code review
2. UX testing
3. Performance check

### Step 4: Deploy
1. Merge to main branch
2. Build production
3. Deploy to staging
4. Test production
5. Deploy to production

---

## ⏱️ Timeline Estimate

| Phase | Tasks | Time | Cumulative |
|-------|-------|------|------------|
| Phase 1 | Setup & Foundation | 30 min | 30 min |
| Phase 2 | Mobile Viewer Component | 60 min | 1h 30m |
| Phase 3 | Integration | 30 min | 2h |
| Phase 4 | Styling & Polish | 30 min | 2h 30m |
| Phase 5 | Testing | 30 min | **3h total** |

**Total Estimated Time**: **3 ชั่วโมง**

---

## 🎯 Success Criteria

### Must Have (MVP)
- ✅ Mobile แสดง full-screen carousel
- ✅ Swipe left/right เปลี่ยนรูป
- ✅ Swipe down ปิด viewer
- ✅ ปุ่มปิดทำงาน
- ✅ Page indicator
- ✅ Desktop ยังใช้ lightbox เดิม

### Should Have
- ✅ Pinch to zoom (รูป)
- ✅ Smooth animations
- ✅ Loading states
- ✅ Video support

### Nice to Have
- ⭐ Dots indicator
- ⭐ Auto-play (carousel)
- ⭐ Share button
- ⭐ Download button

---

## 🤔 Alternatives Considered

### Option 1: ใช้ Swiper.js
- **Pros**: ฟีเจอร์เยอะ, ใช้กันเยอะ
- **Cons**: ขนาดใหญ่ (140KB), overkill
- **Decision**: ❌ ไม่เลือก

### Option 2: ใช้ Embla Carousel
- **Pros**: เบา (6KB), gesture ดี, performance สูง
- **Cons**: ต้อง config เยอะหน่อย
- **Decision**: ✅ เลือกใช้

### Option 3: Custom Implementation
- **Pros**: ควบคุมได้เต็มที่, ไม่มี dependency
- **Cons**: ใช้เวลานาน, ต้องจัดการ gesture เอง
- **Decision**: ❌ ไม่เลือก

### Option 4: ปรับ yet-another-react-lightbox
- **Pros**: ใช้ library เดิม, ไม่ต้อง install ใหม่
- **Cons**: ไม่ยืดหยุ่นพอ, ไม่มี swipe down
- **Decision**: ❌ ไม่เลือก

---

## 📝 Notes & Considerations

### Framer Motion Dependency
- ตรวจสอบว่ามี `framer-motion` อยู่แล้วหรือไม่
- ถ้ามี → ใช้สำหรับ swipe down gesture
- ถ้าไม่มี → ใช้ native touch events แทน

### Video Handling
- วิดีโอใน carousel ไม่ควร autoplay
- ให้ user กดเล่นเอง
- แสดง poster/thumbnail ก่อน

### Image Optimization
- ใช้ Next.js Image component (ถ้าเป็นไปได้)
- Lazy load รูปที่ยังไม่เปิดดู
- Preload รูปถัดไป (n+1)

### Accessibility
- ควรมี keyboard fallback บน desktop
- ARIA labels สำหรับ screen readers
- Focus trap ใน viewer

---

## ✅ Approval Checklist

ก่อนเริ่มทำ กรุณา review และ approve:

- [ ] เห็นด้วยกับ architecture ที่เสนอ
- [ ] เห็นด้วยกับการใช้ Embla Carousel
- [ ] เห็นด้วยกับ file structure ใหม่
- [ ] เห็นด้วยกับ timeline (3 ชั่วโมง)
- [ ] เห็นด้วยกับ success criteria
- [ ] มี feedback/ข้อกังวลอื่นๆ หรือไม่?

---

## 🚦 Next Steps

หลังจาก approve แผนนี้แล้ว:

1. ✅ ยืนยันว่าต้องการดำเนินการต่อ
2. ✅ เริ่ม Phase 1: Setup & Foundation
3. ✅ ติดตาม progress ผ่าน TodoWrite tool
4. ✅ Update ทุก phase ที่ทำเสร็จ

---

**พร้อมเริ่มทำเลยไหมครับ?** หรือมีส่วนไหนที่ต้องการให้ปรับเปลี่ยน/อธิบายเพิ่มเติมครับ? 🚀
