# 📁 Chat Refactor Documentation

> **เอกสารสำหรับ Refactor ระบบ Chat เป็น Virtual Scrolling**

---

## 📚 เอกสารทั้งหมด

### 1. [CHAT_REFACTOR_PLAN.md](./CHAT_REFACTOR_PLAN.md)
**แผนหลักสำหรับการ Refactor**

เนื้อหา:
- Executive Summary
- ปัญหาที่ต้องแก้
- Solution Overview (react-window)
- Design Principles (รักษา UX/UI)
- POC Phase (3 วัน)
- Implementation Phases (12 วัน)
- Testing Strategy
- Rollback Plan
- Success Metrics

**ใช้เมื่อ:** ต้องการเข้าใจภาพรวมของการ refactor

---

### 2. [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
**Checklist ละเอียดสำหรับติดตาม Progress**

เนื้อหา:
- Phase 0: Preparation
- Phase 1: POC (Day 1-3)
  - Day 1: Basic Virtual List
  - Day 2: Jump to Message
  - Day 3: Load More & Performance
- Phase 2: Implementation (Day 4-8)
- Phase 3: Testing (Day 9-12)
- Phase 4: Deployment (Day 13-15)
- Post-deployment Monitoring

**ใช้เมื่อ:** กำลังทำ implementation และต้องการ track progress

---

### 3. [BEFORE_AFTER_COMPARISON.md](./BEFORE_AFTER_COMPARISON.md)
**เปรียบเทียบระบบเดิมกับระบบใหม่**

เนื้อหา:
- Code Comparison (side-by-side)
- Performance Comparison (metrics)
- Visual Comparison (UI/UX)
- Behavior Comparison
- Bundle Size Impact
- Testing Effort
- Migration Effort
- ROI Analysis

**ใช้เมื่อ:** ต้องการเห็นภาพชัดเจนว่าอะไรเปลี่ยน/ไม่เปลี่ยน

---

## 🚀 Quick Start Guide

### Prerequisites

```bash
# ตรวจสอบ Node.js version
node --version  # ควรเป็น v18+

# ตรวจสอบ npm version
npm --version

# ตรวจสอบว่าอยู่ใน project root
pwd
# ควรเห็น: .../nextjs-frontend
```

### Step 1: เตรียมการ

```bash
# 1. Backup ระบบปัจจุบัน
git tag before-virtual-scrolling
git push origin before-virtual-scrolling

# 2. สร้าง feature branch
git checkout -b feature/virtual-scrolling

# 3. ติดตั้ง dependencies
npm install react-window
npm install --save-dev @types/react-window

# 4. สร้างโฟลเดอร์สำหรับ POC
mkdir -p src/features/chat/components/poc
```

### Step 2: เริ่ม POC (Day 1)

```bash
# สร้างไฟล์ POC
touch src/features/chat/components/poc/VirtualMessageListPOC.tsx

# เปิดไฟล์และ copy code จาก CHAT_REFACTOR_PLAN.md
# (ดู section "POC Phase - Day 1")

# Run dev server
npm run dev

# เปิด browser ไปที่ POC page (ต้องสร้าง route ก่อน)
# http://localhost:3000/poc/virtual-list
```

### Step 3: Testing

```bash
# ทดสอบ performance
# 1. เปิด Chrome DevTools
# 2. ไปที่ Performance tab
# 3. Record และ scroll
# 4. ดู FPS (ควรเป็น 60)

# ทดสอบ memory
# 1. เปิด Chrome Task Manager (Shift+Esc)
# 2. ดู Memory footprint
# 3. เปรียบเทียบกับระบบเดิม
```

---

## 📊 Timeline Overview

```
Week 1: POC
├─ Day 1: Basic Virtual List ✓
├─ Day 2: Jump to Message ✓
└─ Day 3: Load More + Decision ✓

Week 2: Implementation (if GO)
├─ Day 4-5: VirtualMessageList
├─ Day 6: MessageRow Helper
└─ Day 7-8: ChatWindow Integration

Week 3: Testing & Deploy
├─ Day 9-10: Testing
├─ Day 11-12: Bug fixes
└─ Day 13-15: Deployment
```

---

## 🎯 Success Criteria

### Must Achieve (100%)

- [ ] Scroll 60 FPS (with 1,000+ messages)
- [ ] Memory <10 MB (with 1,000 messages)
- [ ] UI/UX 100% identical
- [ ] Jump to message >95% success
- [ ] Zero regressions
- [ ] All tests passing

### Nice to Have

- [ ] Bundle size <10 KB increase
- [ ] Initial render <500ms
- [ ] User satisfaction >8/10
- [ ] Test coverage >90%

---

## 🔧 Development Workflow

### 1. Before You Start

```bash
# Pull latest changes
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/virtual-scrolling

# Verify dependencies
npm install
```

### 2. During Development

```bash
# Run dev server
npm run dev

# Run tests (in another terminal)
npm run test:watch

# Check TypeScript
npm run type-check

# Lint
npm run lint
```

### 3. Before Committing

