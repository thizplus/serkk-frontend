import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const itemVariants = cva(
  "flex w-full items-center gap-3 rounded-[--radius] p-3 transition-colors",
  {
    variants: {
      variant: {
        default: "bg-card hover:bg-accent/50",
        muted: "bg-muted/50",
        ghost: "hover:bg-accent/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Item = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof itemVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(itemVariants({ variant }), className)}
    {...props}
  />
))
Item.displayName = "Item"

const ItemMedia = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-none", className)}
    {...props}
  />
))
ItemMedia.displayName = "ItemMedia"

const ItemContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-1", className)}
    {...props}
  />
))
ItemContent.displayName = "ItemContent"

const ItemTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm font-medium leading-none", className)}
    {...props}
  />
))
ItemTitle.displayName = "ItemTitle"

const ItemDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground", className)}
    {...props}
  />
))
ItemDescription.displayName = "ItemDescription"

export { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription }
