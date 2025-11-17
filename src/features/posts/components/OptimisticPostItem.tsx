"use client"

import { useMemo } from "react"
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, XCircle } from "@/config/icons"
import type { OptimisticPost } from "@/features/posts/stores/optimisticPostStore"

interface OptimisticPostItemProps {
  post: OptimisticPost
}

export function OptimisticPostItem({ post }: OptimisticPostItemProps) {
  // คำนวณ overall progress (0-100)
  const overallProgress = useMemo(() => {
    if (post.media.length === 0) {
      return { percent: 0, text: "กำลังสร้างโพสต์..." }
    }

    const completedCount = post.media.filter(m => m.uploadStatus === 'completed').length
    const failedCount = post.media.filter(m => m.uploadStatus === 'failed').length
    const totalCount = post.media.length

    if (completedCount === totalCount) {
      return { percent: 100, text: "กำลังสร้างโพสต์..." }
    }

    if (failedCount > 0) {
      return {
        percent: (completedCount / totalCount) * 100,
        text: `อัปโหลดล้มเหลว ${failedCount}/${totalCount} ไฟล์`
      }
    }

    // คำนวณ progress จาก uploadProgress ของแต่ละไฟล์
    const totalProgress = post.media.reduce((sum, m) => sum + m.uploadProgress, 0)
    const avgProgress = totalProgress / totalCount

    return {
      percent: Math.round(avgProgress),
      text: `อัปโหลด ${completedCount}/${totalCount} ไฟล์`
    }
  }, [post.media])

  // สถานะ icon
  const statusIcon = useMemo(() => {
    if (post.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }
    if (post.status === 'failed') {
      return <XCircle className="h-5 w-5 text-destructive" />
    }
    return <Spinner className="h-5 w-5" />
  }, [post.status])

  const statusText = useMemo(() => {
    if (post.status === 'completed') {
      return 'โพสต์สำเร็จ'
    }
    if (post.status === 'failed') {
      return 'โพสต์ล้มเหลว'
    }
    return overallProgress.text
  }, [post.status, overallProgress.text])

  return (
    <Item variant="muted" className="[--radius:0.75rem] border border-border">
      {/* Icon/Spinner */}
      <ItemMedia>
        {statusIcon}
      </ItemMedia>

      {/* Content */}
      <ItemContent className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <ItemTitle className="line-clamp-1 flex-1">{post.title}</ItemTitle>
          {/* Progress Percentage (เฉพาะตอน uploading) */}
          {post.status === 'uploading' && post.media.length > 0 && (
            <span className="text-xs font-medium tabular-nums text-muted-foreground">
              {overallProgress.percent}%
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {post.status === 'uploading' && post.media.length > 0 ? (
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${overallProgress.percent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">{statusText}</p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{statusText}</p>
        )}
      </ItemContent>
    </Item>
  )
}
