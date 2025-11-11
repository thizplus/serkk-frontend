/**
 * ตัวอย่างการใช้ Debug Tools
 *
 * Copy code จากไฟล์นี้ไปใช้ใน component ที่ต้องการ debug
 */

import { useRenderCount, useWhyDidYouUpdate } from '@/shared/hooks/useRenderCount';
import { logger, DEBUG_CATEGORIES } from '@/shared/lib/utils/logger';

// ============================================================================
// Example 1: ติดตาม Component Render Count
// ============================================================================

function PostCardExample({ post, onVote, onComment }) {
  // ✅ เพิ่มบรรทัดนี้เพื่อดูว่า component render กี่ครั้ง
  useRenderCount('PostCard', { postId: post.id });

  return (
    <div>
      <h1>{post.title}</h1>
      {/* ... rest of component ... */}
    </div>
  );
}

// Output เมื่อเปิด debug mode:
// [14:30:15] [RENDER] PostCard rendered #1
// [14:30:16] [RENDER] PostCard rendered #2
// [14:30:17] [RENDER] PostCard rendered #3

// ============================================================================
// Example 2: ดูว่า Props ไหนเปลี่ยนทำให้ Re-render
// ============================================================================

function PostCardWithWhyUpdate({ post, onVote, onComment }) {
  // ✅ แสดงว่า props ไหนเปลี่ยน
  useWhyDidYouUpdate('PostCard', { post, onVote, onComment });

  return (
    <div>
      <h1>{post.title}</h1>
      {/* ... rest of component ... */}
    </div>
  );
}

// Output เมื่อเปิด debug mode:
// 📦 PostCard - Props Changed
//   [RENDER] Changed props: {
//     post: { from: {...}, to: {...} },
//     onVote: { from: [Function], to: [Function] }
//   }

// ============================================================================
// Example 3: Custom Debug Log สำหรับ Upload
// ============================================================================

function CreatePostFormExample() {
  const handleFileUpload = async (files: File[]) => {
    // ✅ Log ก่อน upload
    logger.debug(DEBUG_CATEGORIES.UPLOAD, 'Starting batch upload', {
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      fileTypes: files.map(f => f.type),
    });

    // Start performance timer
    logger.time('Batch Upload');

    try {
      // ... upload logic ...
      const result = await uploadMultipleFiles(files);

      // ✅ Log หลัง upload สำเร็จ
      logger.debug(DEBUG_CATEGORIES.UPLOAD, 'Upload completed', {
        successCount: result.successCount,
        failedCount: result.failedCount,
      });

      logger.timeEnd('Batch Upload');
    } catch (error) {
      // ✅ Error log (แสดงทั้ง dev และ production)
      logger.error('Upload failed', error);
      logger.timeEnd('Batch Upload');
    }
  };

  return <div>...</div>;
}

// Output เมื่อเปิด debug mode + category 'upload':
// [14:30:20] [UPLOAD] Starting batch upload { fileCount: 5, totalSize: 10485760, ... }
// [14:30:25] [UPLOAD] Upload completed { successCount: 5, failedCount: 0 }
// ⏱️ Batch Upload: 5234.56ms

// ============================================================================
// Example 4: Debug State Changes
// ============================================================================

function FormExample() {
  const [formData, setFormData] = useState({});

  const handleChange = (field: string, value: any) => {
    logger.debug(DEBUG_CATEGORIES.STATE, 'Form field changed', {
      field,
      oldValue: formData[field],
      newValue: value,
    });

    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return <div>...</div>;
}

// Output:
// [14:30:22] [STATE] Form field changed { field: 'title', oldValue: '', newValue: 'Hello' }

// ============================================================================
// Example 5: Debug API Calls
// ============================================================================

async function fetchPosts(sortBy: string) {
  logger.debug(DEBUG_CATEGORIES.API, 'Fetching posts', { sortBy });
  logger.time('Fetch Posts API');

  try {
    const response = await fetch(`/api/posts?sort=${sortBy}`);
    const data = await response.json();

    logger.debug(DEBUG_CATEGORIES.API, 'Posts fetched', {
      count: data.posts.length,
      hasMore: data.hasMore,
    });

    logger.timeEnd('Fetch Posts API');
    return data;
  } catch (error) {
    logger.error('Failed to fetch posts', error);
    logger.timeEnd('Fetch Posts API');
    throw error;
  }
}

// Output:
// [14:30:23] [API] Fetching posts { sortBy: 'hot' }
// [14:30:24] [API] Posts fetched { count: 20, hasMore: true }
// ⏱️ Fetch Posts API: 1234.56ms

// ============================================================================
// Example 6: Performance Monitoring
// ============================================================================

function ExpensiveComponent({ data }) {
  logger.time('ExpensiveComponent render');

  // Expensive computation
  const processedData = useMemo(() => {
    logger.time('Data processing');
    const result = data.map(/* ... expensive operation ... */);
    logger.timeEnd('Data processing');
    return result;
  }, [data]);

  logger.timeEnd('ExpensiveComponent render');

  return <div>{/* ... */}</div>;
}

// Output:
// ⏱️ Data processing: 145.32ms
// ⏱️ ExpensiveComponent render: 156.78ms

// ============================================================================
// วิธีใช้งาน (ใน Browser Console)
// ============================================================================

/*
// 1. เปิด debug mode
debugMode.enable()
location.reload()

// 2. เปิดเฉพาะ category ที่ต้องการ
debugMode.setCategories(['upload', 'render'])
location.reload()

// 3. ดู status
debugMode.status()

// 4. ปิด debug mode
debugMode.disable()
*/

// ============================================================================
// เทียบกับ React DevTools
// ============================================================================

/*
Custom Logger vs React DevTools:

✅ Custom Logger:
- ควบคุม log ได้แม่นยำ (เปิด/ปิด ตาม category)
- เห็นข้อมูลที่เราสนใจ (props, state, timing)
- เก็บ log ได้ (copy จาก console)

✅ React DevTools Profiler:
- เห็นภาพรวมทั้งระบบ (component tree)
- Flame graph แสดง bottleneck ชัดเจน
- วัด render time แม่นยำมาก

👉 แนะนำใช้ทั้ง 2 อย่างร่วมกัน!
*/
