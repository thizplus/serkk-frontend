'use client';

import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  User,
} from 'lucide-react';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useUser, useHasHydrated } from '@/lib/stores/authStore';
import { useLogout } from '@/lib/hooks/mutations/useAuth';

export function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const user = useUser(); // ใช้ Zustand
  const hasHydrated = useHasHydrated(); // ใช้ Zustand
  const logoutMutation = useLogout();

  const handleProfileClick = () => {
    if (user) {
      router.push(`/profile/${user.username}`);
    }
  };

  const handleEditProfileClick = () => {
    router.push('/profile/edit');
  };

  const handleNotificationsClick = () => {
    router.push('/notifications/settings');
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // แสดง loading skeleton ขณะรอ hydration
  if (!hasHydrated || logoutMutation.isPending) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <div className="h-8 w-8 rounded-lg bg-gray-200 animate-pulse" />
            <div className="grid flex-1 gap-1">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={user.avatar || ''}
                  alt={user.displayName}
                />
                <AvatarFallback className="rounded-lg">
                  {user.displayName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.displayName}</span>
                <span className="truncate text-xs">@{user.username}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={user.avatar || ''}
                    alt={user.displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.displayName[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.displayName}</span>
                  <span className="truncate text-xs">@{user.username}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfileClick}>
                <User />
                โปรไฟล์
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleEditProfileClick}>
                <BadgeCheck />
                แก้ไขโปรไฟล์
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleNotificationsClick}>
                <Bell />
                ตั้งค่าการแจ้งเตือน
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
