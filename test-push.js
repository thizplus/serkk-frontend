/**
 * Test Push Notification Script
 *
 * วิธีใช้:
 * 1. Subscribe push notification ในเว็บก่อน
 * 2. เปิด DevTools Console → Copy subscription object
 * 3. แทนค่า subscription ด้านล่าง
 * 4. รัน: node test-push.js
 */

const webpush = require('web-push');

// VAPID Keys (ต้องตรงกับ backend)
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEZ3oy9yXimkiImDecQs-GC5rr9FMp9Y_u0AfmpYbpm3f9lB0pgQ-VdAeI10iPrN1zP6L_DLLnpur1lwzuQhFDo',
  privateKey: process.env.VAPID_PRIVATE_KEY || '7iN1LJaE-x7-X6EbL92mVUErWm4fBrpkbXkDJwYxEKA',
};

// ตั้งค่า VAPID
webpush.setVapidDetails(
  'mailto:admin@voobize.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// ⚠️ แทนค่าด้วย subscription ที่ได้จาก browser
// วิธีดู: DevTools Console → พิมพ์ `navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription().then(sub => console.log(JSON.stringify(sub))))`
const subscription = {
  endpoint: 'PASTE_YOUR_ENDPOINT_HERE',
  keys: {
    p256dh: 'PASTE_YOUR_P256DH_KEY_HERE',
    auth: 'PASTE_YOUR_AUTH_KEY_HERE',
  }
};

// Notification payload
const payload = JSON.stringify({
  title: '🧪 Test Notification',
  body: 'นี่คือการทดสอบ push notification!',
  icon: '/icon-white.svg',
  url: '/notifications',
  tag: 'test-notification',
  data: {
    testId: Date.now(),
  }
});

// ส่ง push notification
console.log('🚀 Sending test push notification...');
console.log('📦 Payload:', payload);

webpush.sendNotification(subscription, payload)
  .then((response) => {
    console.log('✅ Push notification sent successfully!');
    console.log('📊 Response:', response.statusCode, response.statusMessage);
  })
  .catch((error) => {
    console.error('❌ Error sending push notification:', error);
    if (error.statusCode) {
      console.error('Status:', error.statusCode);
      console.error('Message:', error.body);
    }
  });
