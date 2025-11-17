"use client";

// ============================================================================
// Draft Auto-save Hook (Phase 2)
// ============================================================================
//
// Purpose:
// - Auto-save draft every 3 seconds
// - Load latest draft on mount
// - Clear draft on successful post
// - Store files in IndexedDB for resume upload
//
// Usage:
// - Call in CreatePostForm component
// - Pass form state (title, content, tags, files)
// - Get callbacks (onRestoreDraft, clearDraft)
//
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  saveDraft,
  getLatestDraft,
  deleteDraft,
  saveFile,
  getFiles,
  deleteFiles,
  cleanupOldDrafts,
  isIndexedDBSupported,
  type DraftPost,
  type StoredFile,
} from '@/shared/lib/storage/indexedDB';

// ============================================================================
// Types
// ============================================================================

interface DraftData {
  title: string;
  content: string;
  tags: string[];
  files: File[];
}

interface UseDraftAutoSaveOptions {
  /**
   * Form data to auto-save
   */
  formData: DraftData;

  /**
   * Callback when draft is restored
   */
  onRestoreDraft?: (draft: {
    title: string;
    content: string;
    tags: string[];
    files: File[];
  }) => void;

  /**
   * Auto-save interval in milliseconds (default: 3000ms = 3 seconds)
   */
  autoSaveInterval?: number;

  /**
   * Enable auto-save (default: true)
   */
  enabled?: boolean;
}

interface UseDraftAutoSaveReturn {
  /**
   * Last saved timestamp
   */
  lastSaved: Date | null;

  /**
   * Is currently saving
   */
  isSaving: boolean;

  /**
   * Clear current draft
   */
  clearDraft: () => Promise<void>;

  /**
   * Manually save draft
   */
  saveDraftNow: () => Promise<void>;

