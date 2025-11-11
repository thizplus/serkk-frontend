# 🚀 Quick Start - Refactoring Guide

> เริ่มต้น refactoring โค้ดฐาน SUEKK ภายใน 1 ชั่วโมง

---

## TL;DR (สำหรับคนรีบ)

```bash
# 1. Backup
git checkout -b refactor/import-consistency

# 2. Run automated script (เลือกอย่างใดอย่างหนึ่ง)

# Linux/Mac/Git Bash:
bash scripts/refactor-imports.sh

# Windows PowerShell:
powershell -ExecutionPolicy Bypass -File scripts/refactor-imports.ps1

# 3. Test
npm run build
npm run dev

# 4. Commit
git commit -m "refactor: standardize import paths"
```

---

## 📚 ขั้นตอนแบบละเอียด

### ⏱️ Phase 1: Import Consistency (30 นาที)

**ก่อนเริ่ม:**

```bash
# 1. Commit งานปัจจุบัน
git add .
git commit -m "checkpoint: before refactoring"

# 2. สร้าง branch ใหม่
git checkout -b refactor/import-consistency

# 3. Verify ว่าอยู่ใน project root
pwd  # ควรเห็น: .../nextjs-frontend
```

**วิธีที่ 1: ใช้ Automated Script (แนะนำ)**

```bash
# สำหรับ Linux/Mac/Git Bash
bash scripts/refactor-imports.sh

# สำหรับ Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/refactor-imports.ps1
```

Script จะทำอัตโนมัติ:
- ✅ สร้าง backup branch
- ✅ Replace import paths ทั้งหมด
- ✅ Verify changes
- ✅ Run TypeScript check (optional)
- ✅ Commit changes (optional)

**วิธีที่ 2: Manual (ถ้า script ไม่ทำงาน)**

1. เปิด VS Code Find & Replace (Ctrl+Shift+H)
2. ตั้งค่า:
   ```
   Find:    @/shared/components
   Replace: @/components
   Files:   src/**/*.{ts,tsx}
   ```
3. Click "Replace All"
4. ทำซ้ำกับ:
   - `@/shared/lib` → `@/lib`
   - `@/shared/hooks` → `@/hooks`
   - `@/shared/config` → `@/config`
   - `@/shared/types` → `@/types`

**ทดสอบ:**

```bash
# 1. Build
npm run build
# Expected: ✓ Compiled successfully

# 2. TypeScript check
npx tsc --noEmit
# Expected: No errors

# 3. Run dev server
npm run dev
# Expected: Server running on http://localhost:3000

# 4. Manual testing
# - เปิด browser → http://localhost:3000
# - ทดสอบ Login, Create Post, Comments
```

**Commit:**

```bash
git add .
git commit -m "refactor: standardize import paths to use convenience aliases

- Replace @/shared/components with @/components
- Replace @/shared/lib with @/lib
- Ensure consistent import style across all features

🤖 Generated with Claude Code"

git push -u origin refactor/import-consistency
```

---

### ⏱️ Phase 2: Cross-Feature Dependencies (20 นาที)

**แก้ไข CommentCard.tsx:**

```bash
# เปิดไฟล์
code src/features/comments/components/CommentCard.tsx
```

**เปลี่ยน line 7:**

```diff
- import { VoteButtons } from "@/features/posts/components/VoteButtons";
+ import { VoteButtons } from "@/features/posts";
```

**ตรวจสอบว่ามี direct imports อื่นอีกไหม:**

```bash
# หา imports ที่ไม่ผ่าน barrel
grep -r "from ['\"]@/features/.*/components" src/features
grep -r "from ['\"]@/features/.*/hooks" src/features
```

ถ้าพบ ให้แก้แบบเดียวกัน

**ทดสอบ:**

```bash
npm run build
npm run dev

# ทดสอบ Comments feature:
# 1. สร้าง comment
# 2. Vote comment (ทดสอบ VoteButtons)
# 3. Reply comment
```

**Commit:**

```bash
git add .
git commit -m "refactor: use barrel exports for cross-feature imports

- Update CommentCard to import VoteButtons through barrel
- Improve encapsulation and reduce coupling"

git push
```

---

### ⏱️ Phase 3: Structure Cleanup (15 นาที)

**ลบ empty types folders:**

