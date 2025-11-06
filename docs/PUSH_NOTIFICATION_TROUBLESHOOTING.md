# 🐛 Push Notification Troubleshooting

## ❓ ทำไมส่งบ้าง ไม่ส่งบ้าง?

Push notification อาจจะไม่ส่งเสมอด้วยสาเหตุหลายประการ:

---

## 🔍 สาเหตุหลักๆ

### 1. 🌐 **Browser ปิดไปแล้ว (Desktop)**

| Browser | พฤติกรรมเมื่อปิด |
|---------|-----------------|
| **Chrome/Edge** | ✅ ยังส่งได้ (ถ้า background process ยังทำงาน) |
| **Firefox** | ❌ ส่งไม่ได้ (ต้องเปิด browser ค้างไว้) |
| **Safari** | ⚠️ ส่งได้บ้าง (ขึ้นกับ macOS settings) |

**วิธีแก้:**
- Chrome/Edge: เปิด browser แล้วเลือก "Continue running background apps when Google Chrome is closed"
- Firefox: ต้องเปิด browser ค้างไว้
- **แนะนำ**: ติดตั้ง PWA (Add to Home Screen) → จะทำงานเป็น standalone app

---

### 2. 📱 **Service Worker ไม่ทำงาน**

**สาเหตุ:**
- Service Worker ถูก unregister (เกิดจาก clear cache/data)
- Browser อัปเดตใหม่ แล้ว SW ยังไม่ activate
- SW มี error และ crashed

**วิธีตรวจสอบ:**
```javascript
// เปิด DevTools Console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg?.active?.state);
  console.log('SW URL:', reg?.active?.scriptURL);
});
```

**วิธีแก้:**
1. เปิด DevTools → Application tab → Service Workers
2. เช็คว่ามี Service Worker ลงทะเบียนอยู่หรือไม่
3. ถ้าไม่มี → Refresh page (`Ctrl + Shift + R`)
4. ถ้ามี error → เช็ค Console logs

---

### 3. 🔐 **Subscription หมดอายุหรือถูกลบ**

**สาเหตุ:**
- User clear browser data
- Subscription expiry time ครบแล้ว
- FCM/browser service ลบ subscription (inactive นานเกินไป)

**วิธีตรวจสอบ:**
```javascript
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => {
    if (!sub) {
      console.log('❌ No subscription found!');
    } else {
      console.log('✅ Subscription exists');
      console.log('Expiry:', sub.expirationTime
        ? new Date(sub.expirationTime)
        : 'Never');
    }
  });
```

**วิธีแก้:**
- Subscribe ใหม่อีกครั้ง (กดปุ่ม "เปิดการแจ้งเตือน")
- Backend ควรลบ expired subscriptions (410 Gone) ออกจาก database

---

### 4. 🚫 **Browser/OS Notification Settings**

**สาเหตุ:**
- Windows Focus Assist เปิดอยู่ (Do Not Disturb)
- macOS Do Not Disturb mode
- Browser settings block notifications
- Site-specific notification settings ปิดอยู่

**วิธีตรวจสอบ:**

**Windows:**
1. Settings → System → Focus Assist
2. ตรวจสอบว่าเปิด "Priority only" หรือ "Alarms only" อยู่หรือเปล่า

**macOS:**
1. System Preferences → Notifications
2. เช็คว่า browser มี permission ส่ง notification

**Browser:**
1. Chrome: `chrome://settings/content/notifications`
2. Firefox: `about:preferences#privacy` → Permissions → Notifications
3. เช็คว่า site ของคุณไม่ได้ถูก block

**วิธีแก้:**
- ปิด Focus Assist / Do Not Disturb
- Allow notifications ใน browser settings
- Allow notifications สำหรับ site เฉพาะ

---

### 5. 🌐 **Network/Connection Issues**

**สาเหตุ:**
- ไม่มี internet connection
- Firewall block FCM endpoints
- VPN/Proxy มีปัญหา

