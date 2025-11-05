"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostFeed } from "@/components/post/PostFeed";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Globe,
  Edit,
  UserPlus,
  TrendingUp,
  MessageSquare,
  FileText
} from "lucide-react";
import { useUser, useHasHydrated } from "@/lib/stores/authStore";
import { useUserPosts } from "@/lib/hooks/queries/usePosts";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const currentUser = useUser(); // ใช้ Zustand
  const hasHydrated = useHasHydrated(); // ใช้ Zustand
  const [activeTab, setActiveTab] = useState("posts");

  // Check if this is the user's own profile
  const isOwnProfile = currentUser?.username === username;
  const profileUser = isOwnProfile ? currentUser : null;

  // Fetch user's posts using React Query hook
  const {
    data: userPosts = [],
    isLoading: isLoadingPosts,
    error,
  } = useUserPosts(currentUser?.id || '', {
    // Only fetch if user is logged in and viewing own profile
    enabled: !!currentUser && isOwnProfile,
  });

  // Loading state - แสดงเหมือนกันทั้ง server และ client
  if (!hasHydrated) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โปรไฟล์", href: `/profile/${username}` },
        ]}
      >
        <div className="text-center py-16">
          <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </AppLayout>
    );
  }

  // Not own profile - feature not supported yet
  if (!isOwnProfile) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โปรไฟล์", href: `/profile/${username}` },
        ]}
      >
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">ฟีเจอร์ยังไม่พร้อมใช้งาน</h2>
          <p className="text-muted-foreground mb-6">
            ขณะนี้ยังไม่รองรับการดูโปรไฟล์ของผู้ใช้อื่น
          </p>
          <Button onClick={() => router.push("/")}>
            กลับหน้าหลัก
          </Button>
        </div>
      </AppLayout>
    );
  }

  // No user data (not logged in)
  if (!profileUser) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โปรไฟล์", href: `/profile/${username}` },
        ]}
      >
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-muted-foreground mb-6">
            คุณต้องเข้าสู่ระบบเพื่อดูโปรไฟล์
          </p>
          <Button onClick={() => router.push("/login")}>
            เข้าสู่ระบบ
          </Button>
        </div>
      </AppLayout>
    );
  }


  const handleFollow = () => {
    console.log(`Follow user ${username}`);
    // TODO: Implement follow functionality
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: `@${username}` },
      ]}
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-start">
          {/* Avatar */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-muted overflow-hidden">
              {profileUser.avatar ? (
                <Image
                  src={profileUser.avatar}
                  alt={profileUser.displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
                  {profileUser.displayName.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">{profileUser.displayName}</h1>
                  <p className="text-sm text-muted-foreground">@{profileUser.username}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button
                      onClick={() => router.push("/profile/edit")}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      แก้ไขโปรไฟล์
                    </Button>
                  ) : (
                    <Button onClick={handleFollow} size="sm">
                      <UserPlus className="mr-2 h-4 w-4" />
                      ติดตาม
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <p className="mt-2 text-sm text-foreground/90 line-clamp-2">{profileUser.bio}</p>
              )}

              {/* Meta Info */}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                {profileUser.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{profileUser.location}</span>
                  </div>
                )}
                {profileUser.website && (
                  <div className="flex items-center gap-1">
                    <Globe size={14} />
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline truncate max-w-[200px]"
                    >
                      {profileUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="mt-2 flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-primary" />
                  <span className="font-bold">{profileUser.karma?.toLocaleString() || 0}</span>
                  <span className="text-muted-foreground">Karma</span>
                </div>
                <button className="flex items-center gap-1 hover:underline">
                  <span className="font-bold">{profileUser.followersCount?.toLocaleString() || 0}</span>
                  <span className="text-muted-foreground">ผู้ติดตาม</span>
                </button>
                <button className="flex items-center gap-1 hover:underline">
                  <span className="font-bold">{profileUser.followingCount?.toLocaleString() || 0}</span>
                  <span className="text-muted-foreground">ติดตาม</span>
                </button>
              </div>
            </div>
          </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts" className="gap-2">
              <FileText size={16} />
              โพสต์ ({userPosts.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare size={16} />
              คอมเมนต์
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {isLoadingPosts ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="h-12 w-12 mx-auto animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 mb-4"></div>
                  <p className="text-muted-foreground">กำลังโหลดโพสต์...</p>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-lg text-destructive">
                    {error instanceof Error ? error.message : 'ไม่สามารถโหลดโพสต์ได้'}
                  </p>
                </CardContent>
              </Card>
            ) : userPosts.length > 0 ? (
              <PostFeed posts={userPosts} />
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {isOwnProfile ? "คุณยังไม่มีโพสต์" : "ผู้ใช้ยังไม่มีโพสต์"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-6">
            <Card>
              <CardContent className="py-16 text-center">
                <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg text-muted-foreground">
                  ยังไม่มีคอมเมนต์
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
