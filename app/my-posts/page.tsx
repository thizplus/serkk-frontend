"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PostFeed } from "@/features/posts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Plus, Loader2 } from "@/shared/config/icons";
import { useUser, useHasHydrated } from "@/features/auth";
import { useUserPosts } from "@/features/posts";
import { LoadingState, EmptyState } from "@/components/common";
import { LOADING_MESSAGES, PAGINATION } from "@/shared/config";

export const dynamic = 'force-dynamic';

export default function MyPostsPage() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const currentUser = useUser();

  // ดึงโพสต์ของผู้ใช้ที่ล็อกอินอยู่
  const { data: myPosts = [], isLoading, error } = useUserPosts(
    currentUser?.id || "",
    {
      enabled: !!currentUser?.id, // เรียก API เฉพาะเมื่อมี user ID
      params: {
        sortBy: 'new', // เรียงตามใหม่ล่าสุด
        limit: PAGINATION.MESSAGE_LIMIT,
      }
    }
  );

  // รอให้ hydration เสร็จก่อน (ป้องกัน flash ของ "กรุณาล็อกอิน")
  if (!hasHydrated) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โพสต์ของฉัน" },
        ]}
      >
        <LoadingState message={LOADING_MESSAGES.POST.LOADING} />
      </AppLayout>
    );
  }

  // ถ้ายังไม่ได้ล็อกอิน (หลังจาก hydrate แล้ว)
  if (!currentUser) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โพสต์ของฉัน" },
        ]}
      >
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">กรุณาล็อกอินก่อน</h2>
            <p className="text-muted-foreground mb-6">
              คุณต้องล็อกอินเพื่อดูโพสต์ของคุณ
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
        { label: "โพสต์ของฉัน" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">โพสต์ของฉัน</h1>
              <p className="text-muted-foreground mt-1">
                {isLoading
                  ? "กำลังโหลด..."
                  : `โพสต์ทั้งหมดที่คุณสร้าง (${myPosts.length})`
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
              <LoadingState message={LOADING_MESSAGES.POST.LOADING} />
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

        {/* My Posts Feed */}
        {!isLoading && !error && (
          <>
            {myPosts.length > 0 ? (
              <PostFeed posts={myPosts} enableOptimisticUI={true} />
            ) : (
              <EmptyState
                icon="FileText"
                title="ยังไม่มีโพสต์"
                description="คุณยังไม่ได้สร้างโพสต์ เริ่มสร้างโพสต์แรกของคุณเลย!"
                action={{
                  label: "สร้างโพสต์",
                  onClick: () => router.push("/create-post"),
                }}
              />
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
