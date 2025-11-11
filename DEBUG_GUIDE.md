# 🔍 Debug Mode Guide

## การใช้งาน Debug Logger

### 1. เปิด Debug Mode (ใน Browser Console)

```javascript
// เปิด debug mode
debugMode.enable()

// Reload หน้าเว็บ
location.reload()
```

### 2. ปิด Debug Mode

```javascript
debugMode.disable()
```

### 3. เปิดเฉพาะ Category ที่ต้องการ

```javascript
// เปิดเฉพาะ upload และ render logs
debugMode.setCategories(['upload', 'render'])

// Reload หน้าเว็บ
location.reload()
```

### 4. ดู Status

```javascript
debugMode.status()
// Output:
// Debug Mode: ✅ Enabled
// Categories: upload,render
```

---

## Debug Categories

| Category | คำอธิบาย |
|----------|---------|
| `upload` | ติดตามการ upload files |
| `render` | ติดตาม component re-renders |
| `api` | ติดตาม API calls |
| `state` | ติดตาม state changes |
| `performance` | วัดประสิทธิภาพ |

---

## การใช้ใน Component

### ✅ ติดตาม Render Count

```typescript
import { useRenderCount } from '@/shared/hooks/useRenderCount';

function MyComponent(props) {
  // แสดง log ว่า component นี้ render กี่ครั้ง
  useRenderCount('MyComponent', props);

  return <div>...</div>
}
```

**Output (เมื่อเปิด debug mode):**
```
[14:30:15] [RENDER] MyComponent rendered #1
[14:30:16] [RENDER] MyComponent rendered #2
[14:30:16] [RENDER] MyComponent props changed: ['userId', 'posts']
```

---

### ✅ ดูว่า Props ไหนเปลี่ยนทำให้ Re-render

```typescript
import { useWhyDidYouUpdate } from '@/shared/hooks/useRenderCount';

function PostCard(props) {
  // แสดงรายละเอียดว่า props ไหนเปลี่ยน
  useWhyDidYouUpdate('PostCard', props);

  return <div>...</div>
}
```

**Output (เมื่อเปิด debug mode):**
```
📦 PostCard - Props Changed
  [RENDER] Changed props: {
    votes: { from: 10, to: 11 },
    userVote: { from: null, to: 'up' }
  }
```

---

### ✅ Custom Debug Log

```typescript
import { logger, DEBUG_CATEGORIES } from '@/shared/lib/utils/logger';

function handleUpload(files: File[]) {
  logger.debug(DEBUG_CATEGORIES.UPLOAD, 'Starting upload', {
    fileCount: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0)
  });

  // ... upload logic ...

  logger.debug(DEBUG_CATEGORIES.UPLOAD, 'Upload completed');
}
```

**Output (เมื่อเปิด debug mode + category 'upload'):**
```
[14:30:20] [UPLOAD] Starting upload { fileCount: 5, totalSize: 10485760 }
[14:30:25] [UPLOAD] Upload completed
```

---

### ✅ วัดประสิทธิภาพ (Performance)

```typescript
import { logger } from '@/shared/lib/utils/logger';

function processData(data) {
  logger.time('processData');

  // ... expensive operation ...

  logger.timeEnd('processData');
}
```

**Output:**
```
⏱️ processData: 245.32ms
```

---

## React DevTools Profiler

### วิธีใช้:

1. เปิด **React DevTools** (F12 → Components tab)
2. กด **Profiler tab**
3. กด **Record** (วงกลมสีแดง)
4. ทำ action ที่ต้องการ test (เช่น upload ไฟล์)
5. กด **Stop**
6. ดูว่า component ไหน render บ่อย และใช้เวลานานแค่ไหน

**สิ่งที่ดูใน Profiler:**
- 🔴 **Flame Graph**: component ไหนใช้เวลา render นานที่สุด
- 📊 **Ranked Chart**: component ไหน render บ่อยที่สุด
- ⚡ **Component Timing**: แต่ละ component ใช้เวลา render เท่าไร

---

## ตัวอย่างการ Debug Re-render Problem

### ปัญหา: PostCard render ซ้ำเยอะ

```typescript
// ✅ เพิ่ม debug hooks
function PostCard({ post, onVote, onComment }) {
  useRenderCount('PostCard');
  useWhyDidYouUpdate('PostCard', { post, onVote, onComment });

  return <div>...</div>
}
```

**Console Output:**
```
[RENDER] PostCard rendered #15
[RENDER] PostCard props changed: ['onVote']
```

**สาเหตุ:** `onVote` callback ถูกสร้างใหม่ทุกครั้ง!

**วิธีแก้:**
```typescript
// ❌ ก่อนแก้
function ParentComponent() {
  return <PostCard onVote={(id) => handleVote(id)} />  // สร้าง function ใหม่ทุกครั้ง!
}

// ✅ หลังแก้
function ParentComponent() {
  const handleVote = useCallback((id) => {
    // ...
  }, []); // ไม่สร้างใหม่ถ้า deps ไม่เปลี่ยน

  return <PostCard onVote={handleVote} />
}
```

---

## Best Practices

### ✅ DO:
- เปิด debug mode **เฉพาะตอน development**
- ใช้ **category** เพื่อ filter logs ที่ต้องการ
- ใช้ `useRenderCount` เพื่อหา component ที่ render บ่อย
- ใช้ React DevTools Profiler เพื่อวัดประสิทธิภาพ

### ❌ DON'T:
- **อย่า** เปิด debug mode ใน production
- **อย่า** log ข้อมูล sensitive (password, token, etc.)
- **อย่า** log ใน loop ที่วนเยอะ (เช่น array.map)
- **อย่า** ลืมปิด debug mode หลังใช้งาน

---

## Performance Monitoring Tools

### 1. **React DevTools Profiler**
- ✅ Free
- ✅ Built-in with React DevTools
- ✅ ดูได้ว่า component ไหนช้า

### 2. **Chrome DevTools Performance**
- Press **F12** → **Performance** tab
- Record → ทำ action → Stop
- ดู **Flame Graph** ว่าใช้เวลาตรงไหนเยอะ

### 3. **Next.js Speed Insights**
```bash
npm install @vercel/analytics
```

---

## FAQ

### Q: Debug mode ปิดอัตโนมัติเมื่อไร?
**A:** ไม่ปิดอัตโนมัติ ต้องเรียก `debugMode.disable()` เอง หรือลบ localStorage

### Q: Debug logs มีผลต่อ performance ไหม?
**A:** มีนิดหน่อยถ้าเปิดทิ้งไว้ แต่ไม่มากเพราะมี condition check ก่อน log

### Q: Production มี debug logs ไหม?
**A:** **ไม่มี!** Logger จะไม่ทำงานเลยถ้า `NODE_ENV !== 'development'`

---

## Quick Commands

```javascript
// เปิด debug ทุกอย่าง
debugMode.enable(); location.reload();

// เปิดเฉพาะ upload logs
debugMode.setCategories(['upload']); location.reload();

// ดู status
debugMode.status();

// ปิด debug
debugMode.disable();
```
