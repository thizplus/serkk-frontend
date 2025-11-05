"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Home,
  PlusCircle,
  FileText,
  Bookmark,
  Search,
  Bell,
  LifeBuoy,
  Send,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"

import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const data = {
    user: {
      name: "เทพไท ใจน้อม",
      email: "thepthai@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "หน้าหลัก",
        url: "/",
        icon: Home,
        isActive: pathname === "/",
      },
      {
        title: "ค้นหา",
        url: "/search",
        icon: Search,
        isActive: pathname === "/search",
      },
      {
        title: "การแจ้งเตือน",
        url: "/notifications",
        icon: Bell,
        isActive: pathname === "/notifications",
      },
      {
        title: "สร้างโพสต์",
        url: "/create-post",
        icon: PlusCircle,
        isActive: pathname === "/create-post",
      },
      {
        title: "โพสต์ของฉัน",
        url: "/my-posts",
        icon: FileText,
        isActive: pathname === "/my-posts",
      },
      {
        title: "โพสต์ที่บันทึก",
        url: "/saved",
        icon: Bookmark,
        isActive: pathname === "/saved",
      },
    ],
    navSecondary: [
      {
        title: "ช่วยเหลือ",
        url: "#",
        icon: LifeBuoy,
      },
      {
        title: "ร้องเรียน",
        url: "#",
        icon: Send,
      },
    ],

  }
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="p-0 hover:bg-transparent active:bg-transparent">
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={36}
                    height={36}
                    className="rounded-lg"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {process.env.NEXT_PUBLIC_APP_NAME || "My App"}
                  </span>
                  <span className="truncate text-xs">
                    {process.env.NEXT_PUBLIC_APP_PLAN || "Free Plan"}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
