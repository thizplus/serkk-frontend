# 💬 Phase 3: Social Interactions

**Duration:** Week 3 (5-7 days)
**Priority:** 🟠 High
**Dependencies:** Phase 2 (Core Content) must be completed
**Status:** 📝 Planning

---

## 🎯 Objectives

1. Implement comment system with nested replies
2. Create voting system (upvote/downvote)
3. Add save/bookmark functionality
4. Implement share functionality (crosspost)
5. Real-time interactions (optimistic updates)

---

## 📋 Tasks Breakdown

### Step 3.1: Comment System - Display & Create
**Duration:** 2 days
**Files to Modify:**
- [ ] `components/comment/CommentList.tsx`
- [ ] `components/comment/CommentCard.tsx`
- [ ] `components/comment/CommentForm.tsx`
- [ ] `app/post/[id]/page.tsx`

**Current Status:**
- ✅ Component structure exists
- 🔄 Need to connect to API

**Features to Implement:**
- [ ] Display comments on post detail page
- [ ] Nested comment tree structure
- [ ] Comment form (create root comment)
- [ ] Reply form (create nested reply)
- [ ] Load more comments (pagination)
- [ ] Character limit (max 10000 chars)
- [ ] Loading states
- [ ] Empty state ("ยังไม่มีคอมเมนต์")
- [ ] Sort options (best, new, old, controversial)

**Implementation Steps:**

#### A. Fetch Comments on Post Detail Page
```typescript
// app/post/[id]/page.tsx (Client Component)
'use client';

const [comments, setComments] = useState<Comment[]>([]);
const [isLoadingComments, setIsLoadingComments] = useState(true);
const [sortBy, setSortBy] = useState<'best' | 'new' | 'old' | 'controversial'>('best');

useEffect(() => {
  if (postId) {
    fetchComments();
  }
}, [postId, sortBy]);

const fetchComments = async () => {
  try {
    setIsLoadingComments(true);
    const response = await commentService.getByPost(postId, {
      offset: 0,
      limit: 50,
      sortBy,
    });

    if (response.success) {
      setComments(response.data.comments);
    }
  } catch (error) {
    toast.error('ไม่สามารถโหลดคอมเมนต์ได้');
  } finally {
    setIsLoadingComments(false);
  }
};
```

#### B. CommentList Component
```typescript
// components/comment/CommentList.tsx
interface CommentListProps {
  comments: Comment[];
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
}

export function CommentList({ comments, onReply, onDelete, onUpdate }: CommentListProps) {
  // Build comment tree structure
  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment & { children: Comment[] }>();
    const rootComments: Comment[] = [];

    // Initialize map
    comments.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, children: [] });
    });

    // Build tree
    comments.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.children.push(commentMap.get(comment.id)!);
        }
      } else {
        rootComments.push(commentMap.get(comment.id)!);
      }
    });

    return rootComments;
  };

  const commentTree = buildCommentTree(comments);

  return (
    <div className="space-y-4">
      {commentTree.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onReply={onReply}
          onDelete={onDelete}
          onUpdate={onUpdate}
          depth={0}
        />
      ))}
    </div>
  );
}
```

