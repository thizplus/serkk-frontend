"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { toast } from "sonner";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InfinitePostFeed } from "@/features/posts";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin,
  Globe,
  Edit,
  UserPlus,
  UserMinus,
  TrendingUp,
  MessageSquare,
  FileText,
  MessageCircle
} from "@/config/icons";
import { useUser, useHasHydrated } from '@/features/auth';
import { useInfiniteUserPosts } from "@/features/posts";
import { useCommentsByAuthor } from "@/features/comments";
import { useUserProfile } from "../hooks/useUsers";
import { useToggleFollow } from "../hooks/useFollowMutations";
import { ProfileCommentCard } from "@/features/comments";
import { LinkifiedContent } from "@/components/common";
import { LoadingState, EmptyState } from "@/components/common";
import { useAuthGuard } from "@/shared/hooks/useAuthGuard";
import { LOADING_MESSAGES, TOAST_MESSAGES, PAGINATION } from "@/config";

interface ProfileContentProps {
  params: Promise<{
    username: string;
  }>;
}

export function ProfileContent({ params }: ProfileContentProps) {
  const resolvedParams = use(params);
  const username = resolvedParams.username;

  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const currentUser = useUser();
  const hasHydrated = useHasHydrated();
  const { requireAuth } = useAuthGuard();

  // อ่าน tab จาก URL query params (?tab=posts หรือ ?tab=comments)
  const tabFromUrl = searchParams.get('tab') || 'posts';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync activeTab with URL when URL changes (back/forward navigation)
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  // ✅ Refetch profile ของตัวเองเมื่อเข้าหน้าโปรไฟล์
  const isOwnProfile = currentUser?.username === username;
  useEffect(() => {
    if (isOwnProfile && hasHydrated) {
      // Invalidate profile query เพื่อให้ refetch ข้อมูลล่าสุด
      queryClient.invalidateQueries({
        queryKey: ['users', 'profile']
      });
    }
  }, [isOwnProfile, hasHydrated, queryClient]);

  // Function to change tab and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    router.push(url.pathname + url.search, { scroll: false });
  };

  // Fetch user profile (for viewing other user's profile)
  // เรียก hook เสมอ แต่ใช้ enabled เพื่อควบคุมการ fetch
  const {
    data: otherUserProfile,
    isLoading: isLoadingOtherProfile,
    error: errorOtherProfile,
  } = useUserProfile(username, {
    enabled: !isOwnProfile && hasHydrated && !!username, // Fetch เฉพาะเมื่อไม่ใช่โปรไฟล์ตัวเอง
  });

  // Use appropriate profile data
  const profileUser = isOwnProfile ? currentUser : otherUserProfile;

  // Fetch user's posts using infinite scroll
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteUserPosts(profileUser?.id || '', {
    limit: PAGINATION.DEFAULT_LIMIT,
  }, {
    enabled: !!profileUser?.id,
  });

  // Flatten posts from all pages
  const userPosts = useMemo(() => {
    return postsData?.pages.flatMap((page) => page.posts) ?? [];
  }, [postsData]);

  // Fetch user's comments using React Query hook
  const {
    data: userComments = [],
    isLoading: isLoadingComments,
    error: commentsError,
  } = useCommentsByAuthor(profileUser?.id || '', {
    // Fetch comments for the profile being viewed
    limit: PAGINATION.DEFAULT_LIMIT,
  });

  // Follow/Unfollow functionality (ต้องเรียกก่อน early returns)
  const { handleToggleFollow, isLoading: isFollowLoading } = useToggleFollow();

  // Loading state
  if (!hasHydrated || isLoadingOtherProfile) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โปรไฟล์", href: `/profile/${username}` },
        ]}
      >
        <PageWrap>
          <LoadingState message={LOADING_MESSAGES.PROFILE.LOADING} />
        </PageWrap>
      </AppLayout>
    );
  }

  // Error loading other user profile
  if (errorOtherProfile) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โปรไฟล์", href: `/profile/${username}` },
        ]}
      >
        <PageWrap>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">ไม่พบโปรไฟล์</h2>
            <p className="text-muted-foreground mb-6">
              {errorOtherProfile instanceof Error ? errorOtherProfile.message : 'ไม่พบผู้ใช้ที่ต้องการ'}
            </p>
            <Button onClick={() => router.push("/")}>
              กลับหน้าหลัก
            </Button>
          </div>
        </PageWrap>
      </AppLayout>
    );
  }

  // No user data
  if (!profileUser) {
    return (
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "โปรไฟล์", href: `/profile/${username}` },
        ]}
      >
        <PageWrap>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">ไม่พบโปรไฟล์</h2>
            <p className="text-muted-foreground mb-6">
              ไม่พบข้อมูลผู้ใช้
            </p>
            <Button onClick={() => router.push("/")}>
              กลับหน้าหลัก
            </Button>
          </div>
        </PageWrap>
      </AppLayout>
    );
  }

  const handleFollow = () => {
    // ✅ Require auth before following
    if (!requireAuth('ติดตาม')) return;

    if (profileUser && 'isFollowing' in profileUser) {
      const isFollowing = profileUser.isFollowing === true;
      handleToggleFollow(profileUser.id, isFollowing);
    }
  };

  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: `@${username}` },
      ]}
    >
      {/* Profile Header + Tabs Header - wrapped with PageWrap */}
      <PageWrap>
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-start mb-6">
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
                  <>
                    <Button
                      onClick={() => {
                        if (!currentUser) {
                          toast.error(TOAST_MESSAGES.AUTH.UNAUTHORIZED);
                          router.push('/login');
                          return;
                        }
                        router.push(`/chat/${profileUser.username}`);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      แชท
                    </Button>
                    <Button
                      onClick={handleFollow}
                      size="sm"
                      variant={'isFollowing' in profileUser && profileUser.isFollowing ? "outline" : "default"}
                      disabled={isFollowLoading}
                    >
                      {'isFollowing' in profileUser && profileUser.isFollowing ? (
                        <>
                          <UserMinus className="mr-2 h-4 w-4" />
                          เลิกติดตาม
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          ติดตาม
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileUser.bio && (
              <div className="mt-2 text-sm text-foreground/90 line-clamp-2">
                <LinkifiedContent>{profileUser.bio}</LinkifiedContent>
              </div>
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
                    rel="nofollow noopener noreferrer"
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
              <button
                className="flex items-center gap-1 hover:underline"
                onClick={() => router.push(`/profile/${profileUser.username}/followers`)}
              >
                <span className="font-bold">{profileUser.followersCount?.toLocaleString() || 0}</span>
                <span className="text-muted-foreground">ผู้ติดตาม</span>
              </button>
              <button
                className="flex items-center gap-1 hover:underline"
                onClick={() => router.push(`/profile/${profileUser.username}/following`)}
              >
                <span className="font-bold">{profileUser.followingCount?.toLocaleString() || 0}</span>
                <span className="text-muted-foreground">ติดตาม</span>
              </button>
            </div>
          </div>
        </div>
      </PageWrap>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Tabs Header - wrapped with PageWrap */}
        <PageWrap>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="posts" className="gap-2">
              <FileText size={16} />
              โพสต์ ({userPosts.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2">
              <MessageSquare size={16} />
              คอมเมนต์ ({userComments.length})
            </TabsTrigger>
          </TabsList>
        </PageWrap>

        {/* Posts Tab - NO WRAP (edge-to-edge) */}
        <TabsContent value="posts" className="mt-6">
          <InfinitePostFeed
            posts={userPosts}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            fetchNextPage={fetchNextPage}
            isLoading={isLoadingPosts}
            error={error || null}
          />
        </TabsContent>

        {/* Comments Tab - wrapped with PageWrap */}
        <TabsContent value="comments" className="mt-6">
          <PageWrap>
            {isLoadingComments ? (
              <Card>
                <CardContent>
                  <LoadingState message={LOADING_MESSAGES.COMMENT.LOADING} />
                </CardContent>
              </Card>
            ) : commentsError ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <p className="text-lg text-destructive">
                    {commentsError instanceof Error ? commentsError.message : 'ไม่สามารถโหลดคอมเมนต์ได้'}
                  </p>
                </CardContent>
              </Card>
            ) : userComments.length > 0 ? (
              <div className="space-y-3">
                {userComments.map((comment) => (
                  <ProfileCommentCard key={comment.id} comment={comment} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon="MessageSquare"
                title={isOwnProfile ? "คุณยังไม่มีคอมเมนต์" : "ผู้ใช้ยังไม่มีคอมเมนต์"}
                description="คอมเมนต์ที่โพสต์จะแสดงที่นี่"
              />
            )}
          </PageWrap>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
