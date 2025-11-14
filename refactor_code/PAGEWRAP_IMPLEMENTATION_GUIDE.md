# PageWrap Implementation Guide

## ⚠️ สำคัญมาก: หลักการห้าม wrap ทั้ง page

### ❌ ผิด - Wrap ทั้ง page (PostCard จะมี padding ซ้ายขวา)
```jsx
<PageWrap>
  <h1>หน้าหลัก</h1>
  <PostFeed /> {/* PostCard จะมี padding ผิด! */}
</PageWrap>
```

### ✅ ถูก - Wrap แยกส่วน (PostCard edge-to-edge)
```jsx
<>
  <PageWrap>
    <h1>หน้าหลัก</h1>
    <Button>สร้างโพสต์</Button>
  </PageWrap>

  <PostFeed /> {/* PostCard ไม่มี padding - edge-to-edge */}
</>
```

---

## 📋 Implementation Checklist

### Priority 1: Pages ที่ต้องแก้เร็ว (มี PostCard)

#### ✅ 1. app/page.tsx (Home Feed)
**Elements ที่ต้อง wrap:**
- Header (h1, p, Create Post button)

**Elements ที่ห้าม wrap:**
- `<InfinitePostFeed />` - PostCard edge-to-edge

**Code:**
```jsx
// Wrap header only
<PageWrap>
  <div className="flex items-center justify-between">
    <div>
      <h1>เรื่องชาวบ้าน</h1>
      <p>เรื่องที่ใครๆก็อยากใส่ใจ</p>
    </div>
    <Button>สร้างโพสต์</Button>
  </div>
</PageWrap>

{/* NO WRAP - PostCard edge-to-edge */}
<InfinitePostFeed sortBy={sortBy} />
```

---

#### ✅ 2. app/post/[id]/PostDetailContent.tsx
**Elements ที่ต้อง wrap:**
- Back button
- Comments section (title, form, tree)

**Elements ที่ห้าม wrap:**
- `<PostCard />` - edge-to-edge

**Code:**
```jsx
<PageWrap>
  <Button onClick={() => router.back()}>
    <ArrowLeft /> กลับ
  </Button>
</PageWrap>

{/* NO WRAP - PostCard edge-to-edge */}
<PostCard post={post} disableNavigation />

<PageWrap>
  <div className="bg-card border rounded-lg p-6">
    <h2>ความคิดเห็น ({totalCommentCount})</h2>
    <CommentForm />
    <CommentTree />
  </div>
</PageWrap>
```

---

#### ✅ 3. app/my-posts/page.tsx
**Elements ที่ต้อง wrap:**
- Header (icon, title, Create Post button)

**Elements ที่ห้าม wrap:**
- `<PostFeed posts={myPosts} />` - edge-to-edge

**Code:**
```jsx
<PageWrap>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <FileText />
      <div>
        <h1>โพสต์ของฉัน</h1>
        <p>{myPosts.length} โพสต์</p>
      </div>
    </div>
    <Button>สร้างโพสต์</Button>
  </div>
</PageWrap>

{/* NO WRAP */}
{isLoading ? (
  <PageWrap><Card>Loading...</Card></PageWrap>
) : myPosts.length > 0 ? (
  <PostFeed posts={myPosts} /> {/* Edge-to-edge */}
) : (
  <PageWrap><Card>Empty...</Card></PageWrap>
)}
```

---

#### ✅ 4. app/saved/page.tsx
**เหมือน my-posts เป๊ะ** - Header wrap, PostFeed ไม่ wrap

---

#### ✅ 5. app/search/page.tsx
**Elements ที่ต้อง wrap:**
- Header (h1, p)
- Search form
- Tabs header
- User results tab

**Elements ที่ห้าม wrap:**
- Posts tab: `<PostFeed />` - edge-to-edge

