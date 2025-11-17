"use client";

// ============================================================================
// Optimistic Posts Provider (Phase 2)
// ============================================================================
//
// Purpose:
// - Restore optimistic posts from IndexedDB on app load
// - Initialize persistence layer
//
// Usage:
// - Wrap app in root layout
// - Runs restoration logic once on mount
//
// ============================================================================

import { ReactNode } from 'react';
import { useRestoreOptimisticPosts } from '../hooks/useRestoreOptimisticPosts';

interface OptimisticPostsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that restores optimistic posts from IndexedDB
 *
 * Place this in root layout to initialize optimistic post system
 */
export function OptimisticPostsProvider({ children }: OptimisticPostsProviderProps) {
  // Restore posts from IndexedDB on mount
  useRestoreOptimisticPosts();

  // This is a transparent provider - just renders children
  return <>{children}</>;
}
