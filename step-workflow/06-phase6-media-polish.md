# 🎨 Phase 6: Media & Polish

**Duration:** Week 6 (5-7 days)
**Priority:** 🟢 Low (Polish)
**Dependencies:** Phase 5 (Advanced Features) must be completed
**Status:** 📝 Planning

---

## 🎯 Objectives

1. Enhance media upload experience
2. Implement image optimization
3. Add video processing
4. UI/UX improvements
5. Performance optimization
6. Accessibility improvements
7. Final polish and bug fixes

---

## 📋 Tasks Breakdown

### Step 6.1: Enhanced Media Upload
**Duration:** 2 days
**Files to Modify:**
- [ ] `components/media/MediaUploader.tsx`
- [ ] `components/media/MediaGallery.tsx`
- [ ] `components/media/MediaPreview.tsx`
- [ ] Update `components/post/CreatePostForm.tsx`

**Current Status:**
- ✅ Basic upload exists in media.service
- 🔄 Need enhanced UI/UX

**Features to Implement:**
- [ ] Drag & drop upload
- [ ] Multiple file upload
- [ ] Upload progress bars
- [ ] Image preview before upload
- [ ] Image cropping/editing
- [ ] Remove uploaded media
- [ ] Reorder media
- [ ] Video thumbnail generation
- [ ] File size compression
- [ ] Error handling with retry

**Implementation:**

