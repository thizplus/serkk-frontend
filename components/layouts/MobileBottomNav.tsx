"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, PlusCircle, Bookmark, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/lib/stores/authStore";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requireAuth?: boolean;
  isProfile?: boolean;
}

/**
 * MobileBottomNav Component
 *
 * Fixed bottom navigation bar สำหรับ mobile
 * แสดงเฉพาะบนหน้าจอขนาดเล็ก (< md breakpoint)
 *
 * Features:
 * - 5 เมนูหลัก: Home, Search, Create Post, Saved Posts, Profile
 * - Active state highlighting
 * - แสดงรูปโปรไฟล์จริงของ user
 * - Smooth transitions
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const navItems: NavItem[] = [
    {
      label: "หน้าหลัก",
      href: "/",
      icon: Home,
    },
    {
      label: "ค้นหา",
      href: "/search",
      icon: Search,
    },
    {
      label: "สร้างโพสต์",
      href: "/create-post",
      icon: PlusCircle,
      requireAuth: true,
    },
    {
      label: "โพสบันทึก",
      href: "/saved",
      icon: Bookmark,
      requireAuth: true,
    },
    {
      label: "โปรไฟล์",
      href: isAuthenticated && user?.username
        ? `/profile/${user.username}`
        : "/login",
      icon: User,
      isProfile: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "md:hidden", // แสดงเฉพาะ mobile
        "safe-area-inset-bottom" // รองรับ iOS notch
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "min-w-[64px] h-full rounded-lg",
                "transition-colors duration-200",
                "hover:bg-accent/50",
                "active:scale-95 transition-transform",
                active && "text-primary",
                !active && "text-muted-foreground"
              )}
            >
              {/* Icon หรือ Avatar */}
              <div className="relative">
                {item.isProfile && isAuthenticated && user ? (
                  <Avatar className="h-6 w-6 ring-2 ring-offset-2 ring-offset-background ring-primary/20">
                    <AvatarImage
                      src={user.avatar || undefined}
                      alt={user.username || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-all duration-200",
                      active && "scale-110"
                    )}
                  />
                )}

                {/* Active indicator dot */}
                {active && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  active && "font-semibold"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