**Code:**
```jsx
<PageWrap>
  <h1>ค้นหา</h1>
  <p>ค้นหาโพสต์และผู้ใช้</p>
  <form>
    <Input />
    <Button>ค้นหา</Button>
  </form>
</PageWrap>

<Tabs>
  <PageWrap>
    <TabsList>
      <TabsTrigger value="posts">โพสต์</TabsTrigger>
      <TabsTrigger value="users">ผู้ใช้</TabsTrigger>
    </TabsList>
  </PageWrap>

  <TabsContent value="posts">
    {/* NO WRAP - PostFeed edge-to-edge */}
    {filteredPosts.length > 0 ? (
      <PostFeed posts={filteredPosts} />
    ) : (
      <PageWrap><Card>ไม่พบ</Card></PageWrap>
    )}
  </TabsContent>

  <TabsContent value="users">
    <PageWrap>
      <div className="space-y-4">
        {filteredUsers.map(user => <UserCard />)}
      </div>
    </PageWrap>
  </TabsContent>
</Tabs>
```

---

#### ✅ 6. app/tag/[tagName]/page.tsx
**Elements ที่ต้อง wrap:**
- Back button
- Header (icon, title, Create Post button)
- Sort tabs

**Elements ที่ห้าม wrap:**
- `<InfinitePostFeed />` - edge-to-edge

**Code:**
```jsx
<PageWrap>
  <Button onClick={() => router.back()}>
    <ArrowLeft /> กลับ
  </Button>

  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <Hash />
      <h1>#{tagName}</h1>
    </div>
    <Button>สร้างโพสต์</Button>
  </div>

  <Tabs value={sortBy}>
    <TabsList>
      <TabsTrigger value="hot">ยอดนิยม</TabsTrigger>
      <TabsTrigger value="new">ล่าสุด</TabsTrigger>
    </TabsList>
  </Tabs>
</PageWrap>

{/* NO WRAP */}
<InfinitePostFeed sortBy={sortBy} tagName={tagName} />
```

---

#### ✅ 7. app/profile/[username]/page.tsx
**Elements ที่ต้อง wrap:**
- Profile header (avatar, bio, stats, buttons)
- Tabs header

**Elements ที่ห้าม wrap:**
- Posts tab: `<InfinitePostFeed />` - edge-to-edge
- Comments tab: wrap comments list

**Code:**
```jsx
<PageWrap>
  {/* Profile Header */}
  <div className="flex gap-4">
    <Image /> {/* Avatar */}
    <div>
      <h1>{user.displayName}</h1>
      <p>@{user.username}</p>
      <p>{user.bio}</p>
      <div className="stats">...</div>
      <Button>ติดตาม</Button>
    </div>
  </div>

  {/* Tabs */}
  <Tabs value={activeTab}>
    <TabsList>
      <TabsTrigger value="posts">โพสต์</TabsTrigger>
      <TabsTrigger value="comments">ความคิดเห็น</TabsTrigger>
    </TabsList>
  </Tabs>
</PageWrap>

<TabsContent value="posts">
  {/* NO WRAP - PostFeed edge-to-edge */}
  <InfinitePostFeed userId={user.id} />
</TabsContent>

<TabsContent value="comments">
  <PageWrap>
    <div className="space-y-4">
      {comments.map(c => <ProfileCommentCard />)}
    </div>
  </PageWrap>
</TabsContent>
```

---

### Priority 2: Pages ที่ไม่มี PostCard (ปลอดภัย - wrap ได้ทั้ง page)

#### ✅ 8. app/create-post/page.tsx
**ไม่มี PostCard** → wrap ได้ทั้งหน้า

**Code:**
```jsx
<PageWrap>
  <div>
    <h1>สร้างโพสต์ใหม่</h1>
    <p>แบ่งปันเรื่องราว</p>
  </div>
  <CreatePostForm />
</PageWrap>
```

---

#### ✅ 9. app/edit-post/[id]/page.tsx
**ไม่มี PostCard** → wrap ได้ทั้งหน้า

