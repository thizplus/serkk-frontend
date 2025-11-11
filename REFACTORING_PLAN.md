# 🔧 REFACTORING PLAN - SUEKK Project

> แผนการปรับปรุงโครงสร้างโค้ดให้สมบูรณ์แบบ
> สร้างเมื่อ: 2025-11-11
> คะแนนปัจจุบัน: **9/10**
> เป้าหมาย: **10/10**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Phase 1: Import Consistency](#phase-1-import-consistency) (Priority: 🔴 High)
- [Phase 2: Cross-Feature Dependencies](#phase-2-cross-feature-dependencies) (Priority: 🟡 Medium)
- [Phase 3: Structure Cleanup](#phase-3-structure-cleanup) (Priority: 🟢 Low)
- [Phase 4: Performance Optimization](#phase-4-performance-optimization) (Priority: 🔵 Optional)
- [Phase 5: Testing & Documentation](#phase-5-testing--documentation) (Priority: 🔵 Optional)
- [Rollback Plan](#rollback-plan)

---

## Overview

### สรุปปัญหาที่พบ

1. **Import paths ไม่ consistent** - 17 ไฟล์ใช้ `@/shared/components` แทน `@/components`
2. **Direct cross-feature imports** - ไม่ผ่าน barrel exports
3. **Empty types folders** - 9 folders ที่ว่างเปล่า
4. **Deep relative imports** - ใน chat feature
5. **"use client" overuse** - ทำให้เสีย SSR benefits

### เป้าหมาย

- ✅ Consistent import paths ทั้งโปรเจค
- ✅ ใช้ barrel exports อย่างเต็มประสิทธิภาพ
- ✅ โครงสร้าง clean ไม่มี unused folders
- ✅ Optimize Server/Client Components
- ✅ เพิ่ม documentation และ tests (optional)

---

## Phase 1: Import Consistency

> **Priority:** 🔴 High
> **Estimated Time:** 30 นาที
> **Risk:** 🟢 Low (automated find-replace)

### เป้าหมาย

แก้ไข import paths ให้ใช้ convenience aliases อย่างสม่ำเสมอทั้งโปรเจค

### ปัญหาที่พบ

```typescript
// ❌ Inconsistent - พบใน 17 ไฟล์
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';

// ✅ Correct - ใช้ convenience alias
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

### ไฟล์ที่ต้องแก้ (17 ไฟล์)

```
src/features/posts/components/CreatePostForm.tsx
src/features/posts/components/PostCard.tsx
src/features/pwa/components/UpdatePromptAuto.tsx
src/features/pwa/components/UpdatePrompt.tsx
src/features/pwa/components/TestPushButton.tsx
src/features/pwa/components/PWAInstallButton.tsx
src/features/pwa/components/PushNotification.tsx
src/features/pwa/components/PushDebugPanel.tsx
src/features/profile/components/UserCard.tsx
src/features/profile/components/ProfileContent.tsx
src/features/comments/components/ProfileCommentCard.tsx
src/features/comments/components/DeleteCommentDialog.tsx
src/features/comments/components/CommentTree.tsx
src/features/comments/components/CommentList.tsx
src/features/comments/components/CommentForm.tsx
src/features/comments/components/CommentCard.tsx
src/features/comments/components/CommentActions.tsx
```

### Checklist

#### 1.1 Pre-flight Checks

- [ ] Commit งานปัจจุบัน (`git add . && git commit -m "Pre-refactor checkpoint"`)
- [ ] สร้าง branch ใหม่ (`git checkout -b refactor/import-consistency`)
- [ ] Backup ไฟล์สำคัญ (optional)
- [ ] ตรวจสอบว่า tsconfig.json มี aliases ถูกต้อง

#### 1.2 แก้ไข Imports (Automated)

**Option 1: ใช้ sed (Linux/Mac/Git Bash)**

```bash
# แก้ @/shared/components → @/components
find src/features -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i 's|@/shared/components|@/components|g' {} +

# ตรวจสอบผลลัพธ์
git diff src/features
```

- [ ] Run command ข้างบน
- [ ] Review changes ด้วย `git diff`

**Option 2: ใช้ PowerShell (Windows)**

```powershell
# แก้ @/shared/components → @/components
Get-ChildItem -Path src/features -Recurse -Include *.tsx,*.ts | ForEach-Object {
    (Get-Content $_.FullName) -replace '@/shared/components', '@/components' | Set-Content $_.FullName
}
```

- [ ] Run command ข้างบน
- [ ] Review changes ด้วย `git diff`

**Option 3: ใช้ VS Code Find & Replace (Manual)**

```
Find:    @/shared/components
Replace: @/components
Files:   src/features/**/*.{ts,tsx}
```

- [ ] เปิด VS Code Find & Replace (Ctrl+Shift+H)
- [ ] ใส่ค่า find/replace
- [ ] Click "Replace All"
- [ ] Review changes

#### 1.3 แก้ไข Imports อื่นๆ (ถ้ามี)

```bash
# ตรวจสอบว่ามี @/shared/lib, @/shared/hooks อีกไหม
grep -r "@/shared/lib" src/features | grep -v node_modules
grep -r "@/shared/hooks" src/features | grep -v node_modules
```

- [ ] ตรวจสอบ @/shared/lib → ควรใช้ @/lib
- [ ] ตรวจสอบ @/shared/hooks → ควรใช้ @/hooks
- [ ] ตรวจสอบ @/shared/config → ควรใช้ @/config
- [ ] ตรวจสอบ @/shared/types → ควรใช้ @/types

#### 1.4 Testing & Verification

- [ ] Build project: `npm run build`
- [ ] ตรวจสอบ TypeScript errors: `npx tsc --noEmit`
- [ ] Run dev server: `npm run dev`
- [ ] ทดสอบ features หลัก:
  - [ ] Login/Register
  - [ ] Create Post
  - [ ] Comments
  - [ ] Profile
  - [ ] Chat (ถ้ามี)
- [ ] ตรวจสอบ console errors ใน browser

#### 1.5 Commit Changes

```bash
git add .
git commit -m "refactor: standardize import paths to use convenience aliases

- Replace @/shared/components with @/components (17 files)
- Replace @/shared/lib with @/lib
- Replace @/shared/hooks with @/hooks
- Replace @/shared/config with @/config
- Ensure consistent import style across all features

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] Commit changes
- [ ] Push to remote: `git push -u origin refactor/import-consistency`

---

## Phase 2: Cross-Feature Dependencies

> **Priority:** 🟡 Medium
> **Estimated Time:** 20 นาที
> **Risk:** 🟡 Medium (manual changes)

### เป้าหมาย

ใช้ barrel exports ให้เต็มที่เมื่อ import ข้าม features

### ปัญหาที่พบ

```typescript
// ❌ Direct import - src/features/comments/components/CommentCard.tsx:7
import { VoteButtons } from "@/features/posts/components/VoteButtons";

// ✅ Through barrel export
import { VoteButtons } from "@/features/posts";
```

### ไฟล์ที่ต้อแก้

```
src/features/comments/components/CommentCard.tsx
```

### Checklist

#### 2.1 ตรวจสอบ Direct Cross-Feature Imports

```bash
# หา imports ที่ไม่ผ่าน barrel
grep -r "from ['\"]@/features/.*/components" src/features | grep -v node_modules
grep -r "from ['\"]@/features/.*/hooks" src/features | grep -v node_modules
grep -r "from ['\"]@/features/.*/services" src/features | grep -v node_modules
```

- [ ] สร้างรายชื่อไฟล์ที่ต้องแก้
- [ ] ตรวจสอบว่า barrel exports มี components เหล่านั้นหรือยัง

#### 2.2 แก้ไข CommentCard.tsx

**Before:**
```typescript
import { VoteButtons } from "@/features/posts/components/VoteButtons";
```

**After:**
```typescript
import { VoteButtons } from "@/features/posts";
```

- [ ] เปิดไฟล์ `src/features/comments/components/CommentCard.tsx`
- [ ] แก้ไข import line 7
- [ ] Save file

#### 2.3 ตรวจสอบ Barrel Exports

ตรวจสอบว่า `src/features/posts/index.ts` export VoteButtons หรือยัง

```typescript
// src/features/posts/index.ts
export { VoteButtons } from './components/VoteButtons';  // ✅ มีอยู่แล้ว
```

- [ ] ตรวจสอบ posts/index.ts (line 9)
- [ ] ตรวจสอบว่า export ครบถ้วน

#### 2.4 แก้ไขไฟล์อื่นๆ (ถ้าพบ)

ถ้าพบ direct imports อื่น ให้แก้ด้วยวิธีเดียวกัน:

```typescript
// ❌ Before
import { SomeComponent } from "@/features/xxx/components/SomeComponent";

// ✅ After (ตรวจสอบว่า xxx/index.ts export SomeComponent)
import { SomeComponent } from "@/features/xxx";
```

- [ ] แก้ไขทีละไฟล์
- [ ] ตรวจสอบ barrel exports ทุกครั้ง

#### 2.5 Testing & Verification

- [ ] Build project: `npm run build`
- [ ] ตรวจสอบ TypeScript errors: `npx tsc --noEmit`
- [ ] ทดสอบ Comments feature:
  - [ ] สร้าง comment ใหม่
  - [ ] Vote comment (ทดสอบ VoteButtons)
  - [ ] Reply comment
  - [ ] Delete comment
- [ ] ตรวจสอบ console errors

#### 2.6 Commit Changes

```bash
git add .
git commit -m "refactor: use barrel exports for cross-feature imports

- Update CommentCard to import VoteButtons through barrel export
- Replace direct component imports with feature exports
- Improve encapsulation and reduce coupling

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] Commit changes
- [ ] Push to remote

---

## Phase 3: Structure Cleanup

> **Priority:** 🟢 Low
> **Estimated Time:** 15 นาที
> **Risk:** 🟢 Low (remove empty folders)

### เป้าหมาย

ลบ empty types folders และปรับโครงสร้างให้ clean

### ปัญหาที่พบ

```
src/features/auth/types/        (empty)
src/features/chat/types/        (empty)
src/features/comments/types/    (empty)
src/features/notifications/types/ (empty)
src/features/posts/types/       (empty)
src/features/profile/types/     (empty)
src/features/pwa/types/         (empty)
src/features/search/types/      (empty)
src/features/tags/types/        (empty)
```

### Checklist

#### 3.1 ตรวจสอบ Empty Folders

```bash
# หา empty types folders
find src/features -name "types" -type d -empty
```

- [ ] ยืนยันว่า folders ว่างจริง (9 folders)
- [ ] ตรวจสอบว่าไม่มีไฟล์ .gitkeep หรืออื่นๆ

#### 3.2 ลบ Empty Types Folders

**Option 1: Automated (Linux/Mac/Git Bash)**

```bash
# ลบ empty types folders
find src/features -name "types" -type d -empty -delete

# ตรวจสอบผลลัพธ์
find src/features -name "types" -type d
```

- [ ] Run command
- [ ] ตรวจสอบว่าลบสำเร็จ

**Option 2: Manual (Windows/PowerShell)**

```powershell
# หา empty folders
Get-ChildItem -Path src/features -Recurse -Directory -Filter "types" | Where-Object {
    (Get-ChildItem $_.FullName).Count -eq 0
} | Remove-Item

# หรือลบทีละ folder ด้วย File Explorer
```

- [ ] Run command หรือลบ manually
- [ ] ตรวจสอบว่าลบสำเร็จ

**Option 3: Manual Delete (All Platforms)**

ลบ folders เหล่านี้ด้วย File Explorer/Finder:

- [ ] `src/features/auth/types/`
- [ ] `src/features/chat/types/`
- [ ] `src/features/comments/types/`
- [ ] `src/features/notifications/types/`
- [ ] `src/features/posts/types/`
- [ ] `src/features/profile/types/`
- [ ] `src/features/pwa/types/`
- [ ] `src/features/search/types/`
- [ ] `src/features/tags/types/`

#### 3.3 Update .gitignore (ถ้าต้องการ)

ถ้าต้องการป้องกันไม่ให้สร้าง empty folders อีก:

```bash
# เพิ่มใน .gitignore (optional)
echo "# Prevent empty types folders" >> .gitignore
echo "**/types/.gitkeep" >> .gitignore
```

- [ ] พิจารณาว่าต้องการ update .gitignore หรือไม่
- [ ] ถ้าใช่ ให้เพิ่มกฎ

#### 3.4 ตรวจสอบว่า Types ยังใช้งานได้

Features ควรใช้ types จาก `@/shared/types` แทน:

```typescript
// ✅ Correct - ใน barrel exports
export type { Post, Comment, User } from '@/shared/types';

// ✅ Correct - ใน components
import type { Post } from '@/shared/types';
```

- [ ] ตรวจสอบ barrel exports ของทุก feature
- [ ] ตรวจสอบว่ามี type imports จาก shared/types

#### 3.5 Testing & Verification

- [ ] Build project: `npm run build`
- [ ] ตรวจสอบ TypeScript errors: `npx tsc --noEmit`
- [ ] ตรวจสอบว่าไม่มี import errors
- [ ] Run dev server: `npm run dev`

#### 3.6 Commit Changes

```bash
git add .
git commit -m "chore: remove empty types folders from features

- Remove 9 empty types directories
- Types are centralized in shared/types
- Clean up unused folder structure

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] Commit changes
- [ ] Push to remote

---

## Phase 4: Performance Optimization

> **Priority:** 🔵 Optional
> **Estimated Time:** 1-2 ชั่วโมง
> **Risk:** 🟡 Medium (architectural changes)

### เป้าหมาย

Optimize Server/Client Components เพื่อใช้ประโยชน์จาก Next.js 14 App Router

### ปัญหาที่พบ

```typescript
// app/profile/[username]/page.tsx - Server Component ✅
export default async function ProfilePage({ params }) {
  return <ProfileContent params={params} />;
}

// src/features/profile/components/ProfileContent.tsx - "use client" ❌
"use client";
export function ProfileContent() { ... }
```

**ผลกระทบ:**
- Static content ไม่ได้ render ฝั่ง server
- SEO น้อยลง
- First Load ช้าลง

### Checklist

#### 4.1 Analyze Current "use client" Usage

```bash
# หาไฟล์ทั้งหมดที่มี "use client"
grep -r "use client" src --include="*.tsx" --include="*.ts" | wc -l

# แสดงรายชื่อไฟล์
grep -r "use client" src --include="*.tsx" --include="*.ts" -l
```

- [ ] ตรวจสอบ "use client" usage (ประมาณ 52 files)
- [ ] ระบุไฟล์ที่ควร optimize

#### 4.2 Split ProfileContent Component

**เป้าหมาย:** แยก static/interactive parts

**Before:** `ProfileContent.tsx` - ทั้งหมดเป็น client component

**After:** แบ่งเป็น:
- `ProfileHeader.tsx` - Server Component (static: avatar, bio, stats)
- `ProfileTabs.tsx` - Client Component (interactive: tabs, infinite scroll)
- `FollowButton.tsx` - Client Component (interactive: follow/unfollow)

##### 4.2.1 สร้าง ProfileHeader (Server Component)

```bash
# สร้างไฟล์ใหม่
touch src/features/profile/components/ProfileHeader.tsx
```

- [ ] สร้างไฟล์ `ProfileHeader.tsx`
- [ ] Copy static parts จาก ProfileContent:
  - [ ] Avatar image
  - [ ] Display name, username
  - [ ] Bio, location, website
  - [ ] Followers/Following counts
- [ ] **ห้าม** ใส่ "use client"
- [ ] Export component

##### 4.2.2 สร้าง ProfileTabs (Client Component)

```bash
touch src/features/profile/components/ProfileTabs.tsx
```

- [ ] สร้างไฟล์ `ProfileTabs.tsx`
- [ ] ใส่ "use client" (จำเป็นสำหรับ interactive tabs)
- [ ] Copy tabs logic จาก ProfileContent:
  - [ ] Tab switching
  - [ ] Posts feed
  - [ ] Comments feed
  - [ ] Infinite scroll
- [ ] Export component

##### 4.2.3 สร้าง FollowButton (Client Component)

```bash
touch src/features/profile/components/FollowButton.tsx
```

- [ ] สร้างไฟล์ `FollowButton.tsx`
- [ ] ใส่ "use client"
- [ ] Copy follow/unfollow logic
- [ ] Export component

##### 4.2.4 Update ProfileContent

แก้ไข `ProfileContent.tsx` ให้กลายเป็น composition component:

```typescript
// ❌ ลบ "use client" ออก
// "use client";

export function ProfileContent({ params }) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  return (
    <AppLayout>
      <ProfileHeader username={username} />
      <FollowButton username={username} />
      <ProfileTabs username={username} />
    </AppLayout>
  );
}
```

- [ ] ลบ "use client" directive
- [ ] แทนที่ด้วย composition ของ 3 components
- [ ] ส่ง props ที่จำเป็น

##### 4.2.5 Update Profile Page

แก้ไข `app/profile/[username]/page.tsx`:

```typescript
// ✅ ยังคงเป็น Server Component
export default async function ProfilePage({ params }) {
  // Optional: Fetch data ฝั่ง server
  // const user = await fetchUser(params.username);

  return <ProfileContent params={params} />;
}
```

- [ ] ตรวจสอบว่ายังเป็น Server Component
- [ ] พิจารณา fetch data ฝั่ง server (optional)

#### 4.3 Split PostDetailContent Component

ทำแบบเดียวกันกับ Profile:

##### 4.3.1 Analyze PostDetailContent

```bash
code src/features/posts/components/PostDetailContent.tsx  # ถ้ามี
code app/post/[id]/PostDetailContent.tsx
```

- [ ] ตรวจสอบโครงสร้างปัจจุบัน
- [ ] ระบุ static/interactive parts

##### 4.3.2 แบ่ง Components (ถ้าจำเป็น)

- [ ] สร้าง PostHeader (Server) - title, author, content
- [ ] สร้าง PostActions (Client) - vote, share, save buttons
- [ ] สร้าง PostComments (Client) - comment section
- [ ] Update PostDetailContent

#### 4.4 Review Other Pages

ตรวจสอบ pages อื่นๆ ที่อาจ optimize ได้:

- [ ] `app/page.tsx` (Home) - แยก feed ออกจาก static content
- [ ] `app/search/page.tsx` - แยก search input/results
- [ ] `app/tag/[tagName]/page.tsx` - แยก tag info/posts

#### 4.5 Testing & Verification

- [ ] Build project: `npm run build`
- [ ] ตรวจสอบ build output (ดู Server/Client Components)
- [ ] ทดสอบ Profile page:
  - [ ] View source (Ctrl+U) - ตรวจสอบ HTML ฝั่ง server
  - [ ] ตรวจสอบ SEO metadata
  - [ ] ทดสอบ interactive features (tabs, follow)
- [ ] ทดสอบ Post detail page:
  - [ ] View source
  - [ ] ตรวจสอบ vote, comment features
- [ ] Performance testing:
  - [ ] Lighthouse score
  - [ ] First Contentful Paint (FCP)
  - [ ] Time to Interactive (TTI)

#### 4.6 Commit Changes

```bash
git add .
git commit -m "perf: optimize Server/Client Component split

- Split ProfileContent into Server/Client components
- ProfileHeader (Server) - static content for better SEO
- ProfileTabs (Client) - interactive features
- FollowButton (Client) - follow/unfollow actions
- Split PostDetailContent similarly
- Improve First Contentful Paint and SEO

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] Commit changes
- [ ] Push to remote

---

## Phase 5: Testing & Documentation

> **Priority:** 🔵 Optional
> **Estimated Time:** 2-4 ชั่วโมง
> **Risk:** 🟢 Low (additive changes)

### เป้าหมาย

เพิ่ม tests และ documentation เพื่อ maintainability

### Checklist

#### 5.1 Setup Testing Infrastructure

##### 5.1.1 Install Dependencies

```bash
# Install Vitest + React Testing Library
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event
```

- [ ] Install testing libraries
- [ ] Verify installation

##### 5.1.2 Create Vitest Config

```bash
# สร้างไฟล์ vitest.config.ts
touch vitest.config.ts
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/components': path.resolve(__dirname, './src/shared/components'),
      '@/lib': path.resolve(__dirname, './src/shared/lib'),
      '@/hooks': path.resolve(__dirname, './src/shared/hooks'),
      '@/types': path.resolve(__dirname, './src/shared/types'),
      '@/config': path.resolve(__dirname, './src/shared/config'),
    },
  },
});
```

- [ ] สร้าง vitest.config.ts
- [ ] Setup path aliases

##### 5.1.3 Create Test Setup

```bash
mkdir -p src/test
touch src/test/setup.ts
```

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

- [ ] สร้าง setup file
- [ ] Configure jest-dom matchers

##### 5.1.4 Update package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

- [ ] เพิ่ม test scripts
- [ ] ทดสอบรัน: `npm test`

#### 5.2 Write Unit Tests

##### 5.2.1 Test Utility Functions

```bash
touch src/shared/lib/utils/utils.test.ts
```

- [ ] Test `cn()` function
- [ ] Test URL validators
- [ ] Test validators (email, password, etc.)

##### 5.2.2 Test Components

```bash
touch src/shared/components/common/LinkifiedContent.test.tsx
```

- [ ] Test LinkifiedContent component
- [ ] Test URL sanitization
- [ ] Test XSS prevention

##### 5.2.3 Test Feature Components

```bash
touch src/features/auth/components/LoginForm.test.tsx
```

- [ ] Test LoginForm
- [ ] Test form validation
- [ ] Test submission

#### 5.3 Write Integration Tests

```bash
# สร้าง test folder
mkdir -p src/features/posts/__tests__
touch src/features/posts/__tests__/posts.integration.test.tsx
```

- [ ] Test post creation flow
- [ ] Test voting flow
- [ ] Test comments flow

#### 5.4 Add Documentation

##### 5.4.1 Create Architecture Documentation

```bash
touch docs/ARCHITECTURE.md
```

**เนื้อหา:**
- Feature-based architecture explanation
- Folder structure
- Import conventions
- Naming conventions

- [ ] สร้าง ARCHITECTURE.md
- [ ] อธิบาย feature structure
- [ ] เพิ่ม diagrams (optional)

##### 5.4.2 Create Feature README

```bash
touch src/features/README.md
```

**เนื้อหา:**
- Feature list
- Dependencies between features
- How to add new feature

- [ ] สร้าง features/README.md
- [ ] List all features
- [ ] Document dependencies

##### 5.4.3 Create Contributing Guide

```bash
touch CONTRIBUTING.md
```

**เนื้อหา:**
- Development setup
- Coding standards
- PR process
- Testing requirements

- [ ] สร้าง CONTRIBUTING.md
- [ ] Document setup steps
- [ ] Document standards

##### 5.4.4 Update Main README

```bash
# แก้ไข README.md ที่มีอยู่
```

- [ ] เพิ่ม architecture section
- [ ] เพิ่ม testing section
- [ ] เพิ่ม links to docs

#### 5.5 Setup CI/CD (Optional)

##### 5.5.1 Create GitHub Actions Workflow

```bash
mkdir -p .github/workflows
touch .github/workflows/ci.yml
```

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npx tsc --noEmit
```