```bash
# ตรวจสอบก่อน
find src/features -name "types" -type d -empty

# ลบ (เลือกวิธีที่สะดวก)

# Linux/Mac/Git Bash:
find src/features -name "types" -type d -empty -delete

# PowerShell:
Get-ChildItem -Path src/features -Recurse -Directory -Filter "types" |
  Where-Object { (Get-ChildItem $_.FullName).Count -eq 0 } |
  Remove-Item

# หรือลบ manually ด้วย File Explorer:
# - src/features/auth/types/
# - src/features/chat/types/
# - src/features/comments/types/
# (... และอีก 6 folders)
```

**ทดสอบ:**

```bash
npm run build
# Expected: ✓ Compiled successfully (ไม่มี import errors)
```

**Commit:**

```bash
git add .
git commit -m "chore: remove empty types folders from features

- Remove 9 empty types directories
- Types are centralized in shared/types"

git push
```

---

### ⏱️ Phase 4-5: Optional (ทำได้ภายหลัง)

Phase 4 (Performance) และ Phase 5 (Testing) เป็น optional
ดูรายละเอียดใน [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)

---

## ✅ Verification Checklist

ก่อน merge กลับเข้า main ให้ตรวจสอบ:

- [ ] `npm run build` สำเร็จ (no errors)
- [ ] `npx tsc --noEmit` ไม่มี type errors
- [ ] `npm run dev` รันได้
- [ ] Login/Register ทำงาน
- [ ] Create Post ทำงาน
- [ ] Comments ทำงาน (รวมถึง VoteButtons)
- [ ] Profile page ทำงาน
- [ ] Chat ทำงาน (ถ้ามี)
- [ ] ไม่มี console errors ใน browser
- [ ] git diff ดูเหมือนถูกต้อง

---

## 🔄 Merge กลับเข้า Main

```bash
# 1. Checkout main
git checkout main

# 2. Pull latest changes (ถ้าทำงานเป็นทีม)
git pull origin main

# 3. Merge refactor branch
git merge refactor/import-consistency

# 4. Resolve conflicts (ถ้ามี)
# แก้ conflicts → git add . → git commit

# 5. Push to remote
git push origin main

# 6. ลบ branch (optional)
git branch -d refactor/import-consistency
git push origin --delete refactor/import-consistency
```

---

## 🆘 Troubleshooting

### ❌ Build ไม่สำเร็จ

```bash
# ดู error messages
npm run build 2>&1 | tee build-errors.log

# แก้ไข import paths ที่พลาด
# ตรวจสอบว่าใช้ alias ถูกต้อง
```

### ❌ TypeScript Errors

```bash
# รัน type check
npx tsc --noEmit

# ดู errors แล้วแก้ทีละตัว
```

### ❌ Runtime Errors

```bash
# ดู browser console (F12)
# ตรวจสอบว่า imports ถูกต้อง
# ตรวจสอบว่า barrel exports ครบ
```

### 🔄 Rollback ทั้งหมด

```bash
# วิธีที่ 1: Reset hard
git reset --hard backup/pre-refactor-[timestamp]

# วิธีที่ 2: Revert commits
git revert HEAD~3  # revert 3 commits ล่าสุด

# วิธีที่ 3: Checkout main แล้วลบ branch
git checkout main
git branch -D refactor/import-consistency
```

---

## 📊 Progress Tracking

ใช้ [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) เพื่อ track progress แบบละเอียด

**Quick Progress:**

- [ ] Phase 1: Import Consistency ✅
- [ ] Phase 2: Cross-Feature Dependencies
- [ ] Phase 3: Structure Cleanup
- [ ] Phase 4: Performance (Optional)
- [ ] Phase 5: Testing (Optional)

---

## 💡 Tips

1. **ทำทีละ Phase** - อย่ารีบทำทุกอย่างพร้อมกัน
2. **Commit บ่อยๆ** - เพื่อง่ายต่อการ rollback
3. **Test บ่อยๆ** - หลังทุก phase
4. **Review changes** - ใช้ `git diff` ตรวจสอบทุกครั้ง
5. **Backup** - สร้าง backup branch ก่อนเริ่ม

---

## 📖 Additional Resources

- [REFACTORING_PLAN.md](./REFACTORING_PLAN.md) - แผนแบบละเอียด
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architecture documentation (สร้างใน Phase 5)
- [tsconfig.json](./tsconfig.json) - Path aliases configuration

---

## ✨ หลังจากเสร็จ

1. ✅ ตรวจสอบว่าทุกอย่างทำงาน
2. 🎉 Celebrate! คุณ refactor สำเร็จแล้ว
3. 📝 อัพเดท documentation (ถ้ามี)
4. 🚀 Deploy (ถ้าพร้อม)

---

**มีคำถาม?** เปิดดูรายละเอียดใน [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)

**Happy Refactoring! 🎯**
