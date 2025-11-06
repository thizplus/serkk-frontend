# Backend Push Notification Integration

## 📋 Overview

เมื่อ user ได้รับการกระทำต่างๆ (เช่น มีคนตอบคอมเมนต์, โหวต, follow) backend ต้องส่ง push notification ไปหาพวกเขา

---

## 🔄 Flow การทำงาน

```
1. User A ตอบคอมเมนต์ของ User B
   ↓
2. Backend สร้าง notification record ใน database
   ↓
3. Backend ตรวจสอบว่า User B ออนไลน์หรือไม่
   ├─ ถ้าออนไลน์ → ส่งผ่าน WebSocket
   └─ ถ้าออฟไลน์ → ดำเนินการต่อ
   ↓
4. Backend ดึง push_subscriptions ของ User B
   ↓
5. ส่ง push notification ไปยังทุก subscriptions
   ↓
6. User B ได้รับ notification (แม้ว่าจะปิด tab/browser)
```

---

## 🛠️ Implementation (Go Example)

### 1. ติดตั้ง web-push library:

```bash
go get github.com/SherClockHolmes/webpush-go
```

### 2. สร้าง Notification Service:

```go
// internal/notification/push_service.go
package notification

import (
    "context"
    "encoding/json"
    "log"
    "os"

    webpush "github.com/SherClockHolmes/webpush-go"
)

type PushNotificationService struct {
    subscriptionRepo SubscriptionRepository
    vapidPublicKey   string
    vapidPrivateKey  string
    vapidSubject     string
}

func NewPushNotificationService(repo SubscriptionRepository) *PushNotificationService {
    return &PushNotificationService{
        subscriptionRepo: repo,
        vapidPublicKey:   os.Getenv("VAPID_PUBLIC_KEY"),
        vapidPrivateKey:  os.Getenv("VAPID_PRIVATE_KEY"),
        vapidSubject:     os.Getenv("VAPID_SUBJECT"), // mailto:admin@voobize.com
    }
}

// NotificationPayload คือ payload ที่ส่งไปยัง frontend
type NotificationPayload struct {
    Title string                 `json:"title"`
    Body  string                 `json:"body"`
    Icon  string                 `json:"icon"`
    Badge string                 `json:"badge,omitempty"`
    Tag   string                 `json:"tag,omitempty"`
    URL   string                 `json:"url,omitempty"`
    Data  map[string]interface{} `json:"data,omitempty"`
}

// SendPushToUser ส่ง push notification ไปยัง user
func (s *PushNotificationService) SendPushToUser(
    ctx context.Context,
    userID string,
    payload NotificationPayload,
) error {
    // 1. ดึง subscriptions ของ user
    subscriptions, err := s.subscriptionRepo.GetByUserID(ctx, userID)
    if err != nil {
        return err
    }

    if len(subscriptions) == 0 {
        log.Printf("📭 No push subscriptions for user %s", userID)
        return nil
    }

    // 2. แปลง payload เป็น JSON
    payloadJSON, err := json.Marshal(payload)
    if err != nil {
        return err
    }

    // 3. ส่ง push notification ไปยังทุก subscriptions
    var lastError error
    successCount := 0

    for _, sub := range subscriptions {
        err := s.sendPush(sub, payloadJSON)
        if err != nil {
            log.Printf("❌ Failed to send push to %s: %v", sub.Endpoint[:50], err)
            lastError = err

            // ถ้า subscription หมดอายุ (410 Gone) ลบออก
            if isSubscriptionExpired(err) {
                s.subscriptionRepo.Delete(ctx, sub.ID)
            }
        } else {
            successCount++
        }
    }

    log.Printf("✅ Sent push to %d/%d subscriptions for user %s",
        successCount, len(subscriptions), userID)

    return lastError
}

// sendPush ส่ง push notification ไปยัง subscription เดียว
func (s *PushNotificationService) sendPush(
    subscription PushSubscription,
    payload []byte,
) error {
    // สร้าง webpush subscription
    wpSub := &webpush.Subscription{
        Endpoint: subscription.Endpoint,
        Keys: webpush.Keys{
            P256dh: subscription.P256dh,
            Auth:   subscription.Auth,
        },
    }

    // ส่ง notification
    resp, err := webpush.SendNotification(payload, wpSub, &webpush.Options{
        Subscriber:      s.vapidSubject,
        VAPIDPublicKey:  s.vapidPublicKey,
        VAPIDPrivateKey: s.vapidPrivateKey,
        TTL:             30, // 30 seconds
    })

    if err != nil {
        return err
    }
    defer resp.Body.Close()

    // เช็ค status code
    if resp.StatusCode == 201 {
        return nil // Success
    }

    return &PushError{
        StatusCode: resp.StatusCode,
        Message:    resp.Status,
    }
}

func isSubscriptionExpired(err error) bool {
    if pushErr, ok := err.(*PushError); ok {
        return pushErr.StatusCode == 410 || pushErr.StatusCode == 404
    }
    return false
}

type PushError struct {
    StatusCode int
    Message    string
}

func (e *PushError) Error() string {
    return e.Message
}
```

