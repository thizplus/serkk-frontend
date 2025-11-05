# 🔍 Phase 5: Advanced Features

**Duration:** Week 5 (5-7 days)
**Priority:** 🟡 Medium
**Dependencies:** Phase 4 (User Features) must be completed
**Status:** 📝 Planning

---

## 🎯 Objectives

1. Implement search functionality (posts, users, tags)
2. Create tags system with browsing
3. Add trending/popular posts
4. Implement search history
5. Advanced filtering and sorting

---

## 📋 Tasks Breakdown

### Step 5.1: Search Page - Basic Implementation
**Duration:** 2 days
**Files to Modify:**
- [ ] `app/search/page.tsx`
- [ ] `components/search/SearchBar.tsx`
- [ ] `components/search/SearchResults.tsx`
- [ ] `components/search/SearchFilters.tsx`

**Current Status:**
- ✅ Page route exists
- 🔄 Need to implement

**Features to Implement:**
- [ ] Search bar with query input
- [ ] Search type selector (all, posts, users, tags)
- [ ] Display search results
- [ ] Pagination
- [ ] Loading states
- [ ] Empty states ("ไม่พบผลลัพธ์")
- [ ] Recent searches
- [ ] Popular searches
- [ ] Clear search history

**Implementation:**

#### A. Search Page
```typescript
// app/search/page.tsx
'use client';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchType, setSearchType] = useState<'all' | 'posts' | 'users' | 'tags'>(
    (searchParams.get('type') as any) || 'all'
  );
  const [results, setResults] = useState<SearchResponse['data'] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  useEffect(() => {
    if (query) {
      performSearch();
    } else {
      fetchPopularSearches();
      fetchSearchHistory();
    }
  }, [query, searchType]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await searchService.search({
        q: query,
        type: searchType,
        offset: 0,
        limit: 20,
      });

      if (response.success) {
        setResults(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถค้นหาได้');
    } finally {
      setIsSearching(false);
    }
  };

  const fetchPopularSearches = async () => {
    try {
      const response = await searchService.getPopular({ limit: 10 });
      if (response.success) {
        setPopularSearches(response.data.queries);
      }
    } catch (error) {
      console.error('Failed to fetch popular searches', error);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const response = await searchService.getHistory({ offset: 0, limit: 10 });
      if (response.success) {
        setSearchHistory(response.data.history);
      }
    } catch (error) {
      console.error('Failed to fetch search history', error);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}`);
  };

  const handleDeleteHistoryItem = async (id: string) => {
    try {
      await searchService.deleteHistoryItem(id);
      setSearchHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      toast.error('ไม่สามารถลบประวัติได้');
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบประวัติการค้นหาทั้งหมด?')) {
      return;
    }

    try {
      await searchService.clearHistory();
      setSearchHistory([]);
      toast.success('ลบประวัติการค้นหาแล้ว');
    } catch (error) {
      toast.error('ไม่สามารถลบประวัติได้');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={query}
          onSearch={handleSearch}
          placeholder="ค้นหาโพสต์, ผู้ใช้, หรือแท็ก..."
        />

        {/* Search Type Tabs */}
        <Tabs value={searchType} onValueChange={(v) => setSearchType(v as any)} className="mt-4">
          <TabsList>
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="posts">โพสต์</TabsTrigger>
            <TabsTrigger value="users">ผู้ใช้</TabsTrigger>
            <TabsTrigger value="tags">แท็ก</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search Results or Suggestions */}
      {query ? (
        <SearchResults results={results} isLoading={isSearching} query={query} />
      ) : (
        <div className="space-y-6">
          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">คำค้นหายอดนิยม</h2>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((search, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(search)}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">ประวัติการค้นหา</h2>
                <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                  ลบทั้งหมด
                </Button>
              </div>
              <div className="space-y-2">
                {searchHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <button
                      onClick={() => handleSearch(item.query)}
                      className="flex items-center gap-2 flex-1 text-left hover:text-blue-600"
                    >
                      <History className="h-4 w-4 text-gray-400" />
                      <span>{item.query}</span>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteHistoryItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

#### B. SearchResults Component
```typescript
// components/search/SearchResults.tsx
interface SearchResultsProps {
  results: SearchResponse['data'] | null;
  isLoading: boolean;
  query: string;
}

export function SearchResults({ results, isLoading, query }: SearchResultsProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!results) {
    return null;
  }

  const { posts, users, tags } = results;
  const hasResults = posts.length > 0 || users.length > 0 || tags.length > 0;

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">ไม่พบผลลัพธ์</h2>
        <p className="text-gray-500 mt-2">
          ไม่พบผลลัพธ์สำหรับ "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Posts */}
      {posts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            โพสต์ ({posts.length})
          </h2>
          <PostFeed posts={posts} />
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            ผู้ใช้ ({users.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            แท็ก ({tags.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.name}`}>
                <Button variant="outline">
                  <Hash className="h-4 w-4 mr-1" />
                  {tag.name}
                  <span className="ml-2 text-xs text-gray-500">
                    {tag.postCount} โพสต์
                  </span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Search bar with query input
- [ ] Search type selector
- [ ] Display search results
- [ ] Popular searches
- [ ] Search history
- [ ] Delete history item
- [ ] Clear all history
- [ ] Loading states
- [ ] Empty states
- [ ] Pagination (future enhancement)

---

### Step 5.2: Tag System & Browse by Tag
**Duration:** 1.5 days
**Files to Create:**
- [ ] `app/tag/[name]/page.tsx`
- [ ] `app/tags/page.tsx`
- [ ] `components/tag/TagCard.tsx`
- [ ] `components/tag/PopularTags.tsx`

**Features to Implement:**
- [ ] Browse all tags page
- [ ] Tag detail page (posts with tag)
- [ ] Popular tags section
- [ ] Tag search/filter
- [ ] Post count per tag
- [ ] Sort tags (popular, alphabetical)

**Implementation:**

#### A. All Tags Page
```typescript
// app/tags/page.tsx
'use client';

export default function AllTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'popular' | 'alphabetical'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTags();
  }, [sortBy]);

  const fetchTags = async () => {
    try {
      setIsLoading(true);
      const response = sortBy === 'popular'
        ? await tagService.getPopular({ limit: 100 })
        : await tagService.list({ offset: 0, limit: 100 });

      if (response.success) {
        setTags(response.data.tags);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดแท็กได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchTags();
      return;
    }

    try {
      const response = await tagService.search({ q: query, limit: 50 });
      if (response.success) {
        setTags(response.data.tags);
      }
    } catch (error) {
      toast.error('ไม่สามารถค้นหาแท็กได้');
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">แท็กทั้งหมด</h1>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="ค้นหาแท็ก..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
        />

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">ยอดนิยม</SelectItem>
            <SelectItem value="alphabetical">เรียงตามตัวอักษร</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <TagCard key={tag.id} tag={tag} />
        ))}
      </div>

      {tags.length === 0 && (
        <div className="text-center py-12">
          <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ไม่พบแท็ก</p>
        </div>
      )}
    </div>
  );
}
```

#### B. Tag Detail Page (Posts by Tag)
```typescript
// app/tag/[name]/page.tsx
'use client';

interface TagPageProps {
  params: { name: string };
}

export default function TagPage({ params }: TagPageProps) {
  const tagName = decodeURIComponent(params.name);
  const [tag, setTag] = useState<Tag | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');

  useEffect(() => {
    fetchTag();
    fetchPosts();
  }, [tagName, sortBy]);

  const fetchTag = async () => {
    try {
      const response = await tagService.getByName(tagName);
      if (response.success) {
        setTag(response.data);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดข้อมูลแท็กได้');
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await postService.getByTag(tagName, {
        offset: 0,
        limit: 20,
        sortBy,
      });

      if (response.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tag Header */}
      {tag && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">{tag.name}</h1>
                <p className="text-gray-500">{tag.postCount} โพสต์</p>
              </div>
            </div>
            {tag.description && (
              <p className="mt-3 text-gray-700">{tag.description}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sort Options */}
      <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="hot">ยอดนิยม</TabsTrigger>
          <TabsTrigger value="new">ใหม่</TabsTrigger>
          <TabsTrigger value="top">ยอดโหวตสูงสุด</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Posts */}
      {posts.length > 0 ? (
        <PostFeed posts={posts} />
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีโพสต์ในแท็กนี้</p>
        </div>
      )}
    </div>
  );
}
```

#### C. TagCard Component
```typescript
// components/tag/TagCard.tsx
interface TagCardProps {
  tag: Tag;
}

export function TagCard({ tag }: TagCardProps) {
  return (
    <Link href={`/tag/${tag.name}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Hash className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{tag.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {tag.postCount} โพสต์
              </p>
              {tag.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  {tag.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Checklist:**
- [ ] All tags page
- [ ] Tag detail page
- [ ] Popular tags
- [ ] Tag search
- [ ] Sort options
- [ ] Post count display
- [ ] Loading states
- [ ] Empty states

---

### Step 5.3: Trending & Popular Posts
**Duration:** 1.5 days
**Files to Create:**
- [ ] `app/trending/page.tsx`
- [ ] `components/home/TrendingSection.tsx`
- [ ] Update `app/page.tsx` to include trending sidebar

**Features to Implement:**
- [ ] Trending posts page
- [ ] Hot posts algorithm (votes + recency)
- [ ] Top posts (all time, this week, this month)
- [ ] Trending tags widget
- [ ] Popular users widget

**Implementation:**

#### A. Trending Page
```typescript
// app/trending/page.tsx
'use client';

export default function TrendingPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchTrendingPosts();
  }, [timeRange]);

  const fetchTrendingPosts = async () => {
    try {
      setIsLoading(true);
      const response = await postService.list({
        offset: 0,
        limit: 50,
        sortBy: 'top',
        timeRange,
      });

      if (response.success) {
        setPosts(response.data.posts);
      }
    } catch (error) {
      toast.error('ไม่สามารถโหลดโพสต์ยอดนิยมได้');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">โพสต์ยอดนิยม</h1>

      <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="day">วันนี้</TabsTrigger>
          <TabsTrigger value="week">สัปดาห์นี้</TabsTrigger>
          <TabsTrigger value="month">เดือนนี้</TabsTrigger>
          <TabsTrigger value="all">ตลอดกาล</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <LoadingSkeleton />
      ) : posts.length > 0 ? (
        <PostFeed posts={posts} />
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีโพสต์ยอดนิยม</p>
        </div>
      )}
    </div>
  );
}
```

#### B. Trending Sidebar Component (for Home Page)
```typescript
// components/home/TrendingSidebar.tsx
export function TrendingSidebar() {
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetchPopularTags();
    fetchPopularPosts();
  }, []);

  const fetchPopularTags = async () => {
    try {
      const response = await tagService.getPopular({ limit: 10 });
      if (response.success) {
        setPopularTags(response.data.tags);
      }
    } catch (error) {
      console.error('Failed to fetch popular tags', error);
    }
  };

  const fetchPopularPosts = async () => {
    try {
      const response = await postService.list({
        offset: 0,
        limit: 5,
        sortBy: 'hot',
      });

      if (response.success) {
        setPopularPosts(response.data.posts);
      }
    } catch (error) {
      console.error('Failed to fetch popular posts', error);
    }
  };

  return (
    <aside className="w-80 space-y-6">
      {/* Popular Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">แท็กยอดนิยม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Link key={tag.id} href={`/tag/${tag.name}`}>
                <Button variant="outline" size="sm">
                  #{tag.name}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trending Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">โพสต์ยอดนิยม</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {popularPosts.map((post, index) => (
              <Link key={post.id} href={`/post/${post.id}`}>
                <div className="flex gap-2 hover:bg-gray-50 p-2 rounded">
                  <span className="font-bold text-gray-400">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium line-clamp-2">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.voteCount} โหวต
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
```

**Checklist:**
- [ ] Trending page
- [ ] Time range filter
- [ ] Trending sidebar
- [ ] Popular tags widget
- [ ] Popular posts widget
- [ ] Loading states

---

### Step 5.4: Advanced Filtering & Sorting
**Duration:** 1 day
**Files to Modify:**
- [ ] `app/page.tsx`
- [ ] `components/post/PostFilters.tsx`

**Features to Implement:**
- [ ] Filter by date range
- [ ] Filter by vote count
- [ ] Sort by: hot, new, top, controversial
- [ ] Persist user preferences
- [ ] Reset filters

**Implementation:**

```typescript
// components/post/PostFilters.tsx
interface PostFiltersProps {
  onFilterChange: (filters: PostFilters) => void;
}

export function PostFilters({ onFilterChange }: PostFiltersProps) {
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top' | 'controversial'>('hot');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [minVotes, setMinVotes] = useState(0);

  useEffect(() => {
    onFilterChange({
      sortBy,
      timeRange,
      minVotes,
    });
  }, [sortBy, timeRange, minVotes]);

  const handleReset = () => {
    setSortBy('hot');
    setTimeRange('all');
    setMinVotes(0);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-wrap gap-4">
          {/* Sort By */}
          <div className="flex-1 min-w-[200px]">
            <Label>เรียงตาม</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">ยอดนิยม</SelectItem>
                <SelectItem value="new">ใหม่</SelectItem>
                <SelectItem value="top">ยอดโหวตสูงสุด</SelectItem>
                <SelectItem value="controversial">ถกเถียง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Range */}
          {sortBy === 'top' && (
            <div className="flex-1 min-w-[200px]">
              <Label>ช่วงเวลา</Label>
              <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">วันนี้</SelectItem>
                  <SelectItem value="week">สัปดาห์นี้</SelectItem>
                  <SelectItem value="month">เดือนนี้</SelectItem>
                  <SelectItem value="all">ตลอดกาล</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reset Button */}
          <div className="flex items-end">
            <Button variant="outline" onClick={handleReset}>
              รีเซ็ต
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Checklist:**
- [ ] Sort options
- [ ] Time range filter
- [ ] Vote count filter
- [ ] Reset filters
- [ ] Persist preferences

---

## ✅ Definition of Done

### Functional Requirements
- [ ] Users can search for posts, users, and tags
- [ ] Search results display correctly for each type
- [ ] Popular searches are shown
- [ ] Search history is saved and can be cleared
- [ ] Users can browse all tags
- [ ] Users can view posts by tag
- [ ] Trending/popular posts page works
- [ ] Filtering and sorting options work
- [ ] Widgets show popular content

### Technical Requirements
- [ ] Search debouncing (avoid too many API calls)
- [ ] Pagination for search results
- [ ] Loading states
- [ ] Empty states
- [ ] SEO metadata for tag pages
- [ ] Mobile responsive
- [ ] Filter preferences saved in localStorage

### Testing Checklist
- [ ] ✅ Search for posts → Shows correct results
- [ ] ✅ Search for users → Shows correct results
- [ ] ✅ Search for tags → Shows correct results
- [ ] ✅ Click popular search → Performs search
- [ ] ✅ View search history → Shows recent searches
- [ ] ✅ Delete history item → Removes from list
- [ ] ✅ Clear all history → Removes all
- [ ] ✅ Browse all tags → Shows all tags
- [ ] ✅ View posts by tag → Shows filtered posts
- [ ] ✅ View trending posts → Shows popular posts
- [ ] ✅ Filter by time range → Shows correct results
- [ ] ✅ Sort posts → Order changes correctly

---

## 🔜 Next Steps

After completing Phase 5, proceed to:
→ **Phase 6: Media & Polish** (`06-phase6-media-polish.md`)
- Enhanced media upload
- Image optimization
- Video processing
- UI/UX improvements
- Performance optimization
