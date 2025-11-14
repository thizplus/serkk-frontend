"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { PostFeed } from "@/features/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Plus, Loader2 } from "@/config/icons";
import { useUser, useHasHydrated } from "@/features/auth";
import { useSavedPosts } from "@/features/posts";
import { LoadingState, EmptyState } from "@/components/common";
import { LOADING_MESSAGES, PAGINATION } from "@/config";

export const dynamic = 'force-dynamic';

export default function SavedPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const currentUser = useUser();

  // ดึงโพสต์ที่บันทึกไว้
  const { data: savedPosts = [], isLoading, error } = useSavedPosts({
    limit: PAGINATION.MESSAGE_LIMIT,
  });


  // รอให้ hydration เสร็จก่อน (ป้องกัน flash ของ "กรุณาล็อกอิน")
  if (!hasHydrated) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โพสต์ที่บันทึก" },
        ]}
      >
        <PageWrap>
          <LoadingState message={LOADING_MESSAGES.SAVED.LOADING} />
        </PageWrap>
      </AppLayout>
    );
  }

  // ถ้ายังไม่ได้ล็อกอิน (หลังจาก hydrate แล้ว)
  if (!currentUser) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โพสต์ที่บันทึก" },
        ]}
      >
        <PageWrap>
          <Card>
            <CardContent className="py-16 text-center">
              <Bookmark className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">กรุณาล็อกอินก่อน</h2>
              <p className="text-muted-foreground mb-6">
                คุณต้องล็อกอินเพื่อดูโพสต์ที่บันทึกไว้
              </p>
              <Button onClick={() => router.push("/login")}>
                ล็อกอิน
              </Button>
            </CardContent>
          </Card>
        </PageWrap>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: "โพสต์ที่บันทึก" },
      ]}
    >
      {/* Header - wrapped with PageWrap */}
      <PageWrap>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bookmark className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">โพสต์ที่บันทึก</h1>
              <p className="text-muted-foreground mt-1">
                {isLoading
                  ? "กำลังโหลด..."
                  : `โพสต์ทั้งหมดที่คุณบันทึกไว้ (${savedPosts.length})`
                }
              </p>
            </div>
          </div>
          <Button onClick={() => router.push("/create-post")}>
            <Plus className="mr-2 h-4 w-4" />
            สร้างโพสต์
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent>
              <LoadingState message={LOADING_MESSAGES.SAVED.LOADING} />
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-lg text-destructive mb-2">
                ไม่สามารถโหลดโพสต์ได้
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}
              </p>
              <Button onClick={() => window.location.reload()}>
                ลองใหม่อีกครั้ง
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && !error && savedPosts.length === 0 && (
          <EmptyState
            icon="Bookmark"
            title="ยังไม่มีโพสต์ที่บันทึก"
            description="เมื่อคุณบันทึกโพสต์ โพสต์จะปรากฏที่นี่"
            action={{
              label: "ไปหาโพสต์น่าสนใจ",
              onClick: () => router.push("/"),
            }}
          />
        )}
      </PageWrap>

      {/* Saved Posts Feed - NO WRAP (edge-to-edge) */}
      {!isLoading && !error && savedPosts.length > 0 && (
        <PostFeed posts={savedPosts} />
      )}
    </AppLayout>
  );
}
