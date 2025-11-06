# 🧪 วิธีทดสอบ Push Notification

## ข้อกำหนดเบื้องต้น

- ✅ ต้อง subscribe push notification แล้ว (กดปุ่ม "เปิดการแจ้งเตือน" ในหน้า `/notifications`)
- ✅ Browser ต้องอนุญาต notification permission
- ✅ Service Worker ต้องลงทะเบียนแล้ว

---

## 🎯 วิธีที่ 1: ใช้ DevTools Console (ง่ายที่สุด)

### ขั้นตอน:

1. **เปิดหน้า `/notifications`** แล้วกดปุ่ม **"เปิดการแจ้งเตือน"**

2. **เปิด DevTools Console** (`F12`)

3. **ดึง subscription object:**
   ```javascript
   navigator.serviceWorker.ready
     .then(reg => reg.pushManager.getSubscription())
     .then(sub => {
       console.log('Subscription:', sub);
       console.log('Endpoint:', sub.endpoint);
       console.log('Keys:', sub.toJSON().keys);

       // Copy subscription เพื่อใช้ในการทดสอบ
       copy(JSON.stringify({
         endpoint: sub.endpoint,
         keys: sub.toJSON().keys
       }, null, 2));
       console.log('✅ Subscription copied to clipboard!');
     });
   ```

4. **ไปที่ Backend** แล้วใช้ subscription ที่ได้เพื่อส่ง test notification

---

## 🎯 วิธีที่ 2: ใช้ web-push CLI

### ติดตั้ง web-push:

```bash
npm install -g web-push
```

### ส่ง Test Notification:

1. **ดึง subscription จาก Console:**
   ```javascript
   navigator.serviceWorker.ready
     .then(reg => reg.pushManager.getSubscription())
     .then(sub => console.log(JSON.stringify(sub)));
   ```

2. **ส่ง notification ด้วย web-push CLI:**
   ```bash
   web-push send-notification \
     --endpoint="https://fcm.googleapis.com/fcm/send/..." \
     --key="xxxxxx" \
     --auth="yyyyyy" \
     --vapid-subject="mailto:admin@voobize.com" \
     --vapid-pubkey="YOUR_PUBLIC_KEY" \
     --vapid-pvtkey="YOUR_PRIVATE_KEY" \
     --payload='{"title":"Test","body":"Hello!"}'
   ```

---

## 🎯 วิธีที่ 3: ใช้ Node.js Script (แนะนำสำหรับ Dev)

### ติดตั้ง dependencies:

```bash
npm install web-push --save-dev
```

### แก้ไข `test-push.js`:

1. **ดึง subscription จาก Console** (ตามวิธีที่ 1)

2. **แทนค่าใน `test-push.js`:**
   ```javascript
   const subscription = {
     endpoint: 'PASTE_YOUR_ENDPOINT_HERE',
     keys: {
       p256dh: 'PASTE_P256DH_HERE',
       auth: 'PASTE_AUTH_HERE'
     }
   };
   ```

3. **ตั้งค่า VAPID keys ใน `.env.local`:**
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
   VAPID_PRIVATE_KEY=your_private_key
   ```

4. **รัน script:**
   ```bash
   node test-push.js
   ```

---

## 🎯 วิธีที่ 4: ใช้ Backend API (Production-like)

ถ้า Backend มี test endpoint เช่น:

```bash
POST http://localhost:8080/api/v1/push/test
Authorization: Bearer YOUR_TOKEN

{
  "userId": "your-user-id",
  "title": "Test Notification",
  "body": "Testing push notification",
  "url": "/notifications"
}
```

สามารถเรียกผ่าน:

### cURL:
```bash
curl -X POST http://localhost:8080/api/v1/push/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "title": "🧪 Test Push",
    "body": "This is a test notification",
    "url": "/notifications"
  }'
```

### หรือ Postman/Insomnia

---

## 🔍 ตรวจสอบว่าทำงานหรือไม่

### 1. ดู Console Logs:

เปิด DevTools Console → ดู Service Worker logs:
```
[Service Worker] Push notification received
[Service Worker] Notification clicked (เมื่อคลิกที่ notification)
```

### 2. ดู Service Worker Status:

```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('Service Worker Ready:', reg.active.state);
});
```

### 3. ตรวจสอบ Permission:

```javascript
console.log('Notification Permission:', Notification.permission);
// ควรได้ "granted"
```

### 4. ทดสอบ Show Notification โดยตรง:

```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test Title', {
    body: 'Test Body',
    icon: '/logo.png',
    tag: 'test',
  });
});
```

---

## ❗ Troubleshooting

### ไม่เห็น Notification:

1. ✅ ตรวจสอบ browser permission (ต้อง "granted")
2. ✅ ตรวจสอบ Service Worker ลงทะเบียนแล้ว
3. ✅ ตรวจสอบ Focus Assist/Do Not Disturb ของ OS
4. ✅ ลองใช้ Incognito/Private mode

### Push Event ไม่ทำงาน:

1. ✅ ตรวจสอบ VAPID keys ต้องตรงกันระหว่าง frontend และ backend
2. ✅ ตรวจสอบ subscription ยังไม่หมดอายุ
3. ✅ ตรวจสอบ Service Worker console logs

### Error "Invalid VAPID key":

- ✅ ตรวจสอบ public key ตรงกับที่ใช้ subscribe
- ✅ ตรวจสอบ private key ตรงกับ public key

---

## 📝 Expected Notification Format

Notification ที่ส่งจาก backend ควรมี format:

```json
{
  "title": "VOOBIZE",
  "body": "คุณมีการแจ้งเตือนใหม่",
  "icon": "/logo.png",
  "badge": "/logo.png",
  "tag": "notification-id",
  "url": "/notifications",
  "data": {
    "notificationId": "123",
    "type": "comment"
  }
}
```

Service Worker จะแสดง notification และเปิด URL เมื่อคลิก

---

## 🚀 Quick Test Script

วาง script นี้ใน DevTools Console เพื่อทดสอบทั้งหมดในครั้งเดียว:

```javascript
(async function testPushNotification() {
  console.log('🧪 Testing Push Notification Setup...\n');

  // 1. Check permission
  console.log('1️⃣ Notification Permission:', Notification.permission);
  if (Notification.permission !== 'granted') {
    console.error('❌ Permission not granted!');
    return;
  }

  // 2. Check Service Worker
  const reg = await navigator.serviceWorker.ready;
  console.log('2️⃣ Service Worker:', reg.active.state);

  // 3. Check subscription
  const sub = await reg.pushManager.getSubscription();
  if (!sub) {
    console.error('❌ No subscription found!');
    return;
  }
  console.log('3️⃣ Subscription:', sub.endpoint.substring(0, 50) + '...');

  // 4. Test showing notification
  console.log('4️⃣ Showing test notification...');
  await reg.showNotification('🧪 Test Notification', {
    body: 'If you see this, Service Worker is working!',
    icon: '/logo.png',
    tag: 'test-' + Date.now(),
  });

  console.log('\n✅ All checks passed! Push notification is ready.');
  console.log('\n📋 Subscription object (for backend testing):');
  console.log(JSON.stringify({
    endpoint: sub.endpoint,
    keys: sub.toJSON().keys
  }, null, 2));
})();
```

---

## 📚 อ่านเพิ่มเติม

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push Node.js Library](https://github.com/web-push-libs/web-push)
