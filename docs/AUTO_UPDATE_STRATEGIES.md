# 🔄 Auto-Update Strategies

## 📋 เลือก Strategy ที่เหมาะกับคุณ

มี **4 วิธี** ให้เลือก แต่ละวิธีมีข้อดี-ข้อเสียต่างกัน:

---

## 🎯 Strategy 1: Navigate (แนะนำที่สุด! ⭐⭐⭐⭐⭐)

**ทำงาน:** Auto-reload **เมื่อ user คลิกลิงก์/เปลี่ยนหน้า**

### ✅ ข้อดี
- ✨ UX ดีที่สุด - ไม่รบกวน user
- 💾 ไม่ทำให้ data หาย
- 🎭 Update เป็นส่วนหนึ่งของการ navigate
- 🚀 User ไม่รู้สึกว่ามีการ reload

### ❌ ข้อเสีย
- ถ้า user อยู่หน้าเดียวนาน → ไม่ update (แต่ก็ไม่เป็นไร)

### 📝 วิธีใช้

```tsx
// components/layouts/AppLayout.tsx
import { UpdatePromptAuto } from "@/components/pwa/UpdatePromptAuto";

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  return (
    <>
      <SidebarProvider>
        {/* ... existing code ... */}
      </SidebarProvider>

      <MobileBottomNav />

      {/* Replace UpdatePrompt with UpdatePromptAuto */}
      <UpdatePromptAuto strategy="navigate" />
    </>
  );
}
```

### 🎬 ตัวอย่างการทำงาน

```
User: *อ่านโพสต์อยู่*
System: [Deploy version ใหม่]
System: [ตรวจจับ update]
User: *คลิกไปหน้าอื่น*
System: [Auto-reload] ✅
User: *เห็น version ใหม่โดยไม่รู้ตัว*
```

---

## 💤 Strategy 2: Idle (แนะนำสำหรับ Social Media ⭐⭐⭐⭐)

**ทำงาน:** Auto-reload **เมื่อ user ไม่ทำอะไร 30 วินาที**

### ✅ ข้อดี
- 🎯 Update เร็ว - รอแค่ไม่กี่วินาที
- 💾 ไม่ทำให้ data หาย (รอให้ idle)
- 🔔 แสดง countdown ให้เห็น
- ⏸️ User เคลื่อนเมาส์ = ยกเลิก countdown

### ❌ ข้อเสีย
- อาจ reload ตอนที่ user กำลังคิด/อ่าน (แต่น้อย)

### 📝 วิธีใช้

```tsx
<UpdatePromptAuto
  strategy="idle"
  idleTimeout={30}  // 30 วินาที (ปรับได้)
  showCountdown={true}
/>
```

### 🎬 ตัวอย่างการทำงาน

```
User: *อ่านโพสต์*
System: [Deploy version ใหม่]
System: [ตรวจจับ update]
System: [แสดง: "จะอัปเดตใน 30 วินาที"]
User: *ไม่ขยับเมาส์ 30 วินาที*
System: [Auto-reload] ✅

-- OR --

User: *เห็น countdown 15 วินาที*
User: *เคลื่อนเมาส์*
System: [Reset countdown เป็น 30 วินาที]
```

### 🎨 UI ที่แสดง

```
┌─────────────────────────────────┐
│ 🚀 เวอร์ชันใหม่มาแล้ว! ✨       │
│                                 │
│ จะอัปเดตอัตโนมัติใน 15 วินาที   │ ← Countdown
│ เคลื่อนเมาส์เพื่อยกเลิก          │
│                                 │
│ [Progress Bar: 50%]             │
│                                 │
│ [อัปเดตเลย] [ภายหลัง]          │
└─────────────────────────────────┘
```

---

## 👆 Strategy 3: Manual (เดิม - ให้ User กดเอง ⭐⭐⭐)

**ทำงาน:** **แสดง prompt** ให้ user กดเอง (ไม่ auto)

### ✅ ข้อดี
- 👤 User มีอำนาจเต็ม
- 💯 ปลอดภัยที่สุด - ไม่มี surprise reload
- 📱 เหมาะกับ app ที่มีข้อมูลสำคัญ

### ❌ ข้อเสีย
- User อาจไม่กดอัปเดต → ใช้ version เก่านาน
- ต้องกดปุ่ม (ขี้เกียจ)

### 📝 วิธีใช้

```tsx
<UpdatePromptAuto strategy="manual" />

{/* หรือใช้ตัวเดิม */}
<UpdatePrompt />
```

---

## ⚡ Strategy 4: Immediate (ไม่แนะนำ! ⭐)