  /**
   * Current draft ID
   */
  draftId: string | null;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for auto-saving drafts to IndexedDB
 *
 * Features:
 * - Auto-save every 3 seconds (configurable)
 * - Load latest draft on mount (with user confirmation)
 * - Store files in IndexedDB for resume upload
 * - Clean up old drafts (> 30 days)
 */
export function useDraftAutoSave(options: UseDraftAutoSaveOptions): UseDraftAutoSaveReturn {
  const {
    formData,
    onRestoreDraft,
    autoSaveInterval = 3000, // 3 seconds
    enabled = true,
  } = options;

  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasLoadedRef = useRef(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Load Draft on Mount
  // ============================================================================

  useEffect(() => {
    if (!enabled || !isIndexedDBSupported()) {
      return;
    }

    // Run only once
    if (hasLoadedRef.current) {
      return;
    }

    hasLoadedRef.current = true;

    const loadDraft = async () => {
      try {
        console.log('🔄 Loading latest draft...');

        // Get latest draft
        const latestDraft = await getLatestDraft();

        if (!latestDraft) {
          console.log('✅ No draft found');

          // Cleanup old drafts
          const deletedCount = await cleanupOldDrafts(30);
          if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} old drafts`);
          }

          return;
        }

        // Check age (delete if > 7 days)
        const age = Date.now() - new Date(latestDraft.updatedAt).getTime();
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

        if (age > MAX_AGE) {
          console.log('⚠️ Draft is too old (> 7 days), deleting...');
          await deleteDraft(latestDraft.draftId);

          // Also delete associated files
          if (latestDraft.fileIds.length > 0) {
            await deleteFiles(latestDraft.fileIds);
          }

          return;
        }

        // Ask user to restore
        const updatedDate = new Date(latestDraft.updatedAt).toLocaleString('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short',
        });

        const shouldRestore = window.confirm(
          `พบ draft ที่บันทึกไว้เมื่อ ${updatedDate}\n\nต้องการกู้คืนหรือไม่?`
        );

        if (!shouldRestore) {
          // Delete draft if user declines
          await deleteDraft(latestDraft.draftId);

          // Also delete associated files
          if (latestDraft.fileIds.length > 0) {
            await deleteFiles(latestDraft.fileIds);
          }

          return;
        }

        // Load files from IndexedDB
        const storedFiles = await getFiles(latestDraft.fileIds);

        // Convert StoredFile[] to File[]
        const files = storedFiles.map((storedFile) => {
          return new File([storedFile.blob], storedFile.name, {
            type: storedFile.type,
          });
        });

        console.log(`✅ Loaded ${files.length} files from IndexedDB`);

        // Restore draft via callback
        onRestoreDraft?.({
          title: latestDraft.title,
          content: latestDraft.content,
          tags: latestDraft.tags,
          files,
        });

        setDraftId(latestDraft.draftId);
        setLastSaved(new Date(latestDraft.updatedAt));

        toast.success('กู้คืน draft สำเร็จ', {
          description: `โหลด ${files.length} ไฟล์`,
        });
      } catch (error) {
        console.error('❌ Failed to load draft:', error);
        toast.error('ไม่สามารถกู้คืน draft ได้');
      }
    };

    loadDraft();
  }, [enabled, onRestoreDraft]);

  // ============================================================================
  // Auto-save Draft
  // ============================================================================

  useEffect(() => {
    if (!enabled || !isIndexedDBSupported()) {
      return;
    }

    // Clear previous timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Don't save if form is empty
    const isEmpty =
      !formData.title.trim() &&
      !formData.content.trim() &&
      formData.tags.length === 0 &&
      formData.files.length === 0;

    if (isEmpty) {
      return;
    }

    // Auto-save after delay
    autoSaveTimerRef.current = setTimeout(async () => {
      await saveDraftNow();
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData.title, formData.content, formData.tags, formData.files, autoSaveInterval, enabled]);

  // ============================================================================
  // Save Draft Function
  // ============================================================================

  const saveDraftNow = async (): Promise<void> => {
    if (!enabled || !isIndexedDBSupported()) {
      return;
    }

    try {
      setIsSaving(true);

      // Generate or reuse draft ID
      const currentDraftId = draftId || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      // ============================================================================
      // Step 1: Save files to IndexedDB
      // ============================================================================

      const fileIds: string[] = [];

      for (const file of formData.files) {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        const storedFile: StoredFile = {
          fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          blob: file,
          createdAt: new Date().toISOString(),
        };

        await saveFile(storedFile);
        fileIds.push(fileId);
      }

      // ============================================================================
      // Step 2: Save draft to IndexedDB
      // ============================================================================

      const draft: DraftPost = {
        draftId: currentDraftId,
        title: formData.title,
        content: formData.content,
        tags: formData.tags,
        fileIds,
        createdAt: draftId
          ? (await getLatestDraft())?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveDraft(draft);

      // Update state
      if (!draftId) {
        setDraftId(currentDraftId);
      }
      setLastSaved(new Date());

      console.log(`✅ Draft auto-saved:`, {
        draftId: currentDraftId,
        filesCount: fileIds.length,
      });
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      // Don't show error toast for auto-save (silent fail)
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // Clear Draft Function
  // ============================================================================

  const clearDraft = async (): Promise<void> => {
    if (!draftId) {
      return;
    }

    try {
      console.log(`🗑️ Clearing draft: ${draftId}`);

      // Get draft to find file IDs
      const draft = await getLatestDraft();

      if (draft && draft.draftId === draftId) {
        // Delete associated files
        if (draft.fileIds.length > 0) {
          await deleteFiles(draft.fileIds);
          console.log(`✅ Deleted ${draft.fileIds.length} files from IndexedDB`);
        }

        // Delete draft
        await deleteDraft(draftId);
        console.log(`✅ Draft deleted: ${draftId}`);
      }

      // Reset state
      setDraftId(null);
      setLastSaved(null);
    } catch (error) {
      console.error('❌ Failed to clear draft:', error);
    }
  };

  // ============================================================================
  // Return Hook Interface
  // ============================================================================

  return {
    lastSaved,
    isSaving,
    clearDraft,
    saveDraftNow,
    draftId,
  };
}
