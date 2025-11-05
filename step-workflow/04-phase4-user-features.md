# 👤 Phase 4: User Features

**Duration:** Week 4 (5-7 days)
**Priority:** 🟡 Medium
**Dependencies:** Phase 3 (Social Interactions) must be completed
**Status:** 📝 Planning

---

## 🎯 Objectives

1. Implement user profile pages (view & edit)
2. Create follow/unfollow system
3. Build notifications system
4. Create user-specific feed
5. Show user activity and stats

---

## 📋 Tasks Breakdown

### Step 4.1: User Profile View Page
**Duration:** 2 days
**Files to Modify:**
- [ ] `app/profile/[username]/page.tsx`
- [ ] `components/profile/ProfileHeader.tsx`
- [ ] `components/profile/ProfileTabs.tsx`
- [ ] `components/profile/UserPostList.tsx`
- [ ] `components/profile/UserCommentList.tsx`

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Fetch user profile by username
- [ ] Display user info (avatar, display name, bio, join date)
- [ ] User statistics (posts, comments, karma)
- [ ] Follow/Unfollow button
- [ ] Tabs: Posts, Comments, Saved (if own profile)
- [ ] Post list by user
- [ ] Comment list by user
- [ ] Loading skeleton
- [ ] 404 page for non-existent users
- [ ] SEO metadata

**Rendering Strategy:**
- Use **SSR** for initial load (SEO-friendly, public profiles)
- Hydrate with CSR for interactions

**Implementation:**

