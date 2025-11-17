// ============================================================================
// IndexedDB Storage for Optimistic Posts (Phase 2)
// ============================================================================
//
// Purpose:
// - Persist optimistic posts to survive page refresh (F5)
// - Store upload progress and resume capability
// - Store drafts with auto-save
// - Store file blobs for resume upload capability
// - Sync with Zustand store (in-memory)
//
// Schema:
// - Database: "optimistic-posts-db"
// - Version: 2 (upgraded for drafts + files support)
// - Stores:
//   - "posts" (keyPath: "tempId") - Optimistic posts
//   - "drafts" (keyPath: "draftId") - Draft posts
//   - "files" (keyPath: "fileId") - File blobs
//
// ============================================================================

import type { OptimisticPost } from '@/features/posts/stores/optimisticPostStore';

const DB_NAME = 'optimistic-posts-db';
const DB_VERSION = 2; // ✅ Upgraded to v2 for drafts + files support
const STORE_NAME = 'posts';
const DRAFTS_STORE_NAME = 'drafts';
const FILES_STORE_NAME = 'files';

// ============================================================================
// Types
// ============================================================================

/**
 * IndexedDB stored post (compatible with OptimisticPost)
 * ⚠️ Cannot store File objects - only metadata
 */
export interface StoredOptimisticPost extends Omit<OptimisticPost, 'media'> {
  media: {
    fileId: string;           // Unique ID for the file
    fileName: string;         // Original file name
    fileType: string;         // MIME type
    fileSize: number;         // File size in bytes
    preview: string;          // Data URL preview
    status: 'pending' | 'uploading' | 'completed' | 'failed';
    progress: number;         // 0-100
    mediaId?: string;         // R2 media ID (after upload)
    url?: string;             // R2 URL (after upload)
    error?: string;           // Error message if failed
  }[];

  // Metadata
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}

/**
 * Draft Post (auto-saved in IndexedDB)
 */
export interface DraftPost {
  draftId: string;            // Unique draft ID
  title: string;              // Post title
  content: string;            // Post content
  tags: string[];             // Post tags
  fileIds: string[];          // References to files in FILES_STORE
  createdAt: string;          // ISO timestamp
  updatedAt: string;          // ISO timestamp
}

/**
 * Stored File (Blob storage for resume upload)
 */
export interface StoredFile {
  fileId: string;             // Unique file ID
  name: string;               // Original file name
  type: string;               // MIME type
  size: number;               // File size in bytes
  blob: Blob;                 // Actual file blob
  preview?: string;           // Data URL preview (optional)
  createdAt: string;          // ISO timestamp
}

// ============================================================================
// Database Initialization
// ============================================================================

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB initialized:', DB_NAME);
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // ============================================================================
      // Store 1: Posts (Optimistic Posts)
      // ============================================================================
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'tempId' });

        // Create indexes
        objectStore.createIndex('status', 'status', { unique: false });
        objectStore.createIndex('createdAt', 'createdAt', { unique: false });
        objectStore.createIndex('clientPostId', 'clientPostId', { unique: true });

        console.log('✅ Created object store:', STORE_NAME);
      }

      // ============================================================================
      // Store 2: Drafts (Auto-saved Drafts)
      // ============================================================================
      if (!db.objectStoreNames.contains(DRAFTS_STORE_NAME)) {
        const draftsStore = db.createObjectStore(DRAFTS_STORE_NAME, { keyPath: 'draftId' });

        // Create indexes
        draftsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        draftsStore.createIndex('createdAt', 'createdAt', { unique: false });

        console.log('✅ Created object store:', DRAFTS_STORE_NAME);
      }

      // ============================================================================
      // Store 3: Files (File Blobs for Resume Upload)
      // ============================================================================
      if (!db.objectStoreNames.contains(FILES_STORE_NAME)) {
        const filesStore = db.createObjectStore(FILES_STORE_NAME, { keyPath: 'fileId' });

        // Create indexes
        filesStore.createIndex('createdAt', 'createdAt', { unique: false });
        filesStore.createIndex('name', 'name', { unique: false });

        console.log('✅ Created object store:', FILES_STORE_NAME);
      }
    };
  });
}

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Save optimistic post to IndexedDB
 */
