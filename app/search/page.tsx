"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layouts/AppLayout";
import { PageWrap } from "@/shared/components/layouts/PageWrap";
import { PostFeed } from "@/features/posts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, User, Loader2 } from "@/config/icons";
import { useSearch } from "@/features/search";
import type { User as UserType } from "@/types/models";
import { LoadingState, EmptyState } from "@/components/common";
import { LOADING_MESSAGES, PAGINATION } from "@/config";

export const dynamic = 'force-dynamic';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("posts");

  // Sync with URL params
  useEffect(() => {
    const query = searchParams.get("q") || "";
    if (query !== searchQuery) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // ค้นหาจาก API
  const { data: searchResults, isLoading, error } = useSearch(
    {
      q: searchQuery,
      type: 'all',
      limit: PAGINATION.MESSAGE_LIMIT,
    },
    {
      enabled: searchQuery.trim().length > 0, // เรียก API เฉพาะเมื่อมีคำค้นหา
    }
  );

  const filteredPosts = searchResults && 'posts' in searchResults ? searchResults.posts : [];
  const filteredUsers = searchResults && 'users' in searchResults ? searchResults.users : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);

    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };


  return (
    <AppLayout
      breadcrumbs={[
        { label: "หน้าหลัก", href: "/" },
        { label: "ค้นหา" },
      ]}
    >
      {/* Search Header + Search Bar + Tabs - wrapped with PageWrap */}
      <PageWrap>
        <div className="space-y-6">
          {/* Search Header */}
          <div>
            <h1 className="text-3xl font-bold">ค้นหา</h1>
            <p className="text-muted-foreground mt-1">
              ค้นหาโพสต์และผู้ใช้ในชุมชน
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                type="text"
                placeholder="ค้นหาโพสต์, ผู้ใช้, หรือแท็ก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              ค้นหา
            </Button>
          </form>

          {/* Loading State */}
          {isLoading && searchQuery.trim() && (
            <Card>
              <CardContent>
                <LoadingState message={LOADING_MESSAGES.SEARCH.LOADING} />
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-lg text-destructive mb-2">
                  ไม่สามารถค้นหาได้
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

          {/* Results with Tabs */}
          {!isLoading && !error && searchQuery.trim() && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="posts" className="gap-2">
                  <FileText size={16} />
                  โพสต์ ({filteredPosts.length})
                </TabsTrigger>
                <TabsTrigger value="users" className="gap-2">
                  <User size={16} />
                  ผู้ใช้ ({filteredUsers.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-6">
                {filteredPosts.length > 0 ? (
                  <div />
                ) : (
                  <EmptyState
                    icon="Search"
                    title="ไม่พบโพสต์"
                    description="ลองค้นหาด้วยคำอื่นหรือเปลี่ยนตัวกรอง"
                  />
                )}
              </TabsContent>

            <TabsContent value="users" className="mt-6">
            {filteredUsers.length > 0 ? (
              <div className="space-y-4">
                {filteredUsers.map((user: UserType) => (
                  <Card
                    key={user.id}
                    className="cursor-pointer hover:border-accent transition-colors"
                    onClick={() => router.push(`/profile/${user.username}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                          {user.displayName.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{user.displayName}</h3>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                          {user.bio && (
                            <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{user.karma?.toLocaleString() || 0} Karma</span>
                            <span>{user.followersCount?.toLocaleString() || 0} ผู้ติดตาม</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon="User"
                title="ไม่พบผู้ใช้"
                description="ลองค้นหาด้วยชื่ออื่น"
              />
            )}
            </TabsContent>
          </Tabs>
          )}

          {/* Initial State - ยังไม่ได้ค้นหา */}
          {!searchQuery.trim() && (
            <Card>
              <CardContent className="py-16 text-center">
                <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">เริ่มค้นหา</h3>
                <p className="text-muted-foreground">
                  พิมพ์คำค้นหาในช่องด้านบนเพื่อค้นหาโพสต์และผู้ใช้
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </PageWrap>

      {/* Post Feed - NO WRAP (edge-to-edge) */}
      {!isLoading && !error && searchQuery.trim() && activeTab === "posts" && filteredPosts.length > 0 && (
        <PostFeed posts={filteredPosts} />
      )}
    </AppLayout>
  );
}

// Wrap with Suspense to handle useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <AppLayout
        breadcrumbs={[
          { label: "หน้าหลัก", href: "/" },
          { label: "ค้นหา" },
        ]}
      >
        <PageWrap>
          <LoadingState message={LOADING_MESSAGES.SEARCH.LOADING} />
        </PageWrap>
      </AppLayout>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
