import { MarkdownRenderer } from '@/features/skill/markdown-renderer'
import { cn } from '@/shared/lib/utils'

interface ReviewCommentReportProps {
  comment: string
  compact?: boolean
  className?: string
}

export function ReviewCommentReport({ comment, compact = false, className }: ReviewCommentReportProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'mt-3 max-h-32 overflow-hidden whitespace-pre-wrap rounded-md border border-border/50 bg-secondary/35 p-3 text-sm leading-6 text-muted-foreground',
          className
        )}
      >
        {comment}
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-border/60 bg-secondary/35 p-4', className)}>
      <MarkdownRenderer
        content={comment}
        className="text-sm [&_h1]:mb-4 [&_h1]:pb-3 [&_h1]:text-2xl [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:pb-2 [&_h2]:text-lg [&_li]:leading-7 [&_ol]:my-3 [&_p]:my-3 [&_p]:text-sm [&_p]:leading-7 [&_ul]:my-3"
      />
    </div>
  )
}
