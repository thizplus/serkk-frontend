"use client"

import * as React from "react"
import type { SidebarContextProps } from "./types"

/**
 * Sidebar Context
 */
export const SidebarContext = React.createContext<SidebarContextProps | null>(null)

/**
 * useSidebar Hook
 * Access sidebar context
 */
export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}
