"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PostFeed } from "@/components/post/PostFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Plus, Loader2 } from "lucide-react";
import { useUser, useHasHydrated } from "@/lib/stores/authStore";
import { useSavedPosts } from "@/lib/hooks/mutations/useSaved";

export const dynamic = 'force-dynamic';

export default function SavedPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const currentUser = useUser();

  // ดึงโพสต์ที่บันทึกไว้
  const { data: savedPosts = [], isLoading, error } = useSavedPosts({
    limit: 50,
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
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </CardContent>
        </Card>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">กำลังโหลดโพสต์ที่บันทึกไว้...</p>
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

        {/* Saved Posts Feed */}
        {!isLoading && !error && (
          <>
            {savedPosts.length > 0 ? (
              <PostFeed posts={savedPosts} />
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Bookmark className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">ยังไม่มีโพสต์ที่บันทึก</h2>
                  <p className="text-muted-foreground mb-6">
                    เมื่อคุณบันทึกโพสต์ โพสต์จะปรากฏที่นี่
                  </p>
                  <Button onClick={() => router.push("/")}>
                    ไปหาโพสต์น่าสนใจ
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