**Code:**
```jsx
<PageWrap>
  <Card>
    <CardHeader>
      <CardTitle>แก้ไขโพสต์</CardTitle>
    </CardHeader>
    <CardContent>
      <form>
        {/* All form fields */}
      </form>
    </CardContent>
  </Card>
</PageWrap>
```

---

#### ✅ 10. app/profile/edit/page.tsx
**ไม่มี PostCard** → wrap ได้ทั้งหน้า

**Code:**
```jsx
<PageWrap>
  <Card>
    <CardHeader>
      <CardTitle>แก้ไขโปรไฟล์</CardTitle>
    </CardHeader>
    <CardContent>
      <form>
        {/* All form fields */}
      </form>
    </CardContent>
  </Card>
</PageWrap>
```

---

#### ✅ 11. app/notifications/page.tsx
**ไม่มี PostCard** → wrap ได้ทั้งหน้า

**Code:**
```jsx
<PageWrap>
  <div className="flex items-center justify-between">
    <h1>การแจ้งเตือน</h1>
    <Button>Mark All Read</Button>
  </div>

  <Tabs>
    <TabsList>...</TabsList>
    <TabsContent value="all">
      <div className="space-y-2">
        {notifications.map(n => <NotificationCard />)}
      </div>
    </TabsContent>
  </Tabs>
</PageWrap>
```

---

#### ✅ 12. app/profile/[username]/following/page.tsx
**ไม่มี PostCard** → wrap ได้ทั้งหน้า

**Code:**
```jsx
<PageWrap>
  <Button onClick={() => router.back()}>
    <ArrowLeft /> กลับโปรไฟล์
  </Button>

  <div className="flex items-center gap-3">
    <UserPlus />
    <h1>{user.displayName} กำลังติดตาม</h1>
  </div>

  <div className="space-y-3">
    {following.map(u => <UserCard />)}
  </div>
</PageWrap>
```

---

#### ✅ 13. app/profile/[username]/followers/page.tsx
**เหมือน following เป๊ะ** - wrap ได้ทั้งหน้า

---

### Priority 3: Pages ที่ไม่ต้องแก้

#### ✅ 14-15. app/chat/**
**ใช้ ChatLayout** - ไม่ใช้ AppLayout → ไม่ต้องแก้

---

## 🎯 Quick Reference

### ✅ ปลอดภัย - Wrap ทั้งหน้าได้
- create-post
- edit-post
- profile/edit
- notifications
- profile/[username]/following
- profile/[username]/followers

### ⚠️ ระวัง - Wrap แยกส่วน (มี PostCard)
- page.tsx (home)
- post/[id]
- my-posts
- saved
- search
- tag/[tagName]
- profile/[username]

### ❌ ไม่ต้องแก้
- chat/**

---

## 📝 Implementation Order

### Step 1: Pages ที่ปลอดภัย (6 pages)
1. create-post
2. edit-post
3. profile/edit
4. notifications
5. profile/[username]/following
6. profile/[username]/followers

### Step 2: Pages ที่มี PostCard (7 pages)
7. page.tsx (home)
8. post/[id]
9. my-posts
10. saved
11. search
12. tag/[tagName]
13. profile/[username]

---

## 🔍 Testing Checklist

### Mobile Testing (< 768px)
- [ ] PostCard edge-to-edge (ไม่มี padding ซ้ายขวา)
- [ ] Buttons/Forms มี padding (p-4)
- [ ] Headers มี padding (p-4)

### Desktop Testing (≥ 1024px)
- [ ] PostCard ไม่เปลี่ยน
- [ ] Buttons/Forms ไม่มี padding เพิ่ม (md:p-0)
- [ ] Headers ไม่มี padding เพิ่ม (md:p-0)

### Visual Check
- [ ] ไม่มี horizontal scroll bar
- [ ] PostCard ติดขอบจอซ้ายขวา (mobile)
- [ ] Text/Buttons อ่านง่าย ไม่ติดขอบ (mobile)
