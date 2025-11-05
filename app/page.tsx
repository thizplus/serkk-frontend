"use client";

import { useRouter } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PostFeed } from "@/components/post/PostFeed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Loader2 } from "lucide-react";
import { usePosts } from "@/lib/hooks/queries/usePosts";

export default function Home() {
  const router = useRouter();

  // Fetch posts from backend
  const { data: posts = [], isLoading, error } = usePosts({
    sortBy: 'hot', // Default to hot sorting
    limit: 20,
  });

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก" },
      ]}
    >
      <div className="space-y-6">
        {/* Header with Create Post Button */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ฟีดโพสต์</h1>
            <p className="text-muted-foreground mt-1">
              ค้นพบและแบ่งปันเรื่องราวจากชุมชน
            </p>
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
              <p className="text-muted-foreground">กำลังโหลดโพสต์...</p>
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

        {/* Post Feed */}
        {!isLoading && !error && (
          <PostFeed posts={posts} />
        )}
      </div>
    </AppLayout>
  );
}
