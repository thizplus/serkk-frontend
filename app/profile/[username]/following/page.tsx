"use client";

export const dynamic = 'force-dynamic';

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFollowing } from "@/lib/hooks/queries/useFollows";
import { useUserProfile } from "@/lib/hooks/queries/useUsers";
import { useUser, useHasHydrated } from "@/lib/stores/authStore";
import { UserCard } from "@/components/user/UserCard";

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const currentUser = useUser();
  const hasHydrated = useHasHydrated();

  const isOwnProfile = currentUser?.username === username;

  // Fetch user profile to get userId
  const {
    data: profileData,
    isLoading: isLoadingProfile,
    error: profileError,
  } = useUserProfile(username, {
    enabled: !isOwnProfile && hasHydrated && !!username,
  });

  const profileUser = isOwnProfile ? currentUser : profileData;
  const userId = profileUser?.id;

  // Fetch following
  const {
    data: followingData,
    isLoading: isLoadingFollowing,
    error: followingError,
  } = useFollowing(userId || '', { limit: 50 }, {
    enabled: !!userId,
  });

  // ถ้าเป็นหน้า following ของตัวเอง → force isFollowing = true
  // เพราะคนในลิสต์นี้คือคนที่เรากำลังติดตามอยู่แล้ว
  const following = followingData?.users.map(user => ({
    ...user,
    isFollowing: isOwnProfile ? true : user.isFollowing, // Force true สำหรับโปรไฟล์ตัวเอง
  })) || [];
  const totalCount = followingData?.meta?.total || 0;

  // Loading state
  if (!hasHydrated || isLoadingProfile) {
    return (
      <AppLayout breadcrumbs={[{ label: "กำลังโหลด..." }]}>
        <Card>
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">กำลังโหลด...</p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Error state
  if (profileError || !profileUser) {
    return (
      <AppLayout breadcrumbs={[{ label: "ไม่พบโปรไฟล์" }]}>
        <Card>
          <CardContent className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">ไม่พบโปรไฟล์</h1>
            <p className="text-muted-foreground mb-6">
              {profileError instanceof Error ? profileError.message : 'ไม่พบผู้ใช้ที่ต้องการ'}
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

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: `@${username}`, href: `/profile/${username}` },
        { label: "กำลังติดตาม" },
      ]}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          size="sm"
       
          onClick={() => router.push(`/profile/${username}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับโปรไฟล์
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {profileUser.displayName} กำลังติดตาม
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {isLoadingFollowing ? 'กำลังโหลด...' : `${totalCount.toLocaleString()} คน`}
            </p>
          </div>
        </div>

        {/* Following List */}
        {isLoadingFollowing ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">กำลังโหลดรายการติดตาม...</p>
            </CardContent>
          </Card>
        ) : followingError ? (
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-muted-foreground">
                {followingError instanceof Error
                  ? followingError.message
                  : 'ไม่สามารถโหลดรายการติดตามได้'}
              </p>
            </CardContent>
          </Card>
        ) : following.length > 0 ? (
          <div className="space-y-3">
            {following.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <UserPlus className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">ยังไม่ได้ติดตามใคร</h3>
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? "คุณยังไม่ได้ติดตามใคร"
                  : `${profileUser.displayName} ยังไม่ได้ติดตามใคร`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
