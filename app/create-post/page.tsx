"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { CreatePostForm } from "@/components/post/CreatePostForm";
import { useCreatePost, useCreateCrosspost, usePost } from "@/lib/hooks/queries/usePosts";
import { useUploadMultipleMedia } from "@/lib/hooks/mutations/useMedia";
import { Card, CardContent } from "@/components/ui/card";
import type { CreatePostRequest, CreateCrosspostRequest } from "@/lib/types/request";

export const dynamic = 'force-dynamic';

function CreatePostContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceId = searchParams.get("source_id");
  const tagParam = searchParams.get("tag");

  // Fetch source post if sourceId exists (for crosspost)
  const { data: sourcePost, isLoading: isLoadingSource } = usePost(sourceId || '', {
    enabled: !!sourceId,
  });

  // Hooks for creating posts
  const createPost = useCreatePost();
  const createCrosspost = useCreateCrosspost();
  const { uploadMultiple, isUploading, overallProgress } = useUploadMultipleMedia();

  const handleSubmit = async (data: {
    title: string;
    content: string;
    tags?: string[];
    media?: File[];
  }) => {
    try {
      // If this is a crosspost, use different endpoint
      if (sourcePost) {
        const crosspostData: CreateCrosspostRequest = {
          title: data.title,
          content: data.content,
          tags: data.tags,
        };

        await createCrosspost.mutateAsync({
          sourcePostId: sourcePost.id,
          data: crosspostData,
        });
        // Navigation is handled by the hook
        return;
      }

      // Regular post: upload media first (if any)
      let mediaIds: string[] = [];
      if (data.media && data.media.length > 0) {
        console.log('📤 Uploading media files...');
        mediaIds = await uploadMultiple(data.media);
        console.log('✅ Media uploaded, IDs:', mediaIds);
      }

      // Create post with mediaIds
      const postData: CreatePostRequest = {
        title: data.title,
        content: data.content,
        tags: data.tags,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      };

      await createPost.mutateAsync(postData);
      // Navigation is handled by the hook
    } catch (error) {
      console.error('Failed to create post:', error);
      // Error toast is handled by the hooks
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  // Loading state for source post
  if (sourceId && isLoadingSource) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โพสต์ข้าม" },
        ]}
      >
        <Card>
          <CardContent className="py-16 text-center">
            <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลดโพสต์ต้นฉบับ...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Source post not found
  if (sourceId && !sourcePost) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โพสต์ข้าม" },
        ]}
      >
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-lg text-destructive">ไม่พบโพสต์ต้นฉบับ</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const isSubmitting = createPost.isPending || createCrosspost.isPending || isUploading;

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: sourcePost ? "โพสต์ข้าม" : "สร้างโพสต์" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {sourcePost ? "โพสต์ข้าม" : "สร้างโพสต์ใหม่"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {sourcePost
              ? "แชร์โพสต์นี้พร้อมเพิ่มความคิดเห็นของคุณเอง"
              : "แบ่งปันเรื่องราวหรือความคิดของคุณกับชุมชน"
            }
          </p>
        </div>

        <CreatePostForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          sourcePost={sourcePost}
          isSubmitting={isSubmitting}
          uploadProgress={overallProgress}
          initialTags={tagParam ? [tagParam] : undefined}
        />
      </div>
    </AppLayout>
  );
}

export default function CreatePostPage() {
  return (
    <Suspense fallback={
      <AppLayout breadcrumbs={[{ label: "กำลังโหลด..." }]}>
        <Card>
          <CardContent className="py-16 text-center">
            <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 mb-4"></div>
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </CardContent>
        </Card>
      </AppLayout>
    }>
      <CreatePostContent />
    </Suspense>
  );
}