export async function saveOptimisticPost(post: StoredOptimisticPost): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.put({
      ...post,
      updatedAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      console.log('✅ Saved to IndexedDB:', post.tempId);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to save to IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get optimistic post by tempId
 */
export async function getOptimisticPost(tempId: string): Promise<StoredOptimisticPost | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(tempId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('❌ Failed to get from IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all optimistic posts
 */
export async function getAllOptimisticPosts(): Promise<StoredOptimisticPost[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error('❌ Failed to get all from IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get optimistic posts by status
 */
export async function getOptimisticPostsByStatus(
  status: StoredOptimisticPost['status']
): Promise<StoredOptimisticPost[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll(status);

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      console.error('❌ Failed to get by status from IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Update optimistic post (partial update)
 */
export async function updateOptimisticPost(
  tempId: string,
  updates: Partial<StoredOptimisticPost>
): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Get existing post first
    const getRequest = store.get(tempId);

    getRequest.onsuccess = () => {
      const existingPost = getRequest.result;

      if (!existingPost) {
        reject(new Error(`Post not found: ${tempId}`));
        return;
      }

      // Merge updates
      const updatedPost = {
        ...existingPost,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const putRequest = store.put(updatedPost);

      putRequest.onsuccess = () => {
        console.log('✅ Updated in IndexedDB:', tempId);
        resolve();
      };

      putRequest.onerror = () => {
        console.error('❌ Failed to update in IndexedDB:', putRequest.error);
        reject(putRequest.error);
      };
    };

    getRequest.onerror = () => {
      console.error('❌ Failed to get from IndexedDB:', getRequest.error);
      reject(getRequest.error);
    };
  });
}

/**
 * Delete optimistic post
 */
export async function deleteOptimisticPost(tempId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(tempId);

    request.onsuccess = () => {
      console.log('✅ Deleted from IndexedDB:', tempId);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to delete from IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear all optimistic posts
 */
export async function clearAllOptimisticPosts(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('✅ Cleared all from IndexedDB');
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to clear IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

// ============================================================================
// Cleanup Operations
// ============================================================================

/**
 * Remove completed posts older than X hours (default: 1 hour)
 */
export async function cleanupOldPosts(hoursOld: number = 1): Promise<number> {
  const db = await initDB();
  const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000).toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('completed'));

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        const post = cursor.value as StoredOptimisticPost;

        // Delete if older than cutoff time
        if (post.createdAt < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }

        cursor.continue();
      } else {
        // Done iterating
        console.log(`✅ Cleaned up ${deletedCount} old posts from IndexedDB`);
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      console.error('❌ Failed to cleanup IndexedDB:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Remove failed posts older than X days (default: 7 days)
 */
export async function cleanupFailedPosts(daysOld: number = 7): Promise<number> {
  const db = await initDB();
  const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.openCursor(IDBKeyRange.only('failed'));

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        const post = cursor.value as StoredOptimisticPost;

        // Delete if older than cutoff time
        if (post.createdAt < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }

        cursor.continue();
      } else {
        // Done iterating
        console.log(`✅ Cleaned up ${deletedCount} failed posts from IndexedDB`);
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      console.error('❌ Failed to cleanup failed posts:', request.error);
      reject(request.error);
    };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if IndexedDB is supported
 */
export function isIndexedDBSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Get database stats
 */
export async function getDatabaseStats(): Promise<{
  totalPosts: number;
  uploadingPosts: number;
  completedPosts: number;
  failedPosts: number;
}> {
  const allPosts = await getAllOptimisticPosts();

  return {
    totalPosts: allPosts.length,
    uploadingPosts: allPosts.filter(p =>
      p.status === 'uploading_media' || p.status === 'creating_post'
    ).length,
    completedPosts: allPosts.filter(p => p.status === 'completed').length,
    failedPosts: allPosts.filter(p => p.status === 'failed').length,
  };
}

// ============================================================================
// Draft Operations (Phase 2: Auto-save)
// ============================================================================

/**
 * Save draft to IndexedDB
 */
export async function saveDraft(draft: DraftPost): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE_NAME);

    const request = store.put({
      ...draft,
      updatedAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      console.log('✅ Draft saved to IndexedDB:', draft.draftId);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to save draft:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get draft by ID
 */
export async function getDraft(draftId: string): Promise<DraftPost | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE_NAME);
    const request = store.get(draftId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('❌ Failed to get draft:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all drafts (sorted by updatedAt DESC)
 */
export async function getAllDrafts(): Promise<DraftPost[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE_NAME], 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE_NAME);
    const index = store.index('updatedAt');
    const request = index.openCursor(null, 'prev'); // DESC order

    const drafts: DraftPost[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        drafts.push(cursor.value);
        cursor.continue();
      } else {
        resolve(drafts);
      }
    };

    request.onerror = () => {
      console.error('❌ Failed to get all drafts:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get latest draft (most recently updated)
 */
export async function getLatestDraft(): Promise<DraftPost | null> {
  const drafts = await getAllDrafts();
  return drafts.length > 0 ? drafts[0] : null;
}

/**
 * Delete draft by ID
 */
export async function deleteDraft(draftId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE_NAME);
    const request = store.delete(draftId);

    request.onsuccess = () => {
      console.log('✅ Draft deleted from IndexedDB:', draftId);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to delete draft:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Clear all drafts
 */
export async function clearAllDrafts(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('✅ All drafts cleared from IndexedDB');
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to clear drafts:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Cleanup old drafts (older than X days, default: 30 days)
 */
export async function cleanupOldDrafts(daysOld: number = 30): Promise<number> {
  const db = await initDB();
  const cutoffTime = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE_NAME);
    const index = store.index('updatedAt');
    const request = index.openCursor();

    let deletedCount = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor) {
        const draft = cursor.value as DraftPost;

        // Delete if older than cutoff time
        if (draft.updatedAt < cutoffTime) {
          cursor.delete();
          deletedCount++;
        }

        cursor.continue();
      } else {
        console.log(`✅ Cleaned up ${deletedCount} old drafts from IndexedDB`);
        resolve(deletedCount);
      }
    };

    request.onerror = () => {
      console.error('❌ Failed to cleanup drafts:', request.error);
      reject(request.error);
    };
  });
}

// ============================================================================
// File Operations (Phase 2: Resume Upload)
// ============================================================================

/**
 * Save file blob to IndexedDB
 */
export async function saveFile(file: StoredFile): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FILES_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(FILES_STORE_NAME);

    const request = store.put({
      ...file,
      createdAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      console.log('✅ File saved to IndexedDB:', file.fileId, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to save file:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get file by ID
 */
export async function getFile(fileId: string): Promise<StoredFile | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FILES_STORE_NAME], 'readonly');
    const store = transaction.objectStore(FILES_STORE_NAME);
    const request = store.get(fileId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      console.error('❌ Failed to get file:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get multiple files by IDs
 */
export async function getFiles(fileIds: string[]): Promise<StoredFile[]> {
  const files = await Promise.all(
    fileIds.map(id => getFile(id))
  );

  return files.filter(Boolean) as StoredFile[];
}

/**
 * Delete file by ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FILES_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(FILES_STORE_NAME);
    const request = store.delete(fileId);

    request.onsuccess = () => {
      console.log('✅ File deleted from IndexedDB:', fileId);
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to delete file:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete multiple files by IDs
 */
export async function deleteFiles(fileIds: string[]): Promise<void> {
  await Promise.all(fileIds.map(id => deleteFile(id)));
}

/**
 * Clear all files
 */
export async function clearAllFiles(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([FILES_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(FILES_STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('✅ All files cleared from IndexedDB');
      resolve();
    };

    request.onerror = () => {
      console.error('❌ Failed to clear files:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Cleanup orphaned files (files not referenced by any draft or post)
 */
export async function cleanupOrphanedFiles(): Promise<number> {
  const db = await initDB();

  return new Promise(async (resolve, reject) => {
    try {
      // Get all file IDs
      const allFilesTransaction = db.transaction([FILES_STORE_NAME], 'readonly');
      const allFilesStore = allFilesTransaction.objectStore(FILES_STORE_NAME);
      const allFilesRequest = allFilesStore.getAllKeys();

      allFilesRequest.onsuccess = async () => {
        const allFileIds = allFilesRequest.result as string[];

        // Get referenced file IDs from drafts
        const drafts = await getAllDrafts();
        const referencedFileIds = new Set<string>();

        drafts.forEach(draft => {
          draft.fileIds.forEach(id => referencedFileIds.add(id));
        });

        // Get referenced file IDs from optimistic posts
        const posts = await getAllOptimisticPosts();
        posts.forEach(post => {
          post.media.forEach(m => referencedFileIds.add(m.fileId));
        });

        // Delete orphaned files
        const orphanedFileIds = allFileIds.filter(id => !referencedFileIds.has(id));

        if (orphanedFileIds.length > 0) {
          await deleteFiles(orphanedFileIds);
          console.log(`✅ Cleaned up ${orphanedFileIds.length} orphaned files from IndexedDB`);
        }

        resolve(orphanedFileIds.length);
      };

      allFilesRequest.onerror = () => {
        console.error('❌ Failed to cleanup orphaned files:', allFilesRequest.error);
        reject(allFilesRequest.error);
      };
    } catch (error) {
      console.error('❌ Failed to cleanup orphaned files:', error);
      reject(error);
    }
  });
}