```bash
# Run all checks
npm run test
npm run type-check
npm run lint

# Commit
git add .
git commit -m "feat: implement virtual scrolling POC"

# Push
git push origin feature/virtual-scrolling
```

---

## 🧪 Testing Commands

### Unit Tests

```bash
# Run all tests
npm run test

# Run specific test
npm run test VirtualMessageList

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Performance Tests

```bash
# Manual performance test
npm run dev
# Then use Chrome DevTools Performance tab

# Automated (if setup)
npm run test:performance
```

### Visual Regression Tests

```bash
# Build Storybook
npm run storybook:build

# Run Percy (if setup)
npx percy storybook
```

---

## 📦 Project Structure

```
src/features/chat/
├── components/
│   ├── ChatWindow.tsx (WILL CHANGE)
│   ├── ChatMessage.tsx (NO CHANGE)
│   ├── ChatInput.tsx (NO CHANGE)
│   ├── ChatHeader.tsx (NO CHANGE)
│   ├── VirtualMessageList.tsx (NEW)
│   └── poc/
│       └── VirtualMessageListPOC.tsx (POC ONLY)
├── stores/
│   └── chat/ (NO CHANGE)
└── services/
    └── chat.service.ts (NO CHANGE)

refactor_code/
├── README.md (this file)
├── CHAT_REFACTOR_PLAN.md
├── IMPLEMENTATION_CHECKLIST.md
└── BEFORE_AFTER_COMPARISON.md
```

---

## 🐛 Common Issues & Solutions

### Issue 1: react-window TypeScript errors

**Problem:**
```
Type 'VariableSizeList' is not assignable...
```

**Solution:**
```bash
npm install --save-dev @types/react-window
```

### Issue 2: Height calculation off

**Problem:** Scroll position เยื้อง

**Solution:**
```typescript
// Measure real height
useEffect(() => {
  if (rowRef.current) {
    const height = rowRef.current.getBoundingClientRect().height;
    onHeightChange(index, height);
  }
}, [message, index]);
```

### Issue 3: Load more triggered multiple times

**Problem:** Duplicate API calls

**Solution:**
```typescript
// Add guard flag
if (isLoadingRef.current) return;
isLoadingRef.current = true;

try {
  await loadMore();
} finally {
  isLoadingRef.current = false;
}
```

---

## 📖 Reference Links

### Libraries
- [react-window Documentation](https://github.com/bvaughn/react-window)
- [react-window Examples](https://react-window.vercel.app/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

### Articles
- [Rendering Large Lists with Virtual Scrolling](https://web.dev/virtualize-long-lists-react-window/)
- [Why Virtual Lists are Fast](https://addyosmani.com/blog/react-window/)

### Inspiration
- [Telegram Web (Virtual Scrolling)](https://github.com/morethanwords/tweb)
- [Discord (Performance)](https://discord.com/blog/how-discord-achieves-native-ios-performance-with-react-native)

---

## 💬 Support & Questions

### ติดปัญหา?

1. **ดูเอกสารก่อน:**
   - CHAT_REFACTOR_PLAN.md → ภาพรวม
   - IMPLEMENTATION_CHECKLIST.md → ขั้นตอนละเอียด
   - BEFORE_AFTER_COMPARISON.md → เปรียบเทียบ

2. **ดู Common Issues ด้านบน**

3. **ถามทีม:**
   - Tech Lead
   - Senior Developer
   - Team Chat

---

## 🎯 Goals Recap

### Why Are We Doing This?

**Problem:**
- ⚠️ Scroll ช้าเมื่อมีข้อความเยอะ (20-30 FPS)
- ⚠️ Memory สูง (~50 MB with 1K messages)
- ❌ ไม่มี Jump to Message feature

**Solution:**
- ✅ Virtual Scrolling → 60 FPS แม้มี 10K messages
- ✅ Memory ลดลง 90%
- ✅ เพิ่ม Jump to Message
- ✅ **ไม่กระทบ UI/UX เลย**

**Expected Results:**
- ✅ Performance ดีขึ้น 200-500%
- ✅ User experience ดีขึ้น
- ✅ Scalability ไม่จำกัด
- ✅ Future-proof

---

## ✅ Next Steps

### หลังจากอ่านเอกสารนี้แล้ว:

1. **อ่าน CHAT_REFACTOR_PLAN.md** → เข้าใจภาพรวม
2. **เตรียม environment** → ติดตั้ง dependencies
3. **เริ่ม POC (Day 1)** → ทดลอง Virtual List
4. **ทดสอบ POC** → เช็คว่าทำงานได้
5. **Decision: GO/NO-GO** → หลัง Day 3
6. **ถ้า GO → Implementation** → ตาม checklist
7. **Testing** → Comprehensive tests
8. **Deploy** → Gradual rollout

---

## 📝 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-12 | 1.0 | Initial documentation | Claude AI |

---

**Good luck with the refactor! 🚀**

หากมีคำถามหรือต้องการความช่วยเหลือ อย่าลืมถามทีมได้เสมอ

**Remember:** POC first → Decision → Implementation → Testing → Deploy