---

### 3. ใช้งานใน Comment Handler:

```go
// internal/handler/comment_handler.go

func (h *CommentHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
    // ... สร้าง comment ...

    // 1. สร้าง notification ใน database
    notification := &models.Notification{
        UserID:    post.AuthorID, // เจ้าของโพสต์
        Type:      "reply",
        Message:   fmt.Sprintf("%s ตอบคอมเมนต์ของคุณ", currentUser.DisplayName),
        PostID:    &post.ID,
        CommentID: &comment.ID,
        SenderID:  &currentUser.ID,
        Link:      fmt.Sprintf("/post/%s#comment-%s", post.ID, comment.ID),
        IsRead:    false,
    }

    err = h.notificationRepo.Create(r.Context(), notification)
    if err != nil {
        log.Printf("Failed to create notification: %v", err)
    }

    // 2. ส่ง WebSocket (ถ้า user ออนไลน์)
    if h.websocketService.IsUserOnline(post.AuthorID) {
        h.websocketService.SendToUser(post.AuthorID, map[string]interface{}{
            "type":         "notification",
            "notification": notification,
        })
    }

    // 3. ส่ง Push Notification (ถ้า user ออฟไลน์หรือปิด tab)
    go func() {
        // ทำแบบ async เพื่อไม่ให้ blocking response
        ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
        defer cancel()

        payload := notification.NotificationPayload{
            Title: "VOOBIZE",
            Body:  notification.Message,
            Icon:  "/logo.png",
            Badge: "/logo.png",
            Tag:   fmt.Sprintf("notification-%s", notification.ID),
            URL:   notification.Link,
            Data: map[string]interface{}{
                "notificationId": notification.ID,
                "type":           notification.Type,
            },
        }

        err := h.pushService.SendPushToUser(ctx, post.AuthorID, payload)
        if err != nil {
            log.Printf("Failed to send push notification: %v", err)
        }
    }()

    // Return success response
    respondJSON(w, http.StatusCreated, comment)
}
```

---

### 4. ใช้กับ events อื่นๆ:

```go
// Vote notification
func (h *VoteHandler) CreateVote(w http.ResponseWriter, r *http.Request) {
    // ... สร้าง vote ...

    // ส่ง notification
    go h.sendVoteNotification(post.AuthorID, currentUser, post)
}

// Follow notification
func (h *FollowHandler) Follow(w http.ResponseWriter, r *http.Request) {
    // ... follow user ...

    // ส่ง notification
    go h.sendFollowNotification(targetUserID, currentUser)
}

// Mention notification
func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
    // ... สร้างโพสต์ ...

    // หา mentions ใน content (@username)
    mentions := extractMentions(post.Content)
    for _, username := range mentions {
        user := h.userRepo.GetByUsername(r.Context(), username)
        if user != nil {
            go h.sendMentionNotification(user.ID, currentUser, post)
        }
    }
}
```