- [ ] สร้าง CI workflow
- [ ] ทดสอบ workflow

#### 5.6 Commit Changes

```bash
git add .
git commit -m "test: add testing infrastructure and documentation

- Setup Vitest + React Testing Library
- Add unit tests for utilities and components
- Add integration tests for features
- Create ARCHITECTURE.md and CONTRIBUTING.md
- Setup CI/CD with GitHub Actions

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

- [ ] Commit changes
- [ ] Push to remote

---

## Rollback Plan

### กรณีเกิดปัญหา

#### Rollback ทั้งหมด

```bash
# ยกเลิกทุกอย่าง กลับไป pre-refactor checkpoint
git reset --hard HEAD~[number-of-commits]

# หรือ
git checkout main
git branch -D refactor/import-consistency
```

#### Rollback แบบเลือก

```bash
# Revert specific commit
git revert <commit-hash>

# หรือ reset เฉพาะไฟล์
git checkout HEAD~1 -- path/to/file
```

---

## Progress Tracking

### Overall Progress

- [ ] Phase 1: Import Consistency (🔴 High Priority)
- [ ] Phase 2: Cross-Feature Dependencies (🟡 Medium Priority)
- [ ] Phase 3: Structure Cleanup (🟢 Low Priority)
- [ ] Phase 4: Performance Optimization (🔵 Optional)
- [ ] Phase 5: Testing & Documentation (🔵 Optional)

### Final Checklist

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Build successful
- [ ] Dev server running without errors
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Code review completed (if team)
- [ ] PR merged (if using PR workflow)

---

## Notes

### การบันทึกความคืบหน้า

ใช้ไฟล์นี้เพื่อติ๊กถูก (✓) แต่ละ task ที่ทำเสร็จ คุณสามารถ:

1. Edit ไฟล์นี้ใน VS Code
2. แทนที่ `- [ ]` ด้วย `- [x]` เมื่อทำเสร็จ
3. Commit อัพเดท progress เป็นระยะ

### หลังจากเสร็จทั้งหมด

```bash
# Merge refactor branch เข้า main
git checkout main
git merge refactor/import-consistency
git push origin main

# ลบ branch (optional)
git branch -d refactor/import-consistency
git push origin --delete refactor/import-consistency
```

### ถัดไป

หลังจากทำ refactoring เสร็จ แนะนำให้:

1. Monitor performance metrics (Lighthouse)
2. Collect user feedback
3. Plan next improvements
4. Keep documentation updated

---

**Happy Refactoring! 🚀**