#### A. Server Component (SSR)
```typescript
// app/profile/[username]/page.tsx
import { Metadata } from 'next';

interface ProfilePageProps {
  params: { username: string };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users?username=${params.username}`
    );

    if (response.ok) {
      const data = await response.json();
      const user = data.data.users[0];

      return {
        title: `${user.displayName} (@${user.username})`,
        description: user.bio || `View ${user.displayName}'s profile`,
        openGraph: {
          title: user.displayName,
          description: user.bio || '',
          images: [user.profilePicture],
        },
      };
    }
  } catch (error) {
    console.error('Failed to generate metadata', error);
  }

  return {
    title: 'User Profile',
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  let initialUser = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/users?username=${params.username}`
    );

    if (response.ok) {
      const data = await response.json();
      initialUser = data.data.users[0];
    }
  } catch (error) {
    console.error('Failed to fetch user', error);
  }

  if (!initialUser) {
    return <UserNotFound username={params.username} />;
  }

  return <ProfileClient username={params.username} initialUser={initialUser} />;
}
```

#### B. Client Component
```typescript
// app/profile/[username]/ProfileClient.tsx
'use client';

interface ProfileClientProps {
  username: string;
  initialUser: User | null;
}

export function ProfileClient({ username, initialUser }: ProfileClientProps) {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(initialUser);
  const [activeTab, setActiveTab] = useState<'posts' | 'comments' | 'saved'>('posts');
  const [isLoading, setIsLoading] = useState(!initialUser);

  useEffect(() => {
    if (!initialUser) {
      fetchUser();
    }
  }, [username]);

  const fetchUser = async () => {
    try {
      const response = await userService.list({ username, limit: 1 });
      if (response.success && response.data.users.length > 0) {
        setUser(response.data.users[0]);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโปรไฟล์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const isOwnProfile = currentUser?.username === username;

  if (isLoading) return <LoadingSkeleton />;
  if (!user) return <UserNotFound username={username} />;

  return (
    <div className="max-w-4xl mx-auto">
      <ProfileHeader user={user} isOwnProfile={isOwnProfile} />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="w-full">
          <TabsTrigger value="posts">โพสต์</TabsTrigger>
          <TabsTrigger value="comments">ความคิดเห็น</TabsTrigger>
          {isOwnProfile && <TabsTrigger value="saved">บันทึกแล้ว</TabsTrigger>}
        </TabsList>

        <TabsContent value="posts">
          <UserPostList userId={user.id} />
        </TabsContent>

        <TabsContent value="comments">
          <UserCommentList userId={user.id} />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved">
            <SavedPostList />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
```

#### C. ProfileHeader Component
```typescript
// components/profile/ProfileHeader.tsx
interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

export function ProfileHeader({ user, isOwnProfile }: ProfileHeaderProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [followerCount, setFollowerCount] = useState(user.followerCount || 0);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);

  const handleFollowToggle = async () => {
    setIsLoadingFollow(true);
    const prevIsFollowing = isFollowing;
    const prevFollowerCount = followerCount;

    // Optimistic update
    setIsFollowing(!isFollowing);
    setFollowerCount(isFollowing ? followerCount - 1 : followerCount + 1);

    try {
      if (isFollowing) {
        await followService.unfollow(user.id);
        toast.success('เลิกติดตามแล้ว');
      } else {
        await followService.follow(user.id);
        toast.success('ติดตามแล้ว');
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(prevIsFollowing);
      setFollowerCount(prevFollowerCount);
      toast.error('ไม่สามารถดำเนินการได้');
    } finally {
      setIsLoadingFollow(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.profilePicture} alt={user.displayName} />
            <AvatarFallback className="text-2xl">{user.displayName[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{user.displayName}</h1>
                <p className="text-gray-500">@{user.username}</p>
              </div>

              {isOwnProfile ? (
                <Button onClick={() => router.push('/profile/edit')}>
                  <Settings className="h-4 w-4 mr-2" />
                  แก้ไขโปรไฟล์
                </Button>
              ) : (
                <Button
                  onClick={handleFollowToggle}
                  disabled={isLoadingFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                >
                  {isFollowing ? 'กำลังติดตาม' : 'ติดตาม'}
                </Button>
              )}
            </div>

            {user.bio && <p className="mt-3 text-gray-700">{user.bio}</p>}

            <div className="flex items-center gap-6 mt-4 text-sm">
              <div>
                <span className="font-semibold">{user.postCount || 0}</span>
                <span className="text-gray-500 ml-1">โพสต์</span>
              </div>
              <div>
                <span className="font-semibold">{user.commentCount || 0}</span>
                <span className="text-gray-500 ml-1">ความคิดเห็น</span>
              </div>
              <div>
                <span className="font-semibold">{followerCount}</span>
                <span className="text-gray-500 ml-1">ผู้ติดตาม</span>
              </div>
              <div>
                <span className="font-semibold">{user.followingCount || 0}</span>
                <span className="text-gray-500 ml-1">กำลังติดตาม</span>
              </div>
              <div>
                <span className="font-semibold">{user.karma || 0}</span>
                <span className="text-gray-500 ml-1">Karma</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-3">
              เข้าร่วมเมื่อ {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: th })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### D. UserPostList Component
```typescript
// components/profile/UserPostList.tsx
interface UserPostListProps {
  userId: string;
}

export function UserPostList({ userId }: UserPostListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchPosts();
  }, [userId]);

  const fetchPosts = async () => {
    try {
      const response = await postService.getByAuthor(userId, {
        offset: 0,
        limit,
        sortBy: 'new',
      });

      if (response.success) {
        setPosts(response.data.posts);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    const newOffset = offset + limit;
    try {
      const response = await postService.getByAuthor(userId, {
        offset: newOffset,
        limit,
        sortBy: 'new',
      });

      if (response.success) {
        setPosts([...posts, ...response.data.posts]);
        setOffset(newOffset);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์เพิ่มเติมได้');
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">ยังไม่มีโพสต์</p>
      </div>
    );
  }

  return (
    <div>
      <PostFeed posts={posts} />
      {hasMore && (
        <Button onClick={loadMore} className="w-full mt-4">
          โหลดเพิ่มเติม
        </Button>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] SSR for initial user data
- [ ] CSR for interactions
- [ ] Display user info and stats
- [ ] Follow/Unfollow button
- [ ] Tabs for posts, comments, saved
- [ ] Post list pagination
- [ ] Comment list pagination
- [ ] Loading states
- [ ] Empty states
- [ ] SEO metadata

---

### Step 4.2: Edit Profile Page
**Duration:** 1.5 days
**Files to Modify:**
- [ ] `app/profile/edit/page.tsx`
- [ ] `components/profile/EditProfileForm.tsx`

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Fetch current user profile
- [ ] Edit form (display name, bio, profile picture)
- [ ] Avatar upload
- [ ] Form validation
- [ ] Loading/saving states
- [ ] Success feedback
- [ ] Preview changes

**Implementation:**

```typescript
// app/profile/edit/page.tsx
'use client';

const updateProfileSchema = z.object({
  displayName: z.string().max(100, 'ชื่อที่แสดงยาวเกินไป').optional(),
  bio: z.string().max(500, 'คำแนะนำตัวยาวเกินไป').optional(),
  profilePicture: z.string().url('URL รูปภาพไม่ถูกต้อง').optional(),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const form = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      profilePicture: user?.profilePicture || '',
    },
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const response = await mediaService.uploadImage(file, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });

      if (response.success) {
        form.setValue('profilePicture', response.data.url);
        toast.success('อัพโหลดรูปภาพสำเร็จ');
      }
    } catch (error) {
      toast.error('ไม่สามารถอัพโหลดรูปภาพได้');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsLoading(true);
    try {
      const response = await userService.updateProfile({
        displayName: data.displayName,
        bio: data.bio,
        profilePicture: data.profilePicture,
      });

      if (response.success) {
        toast.success('อัพเดทโปรไฟล์สำเร็จ!');
        await refreshUser(); // Refresh user data in context
        router.push(`/profile/${user?.username}`);
      }
    } catch (error) {
      toast.error('ไม่สามารถอัพเดทโปรไฟล์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">แก้ไขโปรไฟล์</h1>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={form.watch('profilePicture')} />
                <AvatarFallback>{user?.displayName[0]}</AvatarFallback>
              </Avatar>
              <div>
                <Label htmlFor="avatar">รูปโปรไฟล์</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                />
                {isUploadingAvatar && <p className="text-sm text-gray-500 mt-1">กำลังอัพโหลด...</p>}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="displayName">ชื่อที่แสดง</Label>
              <Input
                id="displayName"
                {...form.register('displayName')}
                placeholder="ชื่อที่แสดง"
              />
              {form.formState.errors.displayName && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.displayName.message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {form.watch('displayName')?.length || 0} / 100
              </p>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">แนะนำตัว</Label>
              <Textarea
                id="bio"
                {...form.register('bio')}
                placeholder="เกี่ยวกับคุณ..."
                className="min-h-[100px]"
              />
              {form.formState.errors.bio && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.bio.message}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {form.watch('bio')?.length || 0} / 500
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Checklist:**
- [ ] Fetch current profile
- [ ] Form with validation
- [ ] Avatar upload
- [ ] Character counters
- [ ] Loading states
- [ ] Success feedback
- [ ] Redirect after save

---

### Step 4.3: Notifications System
**Duration:** 2 days
**Files to Modify:**
- [ ] `app/notifications/page.tsx`
- [ ] `components/notification/NotificationList.tsx`
- [ ] `components/notification/NotificationItem.tsx`
- [ ] `components/nav-user.tsx` (add notification badge)

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Fetch notifications
- [ ] Display notification list
- [ ] Unread count badge
- [ ] Mark as read (single)
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Delete all notifications
- [ ] Notification types (vote, comment, follow, reply)
- [ ] Link to related content
- [ ] Real-time updates (polling or WebSocket - future)
- [ ] Pagination

**Implementation:**

#### A. Notifications Page
```typescript
// app/notifications/page.tsx
'use client';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = filter === 'unread'
        ? await notificationService.getUnread({ offset: 0, limit: 50 })
        : await notificationService.list({ offset: 0, limit: 50 });

      if (response.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดการแจ้งเตือนได้');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch unread count', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถทำเครื่องหมายว่าอ่านแล้วได้');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('ลบการแจ้งเตือนแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถลบการแจ้งเตือนได้');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบการแจ้งเตือนทั้งหมด?')) {
      return;
    }

    try {
      await notificationService.deleteAll();
      setNotifications([]);
      setUnreadCount(0);
      toast.success('ลบการแจ้งเตือนทั้งหมดแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถลบการแจ้งเตือนได้');
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              ทำเครื่องหมายทั้งหมดว่าอ่านแล้ว
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleDeleteAll}>
              ลบทั้งหมด
            </Button>
          )}
        </div>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="unread">
            ยังไม่อ่าน {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

#### B. NotificationItem Component
```typescript
// components/notification/NotificationItem.tsx
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead, onDelete }: NotificationItemProps) {
  const getNotificationContent = () => {
    switch (notification.type) {
      case 'vote':
        return `${notification.actor.displayName} โหวตโพสต์ของคุณ`;
      case 'comment':
        return `${notification.actor.displayName} แสดงความคิดเห็นในโพสต์ของคุณ`;
      case 'reply':
        return `${notification.actor.displayName} ตอบกลับความคิดเห็นของคุณ`;
      case 'follow':
        return `${notification.actor.displayName} เริ่มติดตามคุณ`;
      default:
        return notification.message;
    }
  };

  const getNotificationLink = () => {
    switch (notification.type) {
      case 'vote':
      case 'comment':
        return `/post/${notification.targetId}`;
      case 'reply':
        return `/post/${notification.targetId}`; // Assuming targetId is post ID
      case 'follow':
        return `/profile/${notification.actor.username}`;
      default:
        return '/';
    }
  };

  return (
    <Link href={getNotificationLink()} onClick={() => !notification.isRead && onMarkAsRead(notification.id)}>
      <Card className={`hover:bg-gray-50 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage src={notification.actor.profilePicture} />
              <AvatarFallback>{notification.actor.displayName[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="text-sm">{getNotificationContent()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: th })}
              </p>
            </div>

            {!notification.isRead && (
              <div className="h-2 w-2 bg-blue-600 rounded-full" />
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Checklist:**
- [ ] Fetch notifications
- [ ] Display notification list
- [ ] Unread count badge
- [ ] Mark as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Delete all
- [ ] Link to related content
- [ ] Filter (all/unread)
- [ ] Empty state

---

### Step 4.4: Follow System Enhancement
**Duration:** 1 day
**Files to Create:**
- [ ] `app/profile/[username]/followers/page.tsx`
- [ ] `app/profile/[username]/following/page.tsx`
- [ ] `components/profile/UserList.tsx`

**Features to Implement:**
- [ ] Followers page
- [ ] Following page
- [ ] Mutual followers indicator
- [ ] Follow/Unfollow buttons on lists
- [ ] Pagination
- [ ] Empty states

**Implementation:**

```typescript
// app/profile/[username]/followers/page.tsx
'use client';

export default function FollowersPage({ params }: { params: { username: string } }) {
  const [followers, setFollowers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFollowers();
  }, [params.username]);

  const fetchFollowers = async () => {
    try {
      // First get user ID from username
      const userResponse = await userService.list({ username: params.username, limit: 1 });
      if (!userResponse.success || userResponse.data.users.length === 0) {
        return;
      }

      const userId = userResponse.data.users[0].id;

      const response = await followService.getFollowers(userId, {
        offset: 0,
        limit: 50,
      });

      if (response.success) {
        setFollowers(response.data.users);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดผู้ติดตามได้');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">ผู้ติดตาม</h1>

      {followers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีผู้ติดตาม</p>
        </div>
      ) : (
        <UserList users={followers} />
      )}
    </div>
  );
}
```

---

## ✅ Definition of Done

### Functional Requirements
- [ ] Users can view other user profiles
- [ ] Users can edit their own profile
- [ ] Users can upload profile pictures
- [ ] Users can follow/unfollow other users
- [ ] Users can view followers/following lists
- [ ] Users can view notifications
- [ ] Users can mark notifications as read
- [ ] Users can delete notifications
- [ ] Notification badge shows unread count
- [ ] Proper tabs for user content (posts/comments/saved)

### Technical Requirements
- [ ] SSR for profile pages (SEO)
- [ ] Optimistic updates for follow actions
- [ ] Form validation
- [ ] Loading states
- [ ] Empty states
- [ ] Success/error feedback
- [ ] Mobile responsive
- [ ] SEO metadata for profiles

### Testing Checklist
- [ ] ✅ View user profile → Shows correct info
- [ ] ✅ Edit own profile → Success, updates displayed
- [ ] ✅ Upload avatar → Success, shows new image
- [ ] ✅ Follow user → Count increases, button changes
- [ ] ✅ Unfollow user → Count decreases, button changes
- [ ] ✅ View followers list → Shows correct users
- [ ] ✅ View following list → Shows correct users
- [ ] ✅ View notifications → Shows all notifications
- [ ] ✅ Mark notification as read → Badge updates
- [ ] ✅ Delete notification → Removes from list

---

## 🔜 Next Steps

After completing Phase 4, proceed to:
→ **Phase 5: Advanced Features** (`05-phase5-advanced-features.md`)
- Search functionality
- Tags system
- Trending/Popular posts
- Search history
