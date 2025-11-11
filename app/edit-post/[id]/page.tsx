"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { X, Loader2, ArrowLeft } from "@/config/icons";
import Image from "next/image";
import { toast } from "sonner";
import { usePost, useUpdatePost } from "@/features/posts";
import { useUser } from '@/features/auth';
import { FORM_LIMITS } from "@/config";

export const dynamic = 'force-dynamic';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  // Fetch post data
  const { data: post, isLoading: isLoadingPost, error: postError } = usePost(postId);

  // Get current user
  const currentUser = useUser();

  // Update post mutation
  const updatePost = useUpdatePost();

  // Check if current user is the author
  const isAuthor = currentUser && post && post.author.username === currentUser.username;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(post.title);
      setContent(post.content);
      setTags(post.tags?.map(t => t.name) || []);
    }
  }, [post]);

  // Loading state
  if (isLoadingPost) {
    return (
      <AppLayout breadcrumbs={[{ label: "กำลังโหลด..." }]}>
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลดโพสต์...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Error or not found state
  if (postError || !post) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "แก้ไขโพสต์" },
        ]}
      >
        <Card>
          <CardContent className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">ไม่พบโพสต์</h2>
            <p className="text-muted-foreground mb-6">
              {postError
                ? postError instanceof Error
                  ? postError.message
                  : 'เกิดข้อผิดพลาด'
                : 'ไม่พบโพสต์ที่ต้องการแก้ไข'
              }
            </p>
            <Button size={'sm'} onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Check authorization
  if (!isAuthor) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: post.title, href: `/post/${postId}` },
          { label: "แก้ไข" },
        ]}
      >
        <Card>
          <CardContent className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">ไม่มีสิทธิ์</h2>
            <p className="text-muted-foreground mb-6">
              คุณไม่มีสิทธิ์แก้ไขโพสต์นี้ เฉพาะเจ้าของโพสต์เท่านั้นที่สามารถแก้ไขได้
            </p>
            <Button size={'sm'} onClick={() => router.push(`/post/${postId}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปที่โพสต์
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('กรุณากรอกหัวข้อและเนื้อหา');
      return;
    }

    // Call update mutation
    updatePost.mutate({
      id: postId,
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      }
    });
  };

  const handleCancel = () => {
    router.push(`/post/${postId}`);
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');

      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: post.title, href: `/post/${postId}` },
        { label: "แก้ไข" },
      ]}
    >
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>แก้ไขโพสต์</CardTitle>
            <CardDescription>
              แก้ไขหัวข้อ เนื้อหา และแท็กของโพสต์
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <Field>
                <FieldLabel htmlFor="title">หัวข้อ *</FieldLabel>
                <Input
                  id="title"
                  type="text"
                  placeholder="หัวข้อโพสต์ของคุณ..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  maxLength={FORM_LIMITS.POST.TITLE_MAX}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/{FORM_LIMITS.POST.TITLE_MAX} ตัวอักษร
                </p>
              </Field>

              {/* Content */}
              <Field>
                <FieldLabel htmlFor="content">เนื้อหา *</FieldLabel>
                <textarea
                  id="content"
                  placeholder="เขียนเนื้อหาของคุณที่นี่..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  rows={12}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  รองรับการขึ้นบรรทัดใหม่
                </p>
              </Field>

              {/* Tags */}
              <Field>
                <FieldLabel htmlFor="tags">แท็ก (ไม่บังคับ)</FieldLabel>
                <Input
                  id="tags"
                  type="text"
                  placeholder="พิมพ์แท็กแล้วกด Enter หรือเครื่องหมาย comma"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-sm rounded-full"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-destructive"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              {/* Media Preview (Read-only) */}
              {post.media && post.media.length > 0 && (
                <Field>
                  <FieldLabel>สื่อ (ไม่สามารถแก้ไขได้)</FieldLabel>
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    {post.media[0].type === "video" ? (
                      <video
                        src={post.media[0].url}
                        poster={post.media[0].thumbnail || undefined}
                        controls={true}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={post.media[0].url}
                        alt="Post media"
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    ไม่สามารถแก้ไขรูปภาพหรือวิดีโอได้ หากต้องการเปลี่ยน กรุณาลบโพสต์และสร้างใหม่
                  </p>
                </Field>
              )}

              {/* Source Post Preview (Read-only) */}
              {post.sourcePost && (
                <Field>
                  <FieldLabel>โพสต์ต้นฉบับ (ไม่สามารถแก้ไขได้)</FieldLabel>
                  <Card className="mt-2 bg-muted/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">
                          {post.sourcePost.author.displayName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          @{post.sourcePost.author.username}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2">{post.sourcePost.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {post.sourcePost.content}
                      </p>
                    </CardContent>
                  </Card>
                </Field>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!title.trim() || !content.trim() || updatePost.isPending}
                  className="flex-1"
                >
                  {updatePost.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {updatePost.isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updatePost.isPending}
                >
                  ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
