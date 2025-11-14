"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Post } from '@/types/models';

export type DrawerType =
  | 'media-viewer'     // Media gallery with vote + comments
  | 'comment-only'     // Comments only
  | 'post-detail'      // Full post detail (future)
  | 'user-profile'     // User profile (future)
  | 'create-post'      // Create post form (future)
  | 'notifications';   // Notifications (future)

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
}

export interface DrawerData {
  post?: Post;
  media?: MediaItem[];
  initialIndex?: number;
  [key: string]: any; // Flexible for future drawer types
}

interface DrawerState {
  type: DrawerType | null;
  data: DrawerData | null;
  isOpen: boolean;
}

interface DrawerContextValue {
  drawer: DrawerState;
  openDrawer: (type: DrawerType, data: DrawerData) => void;
  closeDrawer: () => void;
  updateDrawerData: (data: Partial<DrawerData>) => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [drawer, setDrawer] = useState<DrawerState>({
    type: null,
    data: null,
    isOpen: false,
  });

  const openDrawer = (type: DrawerType, data: DrawerData) => {
    setDrawer({ type, data, isOpen: true });

    // Update URL for browser back button support
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('drawer', type);
      if (data.post?.id) {
        url.searchParams.set('id', data.post.id);
      }
      window.history.pushState({}, '', url);
    }
  };

  const closeDrawer = () => {
    // Pause all videos when closing drawer
    if (typeof window !== 'undefined') {
      document.querySelectorAll('video').forEach((video) => {
        video.pause();
      });
    }

    setDrawer({ type: null, data: null, isOpen: false });

    // Clean URL
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('drawer');
      url.searchParams.delete('id');
      window.history.pushState({}, '', url);
    }
  };

  const updateDrawerData = (data: Partial<DrawerData>) => {
    setDrawer((prev) => ({
      ...prev,
      data: prev.data ? { ...prev.data, ...data } : data,
    }));
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const hasDrawerParam = params.has('drawer');

      if (!hasDrawerParam && drawer.isOpen) {
        // User clicked back button, close drawer
        setDrawer({ type: null, data: null, isOpen: false });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [drawer.isOpen]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawer.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [drawer.isOpen]);

  return (
    <DrawerContext.Provider value={{ drawer, openDrawer, closeDrawer, updateDrawerData }}>
      {children}
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within DrawerProvider');
  }
  return context;
}
