"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Loader2 } from "@/config/icons";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFollowers } from "@/features/profile";
import { useUserProfile } from "@/features/profile";
import { useUser, useHasHydrated } from '@/features/auth';
import { UserCard } from "@/features/profile";
import { PAGINATION } from "@/config";

export default function FollowersPage() {
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

  // Fetch followers
  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    error: followersError,
  } = useFollowers(userId || '', { limit: PAGINATION.MESSAGE_LIMIT }, {
    enabled: !!userId,
  });

  const followers = followersData?.users || [];
  const totalCount = followersData?.meta?.total || 0;

  // Loading state
  if (!hasHydrated || isLoadingProfile) {
    return (
      <AppLayout breadcrumbs={[{ label: "กำลังโหลด..." }]}>
        <PageWrap>
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">กำลังโหลด...</p>
            </CardContent>
          </Card>
        </PageWrap>
      </AppLayout>
    );
  }

  // Error state
  if (profileError || !profileUser) {
    return (
      <AppLayout breadcrumbs={[{ label: "ไม่พบโปรไฟล์" }]}>
        <PageWrap>
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
        </PageWrap>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: `@${username}`, href: `/profile/${username}` },
        { label: "ผู้ติดตาม" },
      ]}
    >
      <PageWrap>
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
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              ผู้ติดตาม {profileUser.displayName}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              {isLoadingFollowers ? 'กำลังโหลด...' : `${totalCount.toLocaleString()} คน`}
            </p>
          </div>
        </div>

        {/* Followers List */}
        {isLoadingFollowers ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">กำลังโหลดผู้ติดตาม...</p>
            </CardContent>
          </Card>
        ) : followersError ? (
          <Card>
            <CardContent className="py-16 text-center">
              <h2 className="text-xl font-bold mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-muted-foreground">
                {followersError instanceof Error
                  ? followersError.message
                  : 'ไม่สามารถโหลดผู้ติดตามได้'}
              </p>
            </CardContent>
          </Card>
        ) : followers.length > 0 ? (
          <div className="space-y-3">
            {followers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">ยังไม่มีผู้ติดตาม</h3>
              <p className="text-muted-foreground">
                {isOwnProfile
                  ? "คุณยังไม่มีผู้ติดตาม"
                  : `${profileUser.displayName} ยังไม่มีผู้ติดตาม`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      </PageWrap>
    </AppLayout>
  );
}