---

## 📊 Database Schema

```sql
-- ตรวจสอบว่ามี unique constraint แล้ว
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'push_subscriptions'::regclass;

-- ถ้ายังไม่มี ให้เพิ่ม
ALTER TABLE push_subscriptions
ADD CONSTRAINT unique_user_endpoint UNIQUE (user_id, endpoint);

-- Index สำหรับ query subscriptions by user_id
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
ON push_subscriptions(user_id);
```

---

## 🧪 ทดสอบ Backend

### สร้าง Test Endpoint:

```go
// internal/handler/push_handler.go

// TestPush ส่ง test push notification (development only)
func (h *PushHandler) TestPush(w http.ResponseWriter, r *http.Request) {
    // ดึง userID จาก auth token
    userID := r.Context().Value("userID").(string)

    payload := notification.NotificationPayload{
        Title: "🧪 Test Push Notification",
        Body:  "นี่คือการทดสอบจาก backend!",
        Icon:  "/logo.png",
        URL:   "/notifications",
        Data: map[string]interface{}{
            "testId": time.Now().Unix(),
        },
    }

    err := h.pushService.SendPushToUser(r.Context(), userID, payload)
    if err != nil {
        respondError(w, http.StatusInternalServerError, "Failed to send push", err)
        return
    }

    respondJSON(w, http.StatusOK, map[string]interface{}{
        "success": true,
        "message": "Test push notification sent",
    })
}
```

### ทดสอบด้วย cURL:

```bash
curl -X POST http://localhost:8080/api/v1/push/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## ⚙️ Environment Variables

ใน backend `.env`:

```env
# VAPID Keys (ต้องตรงกับ frontend)
VAPID_PUBLIC_KEY=BIC9GBiayeWgHZXvxam9S1G_xCR5OYKA0NcfhXGhZ2KA3sNA4Wi5n38QXCUQV_jlN7yTd5bSyBNQe0NispxkKYk
VAPID_PRIVATE_KEY=imjcz4yam3RM1WqztZfrNrXpexrtwudhsS7rs9_Xniw
VAPID_SUBJECT=mailto:admin@voobize.com
```

---

## 🎯 Best Practices

1. **ส่งแบบ Async**: ใช้ goroutines เพื่อไม่ block HTTP response
2. **Handle Expired Subscriptions**: ลบ subscriptions ที่ return 410 Gone
3. **Retry Logic**: พิจารณา retry สำหรับ temporary failures
4. **Rate Limiting**: จำกัดจำนวน push ต่อ user ต่อชั่วโมง
5. **Batch Processing**: ถ้ามี users เยอะ ใช้ worker queue (Redis/RabbitMQ)

---

## 📝 Checklist

- [ ] ติดตั้ง `webpush-go` library
- [ ] เพิ่ม VAPID keys ใน environment variables
- [ ] สร้าง PushNotificationService
- [ ] เพิ่ม push notification ใน comment handler
- [ ] เพิ่ม push notification ใน vote handler
- [ ] เพิ่ม push notification ใน follow handler
- [ ] เพิ่ม test endpoint (development only)
- [ ] ทดสอบส่ง push notification
- [ ] Handle expired subscriptions (410 Gone)

---

## 🐛 Troubleshooting

### Push ไม่ส่ง:

1. ✅ ตรวจสอบ VAPID keys ตรงกันระหว่าง frontend/backend
2. ✅ ตรวจสอบว่ามี subscriptions ใน database
3. ✅ ตรวจสอบ logs ว่ามี error อะไร

### Push ส่งได้บางครั้ง:

1. ✅ ตรวจสอบว่า browser ยังรันอยู่หรือเปล่า (desktop)
2. ✅ ตรวจสอบว่า subscription หมดอายุหรือเปล่า
3. ✅ ตรวจสอบ network connectivity

### 410 Gone Error:

- Subscription หมดอายุ → ลบออกจาก database
- User อาจจะ unsubscribe หรือ clear browser data
