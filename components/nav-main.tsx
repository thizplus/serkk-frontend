"use client"

import Link from "next/link"
import { type LucideIcon } from "lucide-react"

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    badge?: number
  }[]
}) {
  return (
        <SidebarGroup>
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link href={item.url} className="relative">
              <item.icon />
              <span>{item.title}</span>
              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
    </SidebarGroup>
  )
}
