# POC: Mobile Media Viewer Comparison

วันที่: 14 พฤศจิกายน 2568

---

## 🎯 วัตถุประสงค์

สร้าง Proof of Concept (POC) **4 แบบ** เพื่อเปรียบเทียบ:
- **Performance** (ลื่นไหล, 60fps)
- **Gesture** (swipe left/right, swipe down)
- **Video support** (เล่น video ได้ไหม, กระตุกไหม)
- **User Experience** (รู้สึกเหมือน Facebook/Instagram ไหม)

---

## 📦 POC ที่จะสร้าง

### POC #1: Native Scroll + Framer Motion (Hybrid)
**Technology**: CSS `overflow-x-scroll` + Framer Motion `drag="y"`
- **Horizontal**: Native scroll (momentum built-in)
- **Vertical**: Framer Motion (swipe down to dismiss)
- **Video**: Lazy load with Intersection Observer

**Pros**:
- ✅ ลื่นที่สุด (browser optimized)
- ✅ รองรับ video ดีมาก
- ✅ ไม่ต้อง library หนัก

**Cons**:
- ⚠️ Swipe down ต้องจัดการ conflict กับ scroll

---

### POC #2: Framer Motion Drag (Pure)
**Technology**: Framer Motion `drag="x"` + `drag="y"`
- **Horizontal**: `motion.div` with `drag="x"`
- **Vertical**: `motion.div` with `drag="y"`
- **Physics**: Built-in momentum

**Pros**:
- ✅ Gesture handling ง่ายมาก
- ✅ Animation smooth
- ✅ Vertical/horizontal แยกชัดเจน

**Cons**:
- ⚠️ Performance กับ video อาจไม่ดีเท่า native
- ⚠️ ต้องคำนวณ constraints เอง

---

### POC #3: Embla Carousel (dragFree mode)
**Technology**: `embla-carousel-react` with `dragFree: true`
- **Carousel**: Embla with free scroll
- **Dismiss**: Framer Motion (or custom touch events)

**Pros**:
- ✅ เบามาก (6KB)
- ✅ Momentum physics ดี
- ✅ Plugin system

**Cons**:
- ⚠️ ต้อง install dependency
- ⚠️ Swipe down ต้องทำเอง

---

### POC #4: Swiper.js
**Technology**: `swiper/react`
- **Carousel**: Swiper with freeMode
- **Dismiss**: Custom vertical gesture

**Pros**:
- ✅ ฟีเจอร์เยอะมาก
- ✅ ใช้กันเยอะ, documentation ดี
- ✅ มี virtual slides (performance)

**Cons**:
- ⚠️ ขนาดใหญ่ (~140KB)
- ⚠️ Overkill สำหรับ use case นี้

---

## 📁 File Structure

```
app/
└── poc-media-viewer/
    └── page.tsx          (หน้าเลือก POC + Demo)

src/poc/
├── data/
│   └── sampleMedia.ts    (Mock data: รูป + วิดีโอ)
├── components/
│   ├── POC1_NativeScroll.tsx
│   ├── POC2_FramerMotion.tsx
│   ├── POC3_Embla.tsx
│   ├── POC4_Swiper.tsx
│   └── MediaCard.tsx     (แสดงรูป/วิดีโอในหน้า demo)
└── types.ts
```

---

## 🎨 UI Design

### หน้า Demo (`/poc-media-viewer`)

```
┌─────────────────────────────────────┐
│  POC: Mobile Media Viewer           │
├─────────────────────────────────────┤
│                                     │
│  เลือก POC ที่ต้องการทดสอบ:        │
│                                     │
│  [POC #1: Native Scroll]            │
│  [POC #2: Framer Motion]            │
│  [POC #3: Embla Carousel]           │
│  [POC #4: Swiper.js]                │
│                                     │
│  ───────────────────────────────── │
│                                     │
│  Sample Media (คลิกเพื่อเปิด):      │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │ 📷 │ │ 🎬 │ │ 📷 │ │ 📷 │       │
│  └────┘ └────┘ └────┘ └────┘       │
│                                     │
│  ความแตกต่างของแต่ละ POC:          │
│  • Performance                      │
│  • Smoothness                       │
│  • Video support                    │
│  • Gesture handling                 │
└─────────────────────────────────────┘
```

---

## 📊 Sample Data

### Media Items (5 items: 3 รูป + 2 วิดีโอ)

```typescript
export const sampleMedia = [
  {
    id: '1',
    type: 'image',
    url: 'https://picsum.photos/1080/1920?random=1',
    thumbnail: 'https://picsum.photos/200/300?random=1',
  },
  {
    id: '2',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  },
  {
    id: '3',
    type: 'image',
    url: 'https://picsum.photos/1080/1920?random=2',
    thumbnail: 'https://picsum.photos/200/300?random=2',
  },
  {
    id: '4',
    type: 'video',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
  },
  {
    id: '5',
    type: 'image',
    url: 'https://picsum.photos/1080/1920?random=3',
    thumbnail: 'https://picsum.photos/200/300?random=3',
  },
];
```