#### A. MediaUploader Component
```typescript
// components/media/MediaUploader.tsx
interface MediaUploaderProps {
  onUploadComplete: (mediaUrls: string[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function MediaUploader({
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*'],
}: MediaUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<{ [key: string]: number }>({});
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      // Check file type
      const isValidType = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const prefix = type.split('/')[0];
          return file.type.startsWith(prefix);
        }
        return file.type === type;
      });

      if (!isValidType) {
        toast.error(`ไฟล์ ${file.name} มีประเภทที่ไม่รองรับ`);
        return false;
      }

      // Check file size
      const maxSize = file.type.startsWith('image') ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป`);
        return false;
      }

      return true;
    });

    if (files.length + validFiles.length > maxFiles) {
      toast.error(`สามารถอัพโหลดได้สูงสุด ${maxFiles} ไฟล์`);
      return;
    }

    setFiles([...files, ...validFiles]);
    uploadFiles(validFiles);
  };

  const uploadFiles = async (filesToUpload: File[]) => {
    for (const file of filesToUpload) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploading((prev) => ({ ...prev, [fileId]: 0 }));

      try {
        const isImage = file.type.startsWith('image');
        const response = isImage
          ? await mediaService.uploadImage(file, (progress) => {
              setUploading((prev) => ({ ...prev, [fileId]: progress }));
            })
          : await mediaService.uploadVideo(file, (progress) => {
              setUploading((prev) => ({ ...prev, [fileId]: progress }));
            });

        if (response.success) {
          setUploadedUrls((prev) => {
            const newUrls = [...prev, response.data.url];
            onUploadComplete(newUrls);
            return newUrls;
          });
          setUploading((prev) => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }
      } catch (error) {
        toast.error(`ไม่สามารถอัพโหลด ${file.name} ได้`);
        setUploading((prev) => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadedUrls((prev) => {
      const newUrls = prev.filter((_, i) => i !== index);
      onUploadComplete(newUrls);
      return newUrls;
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          ลากไฟล์มาวางที่นี่ หรือ
        </p>
        <Button
          variant="outline"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          เลือกไฟล์
        </Button>
        <input
          id="file-input"
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
        />
        <p className="text-sm text-gray-500 mt-2">
          รองรับ: รูปภาพ (สูงสุด 10MB) และวิดีโอ (สูงสุด 100MB)
        </p>
      </div>

      {/* Preview & Progress */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {files.map((file, index) => {
            const fileId = `${file.name}-${Date.now()}`;
            const progress = uploading[fileId];
            const isUploaded = uploadedUrls[index];

            return (
              <div key={index} className="relative">
                {/* File Preview */}
                {file.type.startsWith('image') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Video className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Upload Progress */}
                {progress !== undefined && progress < 100 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                    <div className="text-white">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <span className="text-sm">{progress}%</span>
                    </div>
                  </div>
                )}

                {/* Success Indicator */}
                {isUploaded && (
                  <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 left-2 bg-red-500 rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

**Checklist:**
- [ ] Drag & drop upload
- [ ] Multiple file upload
- [ ] Upload progress
- [ ] Image preview
- [ ] Remove media
- [ ] File validation
- [ ] Error handling
- [ ] Success feedback

---

### Step 6.2: Image Optimization
**Duration:** 1 day
**Files to Create:**
- [ ] `lib/utils/image-optimizer.ts`
- [ ] Update media uploader to use optimizer

**Features to Implement:**
- [ ] Client-side image compression
- [ ] Resize large images
- [ ] Convert to WebP format (optional)
- [ ] Generate thumbnails
- [ ] Lazy loading for images
- [ ] Blur placeholder (LQIP)

**Implementation:**

```typescript
// lib/utils/image-optimizer.ts
export const imageOptimizer = {
  /**
   * Compress and resize image before upload
   */
  async optimizeImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Resize if too large
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsDataURL(file);
    });
  },

  /**
   * Generate thumbnail
   */
  async generateThumbnail(file: File, size: number = 200): Promise<Blob> {
    return this.optimizeImage(file, size, 0.7);
  },
};
```

**Checklist:**
- [ ] Image compression
- [ ] Resize images
- [ ] Generate thumbnails
- [ ] Lazy loading
- [ ] Blur placeholders

---

### Step 6.3: UI/UX Improvements
**Duration:** 1.5 days
**Files to Modify:**
- Multiple components

**Features to Implement:**
- [ ] Smooth animations and transitions
- [ ] Loading skeletons
- [ ] Toast notifications styling
- [ ] Confirm dialogs styling
- [ ] Keyboard shortcuts
- [ ] Dark mode support (optional)
- [ ] Improved mobile navigation
- [ ] Pull-to-refresh on mobile
- [ ] Infinite scroll improvements

**Implementation:**

#### A. Keyboard Shortcuts
```typescript
// lib/hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Cmd/Ctrl + K - Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        router.push('/search');
      }

      // G + H - Go Home
      if (e.key === 'g' && lastKey === 'g') {
        router.push('/');
      }

      // G + P - Go to Profile
      if (e.key === 'p' && lastKey === 'g') {
        router.push('/profile');
      }

      // G + N - Go to Notifications
      if (e.key === 'n' && lastKey === 'g') {
        router.push('/notifications');
      }

      // C - Create Post
      if (e.key === 'c') {
        router.push('/create-post');
      }

      setLastKey(e.key);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router]);
}
```

#### B. Pull to Refresh
```typescript
// lib/hooks/usePullToRefresh.ts
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  useEffect(() => {
    let startY = 0;
    const threshold = 80;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0 || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startY;

      if (distance > 0) {
        setPullDistance(distance);
        setIsPulling(distance > threshold);
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling) {
        await onRefresh();
      }
      setPullDistance(0);
      setIsPulling(false);
      startY = 0;
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, onRefresh]);

  return { isPulling, pullDistance };
}
```

**Checklist:**
- [ ] Smooth animations
- [ ] Loading skeletons
- [ ] Toast styling
- [ ] Keyboard shortcuts
- [ ] Mobile improvements
- [ ] Pull-to-refresh

---

### Step 6.4: Performance Optimization
**Duration:** 1.5 days
**Files to Modify:**
- Various components and configurations

**Features to Implement:**
- [ ] Code splitting
- [ ] Lazy loading components
- [ ] Image lazy loading
- [ ] Virtual scrolling for long lists
- [ ] Debouncing search input
- [ ] Caching API responses
- [ ] Service Worker (PWA)
- [ ] Bundle size optimization
- [ ] Lighthouse score improvement

**Implementation:**

#### A. Code Splitting & Lazy Loading
```typescript
// Dynamic imports for heavy components
const CommentList = dynamic(() => import('@/components/comment/CommentList'), {
  loading: () => <LoadingSkeleton />,
  ssr: false,
});

const MediaUploader = dynamic(() => import('@/components/media/MediaUploader'), {
  loading: () => <div>Loading uploader...</div>,
  ssr: false,
});
```

#### B. Virtual Scrolling for Large Lists
```typescript
// Using react-window for virtualization
import { FixedSizeList } from 'react-window';

export function VirtualizedPostFeed({ posts }: { posts: Post[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={800}
      itemCount={posts.length}
      itemSize={300}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

#### C. API Response Caching
```typescript
// Using React Query or SWR for caching
import useSWR from 'swr';

export function usePost(postId: string) {
  const { data, error, mutate } = useSWR(
    postId ? `/posts/${postId}` : null,
    () => postService.getById(postId),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    post: data?.data,
    isLoading: !error && !data,
    isError: error,
    refetch: mutate,
  };
}
```

#### D. Search Debouncing
```typescript
// lib/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage in search component
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);
};
```

**Checklist:**
- [ ] Code splitting
- [ ] Lazy loading
- [ ] Virtual scrolling
- [ ] Debouncing
- [ ] API caching
- [ ] Bundle optimization
- [ ] Lighthouse > 90

---

### Step 6.5: Accessibility Improvements
**Duration:** 1 day
**Files to Modify:**
- All components

**Features to Implement:**
- [ ] Semantic HTML
- [ ] ARIA labels and roles
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader support
- [ ] Color contrast compliance
- [ ] Alt text for images
- [ ] Form labels and error announcements

**Implementation:**

```typescript
// Example: Accessible Button
<button
  type="button"
  aria-label="Upvote post"
  aria-pressed={userVote === 'upvote'}
  onClick={handleUpvote}
>
  <ArrowUp className="h-4 w-4" aria-hidden="true" />
  <span className="sr-only">Upvote</span>
</button>

// Example: Accessible Form
<form onSubmit={handleSubmit} aria-labelledby="form-title">
  <h2 id="form-title">Create Post</h2>

  <label htmlFor="title">
    Title
    <span aria-label="required">*</span>
  </label>
  <input
    id="title"
    type="text"
    aria-required="true"
    aria-invalid={!!errors.title}
    aria-describedby={errors.title ? 'title-error' : undefined}
  />
  {errors.title && (
    <span id="title-error" role="alert" className="text-red-600">
      {errors.title.message}
    </span>
  )}
</form>

// Example: Skip to Content Link
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

**Checklist:**
- [ ] Semantic HTML
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus management
- [ ] Screen reader testing
- [ ] Color contrast check
- [ ] Alt text for images

---

### Step 6.6: Final Polish & Bug Fixes
**Duration:** 1 day

**Tasks:**
- [ ] Fix any remaining bugs
- [ ] Test all features end-to-end
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Performance profiling
- [ ] Security audit
- [ ] Code cleanup and refactoring
- [ ] Documentation updates

**Testing Checklist:**
- [ ] ✅ All pages load correctly
- [ ] ✅ All forms work as expected
- [ ] ✅ Authentication works
- [ ] ✅ CRUD operations work
- [ ] ✅ Social interactions work
- [ ] ✅ Search works
- [ ] ✅ Media upload works
- [ ] ✅ Mobile responsive
- [ ] ✅ No console errors
- [ ] ✅ Performance acceptable
- [ ] ✅ Accessibility compliant

---

## ✅ Definition of Done

### Functional Requirements
- [ ] Enhanced media upload with drag & drop
- [ ] Image optimization working
- [ ] Smooth animations throughout
- [ ] Keyboard shortcuts implemented
- [ ] Mobile UX improved
- [ ] Performance optimized
- [ ] Accessibility standards met

### Technical Requirements
- [ ] Lighthouse score > 90
- [ ] Bundle size optimized
- [ ] Code splitting implemented
- [ ] API responses cached
- [ ] Images lazy loaded
- [ ] Virtual scrolling for large lists
- [ ] No memory leaks
- [ ] Cross-browser compatible

### Testing Checklist
- [ ] ✅ All features work
- [ ] ✅ No critical bugs
- [ ] ✅ Performance acceptable
- [ ] ✅ Mobile responsive
- [ ] ✅ Accessible
- [ ] ✅ SEO optimized

---

## 🎉 Project Complete!

Congratulations! You've completed all 6 phases of the social media application development.

### Next Steps (Optional):
1. **Beta Testing** - Invite users to test the application
2. **Analytics** - Add Google Analytics or similar
3. **Error Tracking** - Implement Sentry or similar
4. **CI/CD** - Setup automated deployment
5. **Monitoring** - Add application monitoring
6. **Documentation** - Write user documentation
7. **Marketing** - Launch the application!

### Continuous Improvement:
- Monitor user feedback
- Fix bugs as they arise
- Add new features based on user requests
- Keep dependencies updated
- Monitor performance metrics
- Security updates

---

## 📚 Resources

- **Next.js Docs:** https://nextjs.org/docs
- **React Docs:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Shadcn UI:** https://ui.shadcn.com
- **Accessibility:** https://www.w3.org/WAI/WCAG21/quickref
- **Performance:** https://web.dev/performance
