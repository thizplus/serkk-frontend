"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppLogo } from "@/components/ui/app-logo";
import { MobileBottomNav } from "@/components/layouts/MobileBottomNav";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useUnreadNotificationCount } from "@/lib/hooks/queries/useNotifications";
import { useProfile } from "@/lib/hooks/queries/useUsers";
import { useAuthStore } from "@/lib/stores/authStore";
import { useWebSocket } from "@/lib/hooks/useWebSocket";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  const setUser = useAuthStore((state) => state.setUser);

  // Connect WebSocket for real-time notifications
  useWebSocket();

  // Fetch unread notification count
  const { data: unreadCount = 0, error, isLoading } = useUnreadNotificationCount();

  // Fetch profile และ sync ไปยัง Zustand store
  const { data: profileData } = useProfile();

  // Sync profile data ไปยัง Zustand เมื่อได้ข้อมูลใหม่
  useEffect(() => {
    if (profileData) {
      setUser(profileData);
    }
  }, [profileData, setUser]);

  // Debug
  if (process.env.NODE_ENV === 'development') {
    console.log('🔔 Unread Count:', unreadCount, 'Loading:', isLoading, 'Error:', error);
  }

  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              {/* Mobile: แสดง AppLogo */}
              <AppLogo
                size="sm"
                showPlan={true}
                className="md:hidden"
              />
              {/* Desktop: แสดง Breadcrumb */}
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && (
                          <BreadcrumbSeparator className="hidden md:block" />
                        )}
                        <BreadcrumbItem className="hidden md:block">
                          {item.href ? (
                            <BreadcrumbLink href={item.href}>
                              {item.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            {/* Actions: Theme Toggle & Notification */}
            <div className="flex items-center">
              <ThemeToggle />
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {!isLoading && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  <span className="sr-only">
                    การแจ้งเตือน {unreadCount > 0 ? `(${unreadCount} ข้อความใหม่)` : ''}
                  </span>
                </Button>
              </Link>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-4 pb-20 md:pb-4">
            {/* pb-20 (80px) บน mobile เพื่อไม่ให้ content ถูกบังโดย bottom nav */}
            <div className="w-full max-w-xl mx-auto px-0">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Mobile Bottom Navigation - แสดงเฉพาะ mobile */}
      <MobileBottomNav />
    </>
  );
}
