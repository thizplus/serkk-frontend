"use client";

import { useState, useMemo } from "react";
import { useInfinitePosts } from "@/features/posts";
import { POCPostCard } from "@/poc/components/POCPostCard";
import { POC1_NativeScroll } from "@/poc/components/POC1_NativeScroll";
import { POC2_FramerMotion } from "@/poc/components/POC2_FramerMotion";
import { POC3_Embla } from "@/poc/components/POC3_Embla";
import { POC4_Swiper } from "@/poc/components/POC4_Swiper";
import { POC5_Drawer } from "@/poc/components/POC5_Drawer";
import { POC6_CommentDrawer } from "@/poc/components/POC6_CommentDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "@/config/icons";
import type { MediaItem } from "@/poc/types";

type POCType = 'poc1' | 'poc2' | 'poc3' | 'poc4' | 'poc5';

export default function POCMediaViewerPage() {
  const [activePOC, setActivePOC] = useState<POCType | null>(null);
  const [currentMedia, setCurrentMedia] = useState<MediaItem[]>([]);
  const [currentPost, setCurrentPost] = useState<any>(null);
  const [initialIndex, setInitialIndex] = useState(0);

  // Comment Drawer state
  const [commentDrawerOpen, setCommentDrawerOpen] = useState(false);
  const [commentDrawerPost, setCommentDrawerPost] = useState<any>(null);

  // Fetch real posts from backend
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfinitePosts({ sortBy: 'hot' });

  // Flatten posts from all pages
  const posts = useMemo(() => {
    if (!data?.pages) return [];
    const allPosts = data.pages.flatMap((page) => page.posts || []);
    return allPosts.filter((post) => post && post.id);
  }, [data]);

  const handleMediaClick = (post: any, media: MediaItem[], index: number = 0) => {
    setCurrentPost(post);
    setCurrentMedia(media);
    setInitialIndex(index);
    // Default to POC #1 (can be changed via buttons)
    setActivePOC('poc1');
  };

  const handleCommentClick = (post: any) => {
    setCommentDrawerPost(post);
    setCommentDrawerOpen(true);
  };

  const openPOC = (poc: POCType) => {
    if (currentMedia.length > 0) {
      setActivePOC(poc);
    }
  };

  const closePOC = () => {
    setActivePOC(null);
  };

  const closeCommentDrawer = () => {
    setCommentDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-2xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-1">
            POC: Mobile Media Viewer
          </h1>
          <p className="text-sm text-muted-foreground">
            คลิกที่รูป/วิดีโอในโพสต์เพื่อเปิด viewer • เลือก POC ด้านล่าง
          </p>

          {/* POC Selector (visible when media is selected) */}
          {currentMedia.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => openPOC('poc1')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activePOC === 'poc1'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                POC #1: Native Scroll
              </button>
              <button
                onClick={() => openPOC('poc2')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activePOC === 'poc2'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                POC #2: Framer Motion
              </button>
              <button
                onClick={() => openPOC('poc3')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activePOC === 'poc3'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                POC #3: Embla
              </button>
              <button
                onClick={() => openPOC('poc4')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activePOC === 'poc4'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                POC #4: Swiper
              </button>
              <button
                onClick={() => openPOC('poc5')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activePOC === 'poc5'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                POC #5: Drawer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Feed */}
      <div className="max-w-2xl mx-auto p-4">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-8">
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-muted-foreground">
                {error.message || 'ไม่สามารถโหลดโพสต์ได้'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        {!isLoading && !error && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <POCPostCard
                key={post.id}
                post={post}
                onMediaClick={handleMediaClick}
                onCommentClick={handleCommentClick}
              />
            ))}

            {/* Load More */}
            {hasNextPage && (
              <div className="py-4">
                {isFetchingNextPage ? (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">กำลังโหลดเพิ่มเติม...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <button
                    onClick={() => fetchNextPage()}
                    className="w-full py-3 px-4 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors text-sm font-medium"
                  >
                    โหลดเพิ่มเติม
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && posts.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-xl font-bold mb-2">ไม่มีโพสต์</h2>
              <p className="text-muted-foreground">
                ยังไม่มีโพสต์ที่มีรูปภาพหรือวิดีโอ
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Testing Guide */}
      <div className="max-w-2xl mx-auto p-4 pb-20">
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">📝 วิธีทดสอบ:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. คลิกที่รูปภาพหรือวิดีโอในโพสต์</li>
              <li>2. POC #1 จะเปิดขึ้นมาโดยอัตโนมัติ</li>
              <li>3. ใช้ปุ่มด้านบนเพื่อสลับ POC อื่นๆ</li>
              <li>4. ทดสอบ gesture: Swipe ← → (เปลี่ยนรูป), Swipe ↓ (ปิด)</li>
              <li>5. สังเกต smoothness และ video performance</li>
            </ul>
          </CardContent>
        </Card>

        {/* Comparison Info */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-xs font-semibold mb-1">POC #1</div>
              <div className="text-xs text-muted-foreground">Native Scroll</div>
              <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                ลื่นที่สุด • 0 KB
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs font-semibold mb-1">POC #2</div>
              <div className="text-xs text-muted-foreground">Framer Motion</div>
              <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Gesture ดี • 60 KB
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs font-semibold mb-1">POC #3</div>
              <div className="text-xs text-muted-foreground">Embla</div>
              <div className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                เบามาก • 6 KB
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs font-semibold mb-1">POC #4</div>
              <div className="text-xs text-muted-foreground">Swiper</div>
              <div className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                ฟีเจอร์เยอะ • 140 KB
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="text-xs font-semibold mb-1">POC #5</div>
              <div className="text-xs text-muted-foreground">Drawer</div>
              <div className="mt-1 text-xs text-pink-600 dark:text-pink-400">
                Bottom Sheet • 8 KB
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* POC Viewers */}
      {currentMedia.length > 0 && currentPost && (
        <>
          <POC1_NativeScroll
            media={currentMedia}
            post={currentPost}
            open={activePOC === 'poc1'}
            initialIndex={initialIndex}
            onClose={closePOC}
          />
          <POC2_FramerMotion
            media={currentMedia}
            post={currentPost}
            open={activePOC === 'poc2'}
            initialIndex={initialIndex}
            onClose={closePOC}
          />
          <POC3_Embla
            media={currentMedia}
            post={currentPost}
            open={activePOC === 'poc3'}
            initialIndex={initialIndex}
            onClose={closePOC}
          />
          <POC4_Swiper
            media={currentMedia}
            post={currentPost}
            open={activePOC === 'poc4'}
            initialIndex={initialIndex}
            onClose={closePOC}
          />
          <POC5_Drawer
            media={currentMedia}
            post={currentPost}
            open={activePOC === 'poc5'}
            initialIndex={initialIndex}
            onClose={closePOC}
          />
        </>
      )}

      {/* POC #6: Comment Drawer */}
      {commentDrawerPost && (
        <POC6_CommentDrawer
          post={commentDrawerPost}
          open={commentDrawerOpen}
          onClose={closeCommentDrawer}
        />
      )}
    </div>
  );
}