**วิธีตรวจสอบ:**
```javascript
// ทดสอบส่ง notification ทันที
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test', {
    body: 'If you see this, SW works!',
  });
});
```

ถ้า**เห็น notification** = Service Worker ทำงาน แต่ถ้า push ไม่มา = ปัญหาที่ backend/network

**วิธีแก้:**
- ตรวจสอบ internet connection
- ตรวจสอบ firewall settings
- ลอง disable VPN/Proxy ชั่วคราว

---

### 6. 🔧 **Backend ไม่ส่ง Push**

**สาเหตุ:**
- Backend logic มีเงื่อนไข (เช่น ส่งเฉพาะเมื่อ offline)
- Backend error (VAPID key ผิด, subscription invalid)
- Backend ไม่ได้ query subscriptions ของ user
- Rate limiting

**วิธีตรวจสอบ:**
- เช็ค backend logs ว่าพยายามส่ง push หรือไม่
- ทดสอบด้วย test endpoint (ถ้ามี)
- ตรวจสอบ database ว่ามี subscription หรือเปล่า

**วิธีแก้:**
- ตรวจสอบ backend code logic
- เช็ค VAPID keys ตรงกันระหว่าง frontend/backend
- เพิ่ม error logging ใน backend

---

### 7. ⏱️ **Timing Issues**

**สาเหตุ:**
- Push notification ส่งไปแต่ user ไม่เห็น (notification หาย)
- TTL (Time-To-Live) หมดอายุก่อนจะส่งถึง
- Browser ยังไม่ได้ sync กับ FCM server

**วิธีแก้:**
- เพิ่ม TTL ใน backend (30-60 seconds)
- ตั้ง `requireInteraction: true` ใน notification options (notification จะไม่หายเอง)

```javascript
// ใน service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      requireInteraction: true, // 👈 notification จะไม่หายจนกว่าจะคลิก
      tag: data.tag,
    })
  );
});
```

---

### 8. 🔄 **Multiple Tabs/Devices**

**สาเหตุ:**
- เปิดหลาย tabs → push อาจจะไปที่ tab อื่น
- มีหลาย devices subscribe → push ไปที่ device อื่น

**วิธีแก้:**
- ใช้ `tag` property ใน notification → จะ merge ซ้ำกัน
- ตรวจสอบว่ามีกี่ subscriptions ใน database

```sql
-- ตรวจสอบ subscriptions ของ user
SELECT * FROM push_subscriptions WHERE user_id = 'your-user-id';
```

---

## 🧪 Debug Checklist

ใช้ checklist นี้เพื่อ debug ปัญหา:

### Frontend:
- [ ] ✅ Browser support push notifications
- [ ] ✅ Notification permission = "granted"
- [ ] ✅ Service Worker registered และ active
- [ ] ✅ Push subscription exists
- [ ] ✅ Subscription ยังไม่หมดอายุ
- [ ] ✅ Browser ไม่ได้ block notifications
- [ ] ✅ OS ไม่ได้เปิด Do Not Disturb

### Backend:
- [ ] ✅ Subscription บันทึกใน database
- [ ] ✅ VAPID keys ถูกต้อง
- [ ] ✅ Backend พยายามส่ง push (เช็ค logs)
- [ ] ✅ ไม่มี error จาก FCM/push service
- [ ] ✅ TTL ตั้งค่าเหมาะสม (30-60s)

### Network:
- [ ] ✅ Internet connection stable
- [ ] ✅ ไม่มี firewall block
- [ ] ✅ FCM endpoints accessible

---

## 🛠️ Debug Tools

### 1. ใช้ Debug Panel Component:

```tsx
import { PushDebugPanel } from "@/components/pwa/PushDebugPanel";

// เพิ่มใน page (development only)
{process.env.NODE_ENV === 'development' && <PushDebugPanel />}
```

### 2. Console Commands:

