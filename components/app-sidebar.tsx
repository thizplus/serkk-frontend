"use client"

import * as React from "react"
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
import { AppLogo } from "@/components/ui/app-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
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
      <SidebarHeader className="px-4 py-3 border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <AppLogo size="lg" showPlan={true} />
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