**หมายเหตุ**: ใช้ free sample videos จาก Google (Big Buck Bunny, Elephant's Dream) เพื่อทดสอบ video performance

---

## 🧪 Testing Criteria

### การทดสอบแต่ละ POC:

#### 1. **Smoothness (60fps)**
- [ ] เลื่อน (swipe) ลื่นไหม?
- [ ] มี jank/stutter ไหม?
- [ ] Momentum physics เป็นธรรมชาติไหม?

#### 2. **Gesture Handling**
- [ ] Swipe left/right ทำงานได้ไหม?
- [ ] Swipe down to dismiss ทำงานได้ไหม?
- [ ] มี conflict gesture ไหม? (เช่น swipe ทั้ง x และ y พร้อมกัน)

#### 3. **Video Performance**
- [ ] วิดีโอเล่นได้ไหม?
- [ ] กระตุกตอนเลื่อนไหม?
- [ ] Pause เมื่อเลื่อนออกไปไหม?
- [ ] โหลดเร็วไหม?

#### 4. **User Experience**
- [ ] รู้สึกเหมือน native app ไหม?
- [ ] การตอบสนองเร็วไหม?
- [ ] Page indicator อ่านง่ายไหม?
- [ ] ปุ่มปิดกดง่ายไหม?

#### 5. **Mobile Performance**
- [ ] ทดสอบบน iPhone
- [ ] ทดสอบบน Android
- [ ] ทดสอบ landscape mode
- [ ] ทดสอบเน็ตช้า

---

## 📝 Implementation Checklist

### Phase 1: Setup (30 นาที)
- [x] สร้างโครงสร้างไฟล์
- [ ] เตรียม sample data
- [ ] สร้างหน้า demo หลัก
- [ ] ติดตั้ง dependencies ที่จำเป็น

### Phase 2: POC #1 - Native Scroll (30 นาที)
- [ ] สร้าง component
- [ ] Implement horizontal scroll
- [ ] Implement swipe down (Framer Motion)
- [ ] Lazy load video
- [ ] Page indicator

### Phase 3: POC #2 - Framer Motion (30 นาที)
- [ ] สร้าง component
- [ ] Implement drag="x"
- [ ] Implement drag="y"
- [ ] Handle constraints
- [ ] Page tracking

### Phase 4: POC #3 - Embla (30 นาที)
- [ ] ติดตั้ง embla-carousel-react
- [ ] สร้าง component
- [ ] Configure dragFree mode
- [ ] Implement dismiss gesture
- [ ] Page indicator

### Phase 5: POC #4 - Swiper (30 นาที)
- [ ] ติดตั้ง swiper
- [ ] สร้าง component
- [ ] Configure freeMode
- [ ] Virtual slides
- [ ] Custom dismiss

### Phase 6: UI Polish (30 นาที)
- [ ] Styling ทุก POC ให้เหมือนกัน
- [ ] เพิ่ม comparison table
- [ ] เพิ่ม instructions
- [ ] Mobile responsive

---

## 🎯 Expected Timeline

**Total: ~3 ชั่วโมง**

| Phase | Time | Description |
|-------|------|-------------|
| Setup | 30m | โครงสร้าง + sample data |
| POC 1 | 30m | Native Scroll |
| POC 2 | 30m | Framer Motion |
| POC 3 | 30m | Embla |
| POC 4 | 30m | Swiper |
| Polish | 30m | UI + comparison |

---

## 🚀 Deployment

### Development
```bash
npm run dev
# เปิด http://localhost:3000/poc-media-viewer
```

### Testing on Mobile
```bash
# ใช้ network URL
http://[your-ip]:3000/poc-media-viewer

# หรือใช้ ngrok/localtunnel
npx localtunnel --port 3000
```

---

## 📊 Comparison Matrix (จะกรอกหลังทดสอบ)

| Criteria | POC #1 | POC #2 | POC #3 | POC #4 |
|----------|--------|--------|--------|--------|
| **Smoothness** | ? | ? | ? | ? |
| **Video Performance** | ? | ? | ? | ? |
| **Gesture** | ? | ? | ? | ? |
| **Code Complexity** | ? | ? | ? | ? |
| **Bundle Size** | ? | ? | ? | ? |
| **Overall** | ? | ? | ? | ? |

---

## 💡 Notes

### Dependencies ที่ต้องติดตั้ง:
```bash
# POC #3: Embla
npm install embla-carousel-react

# POC #4: Swiper
npm install swiper

# Framer Motion (ถ้ายังไม่มี)
npm install framer-motion
```

### Alternative Video Sources (ถ้า Google blocked):
```typescript
// ใช้ Lorem Picsum + placeholder video
'https://www.w3schools.com/html/mov_bbb.mp4'
'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4'
```

---

## ✅ Success Criteria

POC ถือว่าสำเร็จเมื่อ:
- ✅ ทุก POC สามารถเปิดได้และทำงานได้
- ✅ สามารถเปรียบเทียบ performance ได้ชัดเจน
- ✅ ทดสอบบน mobile จริงได้
- ✅ มี sample data ทั้งรูปและวิดีโอ
- ✅ ทุก POC มี UI เหมือนกัน (เพื่อเปรียบเทียบ)

---

**พร้อมเริ่มสร้าง POC แล้วครับ!** 🚀
