"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, MessageSquarePlus, X, Clock } from "@/config/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OnlineStatus } from "./OnlineStatus";
import chatService from "../services/chat.service";
import type { ChatUserSearchResult } from "@/types/models";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface UserSearchDialogProps {
  trigger?: React.ReactNode;
}

export function UserSearchDialog({ trigger }: UserSearchDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<ChatUserSearchResult[]>([]);
  const [suggested, setSuggested] = useState<ChatUserSearchResult[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load suggested users
  const loadSuggestedUsers = useCallback(async () => {
    try {
      const response = await chatService.searchUsers("", 10);
      if (response.data) {
        setSuggested(response.data.suggested || []);
      }
    } catch (error) {
      console.error("Failed to load suggested users:", error);
    }
  }, []);

  // Load suggested users when dialog opens
  useEffect(() => {
    if (open && suggested.length === 0 && !searchQuery) {
      loadSuggestedUsers();
    }
  }, [open, suggested.length, searchQuery, loadSuggestedUsers]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery) {
        setUsers([]);
        // Reload suggested if clearing search
        if (suggested.length === 0) {
          loadSuggestedUsers();
        }
        return;
      }

      setIsSearching(true);
      try {
        const response = await chatService.searchUsers(debouncedQuery, 20);

        if (response.data) {
          setUsers(response.data.users || []);
          // Update suggested only if searching
          if (debouncedQuery) {
            setSuggested(response.data.suggested || []);
          }
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error("เกิดข้อผิดพลาดในการค้นหา");
        setUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, suggested.length, loadSuggestedUsers]);

  // Handle user selection
  const handleSelectUser = useCallback(
    (username: string) => {
      setOpen(false);
      setSearchQuery("");
      setUsers([]);
      setDebouncedQuery("");
      router.push(`/chat/${username}`);
    },
    [router]
  );

  // Reset when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
      setUsers([]);
      setDebouncedQuery("");
    }
  };

  // Format last active time
  const formatLastActive = (lastActive: string) => {
    try {
      return formatDistanceToNow(new Date(lastActive), {
        addSuffix: true,
        locale: th,
      });
    } catch {
      return "";
    }
  };

  // Render user item
  const renderUserItem = (user: ChatUserSearchResult) => (
    <button
      key={user.id}
      onClick={() => handleSelectUser(user.username)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={user.avatar || undefined}
            alt={user.displayName || user.username}
          />
          <AvatarFallback>
            {(user.displayName || user.username).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <OnlineStatus
          isOnline={user.isOnline}
          size="sm"
          className="absolute bottom-0 right-0"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">
            {user.displayName || user.username}
          </p>
          {user.isFollowing && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              กำลังติดตาม
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          @{user.username}
        </p>
        {user.bio && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {user.bio}
          </p>
        )}
      </div>
      {!user.isOnline && user.lastActive && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="hidden sm:inline">
            {formatLastActive(user.lastActive)}
          </span>
        </div>
      )}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm" className="gap-2 w-auto cursor-pointer">
            <MessageSquarePlus className="h-4 w-4" />
            แชทใหม่
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>เริ่มแชทใหม่</DialogTitle>
          <DialogDescription>
            ค้นหาผู้ใช้เพื่อเริ่มการสนทนา
          </DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            autoFocus
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">ล้างการค้นหา</span>
            </Button>
          )}
        </div>

        {/* Search Results */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">กำลังค้นหา...</p>
            </div>
          ) : debouncedQuery ? (
            // Search Results
            users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  ไม่พบผู้ใช้ &quot;{debouncedQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {users.map(renderUserItem)}
              </div>
            )
          ) : (
            // Suggested Users (when no search query)
            <div className="space-y-4">
              {suggested.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                    แนะนำสำหรับคุณ
                  </h3>
                  <div className="space-y-1">
                    {suggested.map(renderUserItem)}
                  </div>
                </div>
              )}

              {suggested.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    พิมพ์ชื่อผู้ใช้เพื่อค้นหา
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