**ทำงาน:** **Reload ทันที** เมื่อตรวจจับ update

### ✅ ข้อดี
- ⚡ Update เร็วที่สุด

### ❌ ข้อเสีย (เยอะมาก!)
- ❌ UX แย่สุด - reload กลางๆ
- 💥 Data หายแน่นอน
- 😱 User งง - เกิดอะไรขึ้น?
- 🚫 Against best practices

### 📝 วิธีใช้ (ไม่แนะนำนะ)

```tsx
<UpdatePromptAuto strategy="immediate" />
```

### ⚠️ ใช้เมื่อไหร่?
- Admin dashboard ที่ไม่มี user input
- Landing page ที่ไม่มีอะไรสำคัญ
- Internal tools

---

## 🎯 คำแนะนำ

| Use Case | Strategy | เหตุผล |
|----------|----------|--------|
| **Social Media** (VOOBIZE) | `navigate` 🏆 | UX ดีที่สุด, smooth, ไม่รบกวน |
| **News/Blog** | `idle` | อ่านเสร็จแล้วมักไม่ทำอะไร |
| **E-commerce** | `manual` | ตะกร้าสินค้าต้องปลอดภัย |
| **Admin Panel** | `immediate` | ไม่สำคัญ update เร็วสำคัญกว่า |

---

## 🛠️ การติดตั้ง

### Step 1: เลือก Strategy

```tsx
// components/layouts/AppLayout.tsx
import { UpdatePromptAuto } from "@/components/pwa/UpdatePromptAuto";

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  return (
    <>
      <SidebarProvider>
        {/* ... */}
      </SidebarProvider>

      <MobileBottomNav />

      {/* เลือกอย่างใดอย่างหนึ่ง */}

      {/* Option 1: Navigate (แนะนำ) */}
      <UpdatePromptAuto strategy="navigate" />

      {/* Option 2: Idle */}
      <UpdatePromptAuto
        strategy="idle"
        idleTimeout={30}
        showCountdown={true}
      />

      {/* Option 3: Manual */}
      <UpdatePromptAuto strategy="manual" />

      {/* Option 4: Immediate (ไม่แนะนำ) */}
      <UpdatePromptAuto strategy="immediate" />
    </>
  );
}
```

### Step 2: ลบ UpdatePrompt เดิม

```tsx
// ลบบรรทัดนี้:
// import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
// <UpdatePrompt />
```

### Step 3: Test

```bash
# 1. Deploy version ใหม่
npm run deploy

# 2. เปิดเว็บ
# 3. ทดสอบตาม strategy ที่เลือก
```

---

## 🎨 Customization

### ปรับเวลา Idle

```tsx
<UpdatePromptAuto
  strategy="idle"
  idleTimeout={60}  // เปลี่ยนเป็น 60 วินาที
/>
```

### ซ่อน Countdown

```tsx
<UpdatePromptAuto
  strategy="idle"
  showCountdown={false}  // ไม่แสดงเวลานับถอยหลัง
/>
```

---

## 📊 Comparison Table

| Feature | Immediate | Idle | Navigate | Manual |
|---------|-----------|------|----------|--------|
| **UX Score** | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Safety** | ❌ | ✅ | ✅ | ✅✅ |
| **Speed** | ✅✅✅ | ✅✅ | ✅ | ❌ |
| **Data Loss Risk** | 🔴 High | 🟡 Low | 🟢 None | 🟢 None |
| **User Control** | ❌ | ⚠️ | ⚠️ | ✅ |
| **Recommended** | ❌ | ✅ | ✅✅ | ✅ |

---

## 🎯 สรุป

### สำหรับ VOOBIZE (Social Media):

**ผมแนะนำ:** `strategy="navigate"` 🏆

**เหตุผล:**
- ✅ User ใช้งานไม่ติด (กดลิงก์บ่อย)
- ✅ ไม่ทำให้ comment/post draft หาย
- ✅ Update smooth ที่สุด
- ✅ เหมือน Facebook, Instagram ใช้

### วิธีติดตั้ง:

```tsx
// Replace:
<UpdatePrompt />

// With:
<UpdatePromptAuto strategy="navigate" />
```

**Done!** ✨

---

## 💡 Tips

1. **Production:** ใช้ `navigate` หรือ `idle`
2. **Development:** ใช้ `manual` เพื่อ test ง่าย
3. **Admin:** ใช้ `immediate` ได้
4. **Testing:** เปลี่ยน strategy ได้ตลอด ไม่ต้อง rebuild

---

**Last Updated:** 2025-01-06
**Version:** 1.0.0
**Recommended:** `strategy="navigate"` ⭐