#### C. CommentCard Component (Recursive)
```typescript
// components/comment/CommentCard.tsx
interface CommentCardProps {
  comment: Comment & { children?: Comment[] };
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  onUpdate: (commentId: string, content: string) => void;
  depth: number;
}

export function CommentCard({ comment, onReply, onDelete, onUpdate, depth }: CommentCardProps) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const maxDepth = 5; // Maximum nesting level

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage src={comment.author.profilePicture} />
          <AvatarFallback>{comment.author.displayName[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/profile/${comment.author.username}`}>
              <span className="font-semibold hover:underline">
                {comment.author.displayName}
              </span>
            </Link>
            <span className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: th })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-gray-400">(แก้ไขแล้ว)</span>
            )}
          </div>

          {isEditing ? (
            <CommentForm
              initialContent={comment.content}
              onSubmit={async (content) => {
                await onUpdate(comment.id, content);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <p className="mt-1 text-gray-800 whitespace-pre-wrap">{comment.content}</p>
          )}

          <div className="flex items-center gap-4 mt-2">
            <VoteButtons
              targetType="comment"
              targetId={comment.id}
              initialVoteCount={comment.voteCount}
              initialUserVote={comment.userVote}
            />

            <button
              onClick={() => setIsReplying(!isReplying)}
              className="text-sm text-gray-600 hover:text-blue-600"
            >
              ตอบกลับ
            </button>

            {user?.id === comment.author.id && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-gray-600 hover:text-blue-600"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-sm text-gray-600 hover:text-red-600"
                >
                  ลบ
                </button>
              </>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <CommentForm
                onSubmit={async (content) => {
                  await onReply(comment.id, content);
                  setIsReplying(false);
                }}
                onCancel={() => setIsReplying(false)}
                placeholder="เขียนตอบกลับ..."
              />
            </div>
          )}

          {/* Nested Replies */}
          {comment.children && comment.children.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.children.map((child) => (
                <CommentCard
                  key={child.id}
                  comment={child}
                  onReply={onReply}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}

          {/* Show "Continue thread" link if max depth reached */}
          {depth >= maxDepth && comment.children && comment.children.length > 0 && (
            <Link
              href={`/comment/${comment.id}`}
              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
            >
              ดูความคิดเห็นต่อเนื่อง →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### D. CommentForm Component
```typescript
// components/comment/CommentForm.tsx
interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  initialContent?: string;
}

const commentSchema = z.object({
  content: z.string().min(1, 'กรุณาใส่เนื้อหา').max(10000, 'เนื้อหายาวเกินไป'),
});

export function CommentForm({ onSubmit, onCancel, placeholder, initialContent }: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: initialContent || '' },
  });

  const handleSubmit = async (data: { content: string }) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data.content);
      form.reset();
    } catch (error) {
      toast.error('ไม่สามารถส่งความคิดเห็นได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-2">
      <Textarea
        {...form.register('content')}
        placeholder={placeholder || 'เขียนความคิดเห็น...'}
        className="min-h-[100px]"
      />
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {form.watch('content').length} / 10000
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              ยกเลิก
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'กำลังส่ง...' : 'ส่ง'}
          </Button>
        </div>
      </div>
    </form>
  );
}
```

**Checklist:**
- [ ] Fetch comments from API
- [ ] Build nested comment tree structure
- [ ] Render comments recursively
- [ ] Create root comment form
- [ ] Create reply form
- [ ] Character counter
- [ ] Loading states
- [ ] Empty state
- [ ] Sort options

---

### Step 3.2: Comment Actions (Edit, Delete)
**Duration:** 0.5 day
**Files to Modify:**
- [ ] `components/comment/CommentActions.tsx`
- [ ] `components/comment/CommentCard.tsx`

**Features to Implement:**
- [ ] Edit comment (only author)
- [ ] Delete comment (only author)
- [ ] Confirmation dialog for delete
- [ ] Optimistic updates

**Implementation:**

```typescript
const handleUpdateComment = async (commentId: string, content: string) => {
  try {
    // Optimistic update
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content, isEdited: true } : c))
    );

    const response = await commentService.update(commentId, { content });

    if (!response.success) {
      // Revert on error
      fetchComments();
      toast.error('ไม่สามารถแก้ไขความคิดเห็นได้');
    }
  } catch (error) {
    fetchComments();
    toast.error('ไม่สามารถแก้ไขความคิดเห็นได้');
  }
};

const handleDeleteComment = async (commentId: string) => {
  if (!confirm('คุณแน่ใจหรือไม่ที่จะลบความคิดเห็นนี้?')) {
    return;
  }

  try {
    // Optimistic update
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    const response = await commentService.delete(commentId);

    if (!response.success) {
      fetchComments();
      toast.error('ไม่สามารถลบความคิดเห็นได้');
    } else {
      toast.success('ลบความคิดเห็นสำเร็จ');
    }
  } catch (error) {
    fetchComments();
    toast.error('ไม่สามารถลบความคิดเห็นได้');
  }
};
```

---

### Step 3.3: Voting System
**Duration:** 1.5 days
**Files to Modify:**
- [ ] `components/post/VoteButtons.tsx`
- [ ] Reuse for comments

**Current Status:**
- ✅ Component exists
- 🔄 Need to connect to API

**Features to Implement:**
- [ ] Upvote button
- [ ] Downvote button
- [ ] Vote count display
- [ ] Highlight user's vote
- [ ] Optimistic updates
- [ ] Work for both posts and comments
- [ ] Handle vote changes (upvote → downvote)
- [ ] Remove vote (click same button again)

**Implementation:**

```typescript
// components/post/VoteButtons.tsx
interface VoteButtonsProps {
  targetType: 'post' | 'comment';
  targetId: string;
  initialVoteCount: number;
  initialUserVote?: 'upvote' | 'downvote' | null;
}

export function VoteButtons({
  targetType,
  targetId,
  initialVoteCount,
  initialUserVote,
}: VoteButtonsProps) {
  const { isAuthenticated } = useAuth();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(initialUserVote || null);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อโหวต');
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    // Calculate optimistic updates
    let newVoteCount = voteCount;
    let newUserVote: 'upvote' | 'downvote' | null = voteType;

    if (userVote === voteType) {
      // Remove vote
      newUserVote = null;
      newVoteCount = voteCount + (voteType === 'upvote' ? -1 : 1);
    } else if (userVote) {
      // Change vote
      newVoteCount = voteCount + (voteType === 'upvote' ? 2 : -2);
    } else {
      // New vote
      newVoteCount = voteCount + (voteType === 'upvote' ? 1 : -1);
    }

    // Optimistic update
    const prevVoteCount = voteCount;
    const prevUserVote = userVote;
    setVoteCount(newVoteCount);
    setUserVote(newUserVote);

    try {
      if (newUserVote === null) {
        // Remove vote
        await voteService.remove(targetType, targetId);
      } else {
        // Create or update vote
        await voteService.create({
          targetType,
          targetId,
          voteType: newUserVote,
        });
      }
    } catch (error) {
      // Revert on error
      setVoteCount(prevVoteCount);
      setUserVote(prevUserVote);
      toast.error('ไม่สามารถโหวตได้');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
        className={userVote === 'upvote' ? 'text-orange-600' : 'text-gray-600'}
      >
        <ArrowUp className="h-4 w-4" />
      </Button>

      <span
        className={`text-sm font-semibold ${
          userVote === 'upvote'
            ? 'text-orange-600'
            : userVote === 'downvote'
            ? 'text-blue-600'
            : 'text-gray-600'
        }`}
      >
        {voteCount}
      </span>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
        className={userVote === 'downvote' ? 'text-blue-600' : 'text-gray-600'}
      >
        <ArrowDown className="h-4 w-4" />
      </Button>
    </div>
  );
}
```

**Checklist:**
- [ ] Connect to voteService
- [ ] Implement optimistic updates
- [ ] Handle vote creation
- [ ] Handle vote removal
- [ ] Handle vote changes
- [ ] Visual feedback for user's vote
- [ ] Work for both posts and comments

---

### Step 3.4: Save/Bookmark Functionality
**Duration:** 1 day
**Files to Modify:**
- [ ] `components/post/PostCard.tsx`
- [ ] `app/saved/page.tsx`

**Current Status:**
- ✅ Page exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Save button on PostCard
- [ ] Toggle save/unsave
- [ ] Visual indicator when saved
- [ ] Saved posts page
- [ ] Pagination
- [ ] Empty state
- [ ] Remove from saved list

**Implementation:**

#### A. Save Button Component
```typescript
// components/post/SaveButton.tsx
interface SaveButtonProps {
  postId: string;
  initialIsSaved: boolean;
}

export function SaveButton({ postId, initialIsSaved }: SaveButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อบันทึกโพสต์');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const prevIsSaved = isSaved;
    setIsSaved(!isSaved); // Optimistic update

    try {
      if (isSaved) {
        await savedService.unsave(postId);
        toast.success('ยกเลิกการบันทึกโพสต์แล้ว');
      } else {
        await savedService.save(postId);
        toast.success('บันทึกโพสต์แล้ว');
      }
    } catch (error) {
      setIsSaved(prevIsSaved); // Revert on error
      toast.error('ไม่สามารถบันทึกโพสต์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleSave}
      disabled={isLoading}
      className={isSaved ? 'text-yellow-600' : 'text-gray-600'}
    >
      {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
      {isSaved ? 'บันทึกแล้ว' : 'บันทึก'}
    </Button>
  );
}
```

#### B. Saved Posts Page
```typescript
// app/saved/page.tsx
'use client';

export default function SavedPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      setIsLoading(true);
      const response = await savedService.list({ offset, limit });

      if (response.success) {
        setPosts(response.data.posts);
        setHasMore(response.data.hasMore);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์ที่บันทึกได้');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async () => {
    const newOffset = offset + limit;
    try {
      const response = await savedService.list({ offset: newOffset, limit });
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
        <Bookmark className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">ยังไม่มีโพสต์ที่บันทึก</h2>
        <p className="text-gray-500 mt-2">โพสต์ที่คุณบันทึกจะแสดงที่นี่</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">โพสต์ที่บันทึก</h1>
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
- [ ] Save button on PostCard
- [ ] Connect to savedService
- [ ] Optimistic updates
- [ ] Saved posts page
- [ ] Pagination
- [ ] Empty state
- [ ] Loading states

---

### Step 3.5: Share Functionality (Crosspost)
**Duration:** 1 day
**Files to Modify:**
- [ ] `components/post/ShareDropdown.tsx`

**Current Status:**
- ✅ Component exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Share dropdown menu
- [ ] Copy link
- [ ] Share to social media (Twitter, Facebook)
- [ ] Crosspost (repost with comment)
- [ ] Share count (optional)

**Implementation:**

```typescript
// components/post/ShareDropdown.tsx
interface ShareDropdownProps {
  postId: string;
  postTitle: string;
}

export function ShareDropdown({ postId, postTitle }: ShareDropdownProps) {
  const [isCrossposting, setIsCrossposting] = useState(false);
  const [crosspostComment, setCrosspostComment] = useState('');
  const postUrl = `${window.location.origin}/post/${postId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    toast.success('คัดลอกลิงก์แล้ว');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(postTitle);
    const url = encodeURIComponent(postUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(postUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleCrosspost = async () => {
    if (!crosspostComment.trim()) {
      toast.error('กรุณาใส่ความคิดเห็นสำหรับ Crosspost');
      return;
    }

    setIsCrossposting(true);
    try {
      const response = await postService.createCrosspost(postId, {
        content: crosspostComment,
      });

      if (response.success) {
        toast.success('Crosspost สำเร็จ!');
        setCrosspostComment('');
      }
    } catch (error) {
      toast.error('ไม่สามารถ Crosspost ได้');
    } finally {
      setIsCrossposting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share className="h-4 w-4 mr-1" />
          แชร์
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link className="h-4 w-4 mr-2" />
          คัดลอกลิงก์
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter}>
          <Twitter className="h-4 w-4 mr-2" />
          แชร์บน Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareFacebook}>
          <Facebook className="h-4 w-4 mr-2" />
          แชร์บน Facebook
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setIsCrossposting(true)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Crosspost
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Crosspost Dialog */}
      <Dialog open={isCrossposting} onOpenChange={setIsCrossposting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crosspost</DialogTitle>
            <DialogDescription>เพิ่มความคิดเห็นของคุณและแชร์โพสต์นี้</DialogDescription>
          </DialogHeader>
          <Textarea
            value={crosspostComment}
            onChange={(e) => setCrosspostComment(e.target.value)}
            placeholder="เขียนความคิดเห็นของคุณ..."
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCrossposting(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCrosspost}>Crosspost</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}
```

**Checklist:**
- [ ] Copy link functionality
- [ ] Share to Twitter
- [ ] Share to Facebook
- [ ] Crosspost with comment
- [ ] Loading states
- [ ] Success feedback

---

## ✅ Definition of Done

### Functional Requirements
- [ ] Users can view comments on posts
- [ ] Users can create root comments
- [ ] Users can reply to comments (nested)
- [ ] Users can edit their own comments
- [ ] Users can delete their own comments
- [ ] Comments display in tree structure
- [ ] Users can upvote/downvote posts
- [ ] Users can upvote/downvote comments
- [ ] Users can save/bookmark posts
- [ ] Users can view saved posts page
- [ ] Users can share posts (copy link, social media)
- [ ] Users can crosspost with comments

### Technical Requirements
- [ ] Optimistic updates for all interactions
- [ ] Error handling with rollback
- [ ] Loading states for all actions
- [ ] Empty states where appropriate
- [ ] Comment nesting limited to 5 levels
- [ ] Character limits enforced
- [ ] Success/error toasts

### Testing Checklist
- [ ] ✅ View comments → Shows nested comments
- [ ] ✅ Create comment → Success, shows immediately
- [ ] ✅ Reply to comment → Success, nested correctly
- [ ] ✅ Edit own comment → Success, updates content
- [ ] ✅ Delete own comment → Success, removes comment
- [ ] ✅ Try to edit someone else's comment → No option shown
- [ ] ✅ Upvote post → Count increases
- [ ] ✅ Downvote post → Count decreases
- [ ] ✅ Change vote → Count updates correctly
- [ ] ✅ Remove vote → Count returns to original
- [ ] ✅ Save post → Shows in saved page
- [ ] ✅ Unsave post → Removes from saved page
- [ ] ✅ Copy link → Link copied to clipboard
- [ ] ✅ Crosspost → Creates new post

---

## 🔜 Next Steps

After completing Phase 3, proceed to:
→ **Phase 4: User Features** (`04-phase4-user-features.md`)
- User profiles (view/edit)
- Follow system
- Notifications
- User feed