```javascript
// ตรวจสอบ Service Worker
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Registration:', reg);
  console.log('Active:', reg?.active);
  console.log('Waiting:', reg?.waiting);
  console.log('Installing:', reg?.installing);
});

// ตรวจสอบ Subscription
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log('Subscription:', sub));

// ทดสอบแสดง notification
navigator.serviceWorker.ready.then(reg => {
  reg.showNotification('Test', { body: 'Testing...' });
});

// ตรวจสอบ permission
console.log('Permission:', Notification.permission);
```

### 3. Chrome DevTools:

1. **Application tab** → Service Workers
   - เช็ค status (activated/waiting/installing)
   - ดู errors ใน console

2. **Application tab** → Storage → IndexedDB
   - เช็คว่ามีข้อมูล cache อะไรบ้าง

3. **Network tab**
   - Filter by "fcm" or "push"
   - ดู requests ที่ไปหา FCM

---

## 💡 Best Practices

### 1. Handle Subscription Expiry:

```javascript
// ตรวจสอบและ re-subscribe อัตโนมัติ
useEffect(() => {
  const checkSubscription = async () => {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (!sub) {
      console.log('No subscription - need to re-subscribe');
      // Auto re-subscribe
      // ... subscribe logic ...
    }
  };

  // เช็คทุก 1 ชั่วโมง
  const interval = setInterval(checkSubscription, 60 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### 2. Backend Error Handling:

```go
// Go example
resp, err := webpush.SendNotification(payload, subscription, options)
if err != nil {
    log.Printf("Push error: %v", err)
    return err
}

// ลบ expired subscriptions
if resp.StatusCode == 410 || resp.StatusCode == 404 {
    log.Printf("Removing expired subscription: %s", subscription.Endpoint)
    DeleteSubscription(subscription.ID)
}
```

### 3. Add Retry Logic:

```go
func SendPushWithRetry(sub Subscription, payload []byte, maxRetries int) error {
    for i := 0; i < maxRetries; i++ {
        resp, err := webpush.SendNotification(payload, sub, options)

        if err == nil && resp.StatusCode == 201 {
            return nil // Success
        }

        if resp.StatusCode == 410 || resp.StatusCode == 404 {
            return err // Don't retry for expired subscriptions
        }

        // Wait before retry
        time.Sleep(time.Second * time.Duration(i+1))
    }
    return errors.New("max retries exceeded")
}
```

---

## 📊 Monitoring

เพื่อป้องกันปัญหา ควรมี monitoring:

1. **Log push success rate:**
   ```
   Sent: 100 pushes
   Success: 85
   Failed: 10 (expired)
   Error: 5 (network)
   Success Rate: 85%
   ```

2. **Track active subscriptions:**
   ```sql
   SELECT COUNT(*) FROM push_subscriptions WHERE updated_at > NOW() - INTERVAL '30 days';
   ```

3. **Alert on high failure rate:**
   - ถ้า failure rate > 20% → ส่ง alert
   - ตรวจสอบ VAPID keys, FCM status, network

---

## 🎯 Quick Fixes

### ปัญหา: ไม่เห็น notification เลย
**แก้:**
1. เช็ค permission: `Notification.permission === "granted"`
2. เช็ค Do Not Disturb ปิดหรือยัง
3. ทดสอบ `reg.showNotification('Test', {body: 'Test'})`

### ปัญหา: บางครั้งได้ บางครั้งไม่ได้
**แก้:**
1. ตรวจสอบ browser ปิดหรือยัง (desktop)
2. เช็ค backend logs ว่าส่งจริงทุกครั้งหรือเปล่า
3. เช็ค network/firewall

### ปัญหา: Mobile ไม่ได้รับเลย
**แก้:**
1. ติดตั้ง PWA ที่ home screen
2. เช็ค app-level notification settings
3. Android: เช็ค battery optimization settings

---

## 📚 อ่านเพิ่มเติม

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
