# Scripts Directory

Automated scripts สำหรับ maintenance และ refactoring

---

## 📁 Available Scripts

### 1. `refactor-imports.sh` (Linux/Mac/Git Bash)

Automatically fix import paths to use convenience aliases

**Usage:**
```bash
bash scripts/refactor-imports.sh
```

**Features:**
- ✅ Auto-backup (creates backup branch)
- ✅ Replace all import paths
- ✅ Verification checks
- ✅ Optional TypeScript check
- ✅ Optional auto-commit

**Changes:**
- `@/shared/components` → `@/components`
- `@/shared/lib` → `@/lib`
- `@/shared/hooks` → `@/hooks`
- `@/shared/config` → `@/config`
- `@/shared/types` → `@/types`

---

### 2. `refactor-imports.ps1` (Windows PowerShell)

Same as `refactor-imports.sh` but for Windows

**Usage:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/refactor-imports.ps1
```

**Note:** ถ้าพบ Execution Policy error ให้รัน:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### 3. `update-sw-version.js` (Existing)

Updates service worker version for PWA

**Usage:**
```bash
node scripts/update-sw-version.js
```

---

## 🚀 Quick Start

**สำหรับ refactoring import paths:**

```bash
# 1. Make sure you're in project root
cd /path/to/nextjs-frontend

# 2. Commit current work
git add .
git commit -m "checkpoint"

# 3. Run script (เลือกตาม OS)

# Linux/Mac/Git Bash:
bash scripts/refactor-imports.sh

# Windows PowerShell:
powershell -ExecutionPolicy Bypass -File scripts/refactor-imports.ps1

# 4. Review changes
git diff

# 5. Test
npm run build
npm run dev
```

---

## ⚠️ Safety Features

ทุก script มี safety checks:

1. **Pre-flight checks** - ตรวจสอบ git, uncommitted changes
2. **Auto backup** - สร้าง backup branch อัตโนมัติ
3. **Verification** - ตรวจสอบผลลัพธ์หลัง refactor
4. **Optional testing** - เสนอให้รัน TypeScript check
5. **Optional commit** - ถามก่อน commit

---

## 🔄 Rollback

ถ้าเกิดปัญหา สามารถ rollback ได้:

```bash
# ดู backup branches
git branch | grep backup

# Rollback
git reset --hard backup/pre-refactor-[timestamp]

# หรือ
git checkout backup/pre-refactor-[timestamp]
```

---

## 📝 Adding New Scripts

เมื่อสร้าง script ใหม่:

1. ตั้งชื่อให้สื่อความหมาย (kebab-case)
2. เพิ่ม shebang: `#!/bin/bash` หรือ PowerShell comment
3. เพิ่ม comments อธิบายการใช้งาน
4. เพิ่ม error handling
5. เพิ่มใน README นี้
6. Make executable (Linux/Mac): `chmod +x scripts/your-script.sh`

**Template:**

```bash
#!/bin/bash

# =============================================================================
# Script Name - Brief Description
# =============================================================================
#
# Purpose: Detailed purpose
# Usage:   bash scripts/your-script.sh [args]
#
# =============================================================================

set -e  # Exit on error

# Your code here
```

---

## 🛠️ Troubleshooting

### Script ไม่ทำงาน (Linux/Mac)

```bash
# ตรวจสอบ permissions
ls -l scripts/refactor-imports.sh

# เพิ่ม execute permission
chmod +x scripts/refactor-imports.sh

# รันอีกครั้ง
bash scripts/refactor-imports.sh
```

### Script ไม่ทำงาน (Windows)

```powershell
# ตรวจสอบ Execution Policy
Get-ExecutionPolicy

# เปลี่ยน policy (ถ้าจำเป็น)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# รันอีกครั้ง
powershell -ExecutionPolicy Bypass -File scripts/refactor-imports.ps1
```

### sed ไม่ทำงาน (Mac)

Mac ใช้ BSD sed ซึ่งต่างจาก GNU sed:

```bash
# ติดตั้ง GNU sed
brew install gnu-sed

# ใช้ gsed แทน sed
# หรือแก้ script ให้ใช้ gsed
```

---

## 📚 Additional Resources

- [REFACTORING_PLAN.md](../REFACTORING_PLAN.md) - Complete refactoring plan
- [REFACTORING_QUICKSTART.md](../REFACTORING_QUICKSTART.md) - Quick start guide

---

**Happy Scripting! 🚀**
