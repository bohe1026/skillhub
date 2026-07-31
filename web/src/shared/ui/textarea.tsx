import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full resize-y rounded-none border-0 border-b border-[#8d8d8d] bg-[#f4f4f4] px-4 py-3 text-sm text-foreground transition-colors placeholder:text-[#6f6f6f] focus-visible:border-b-2 focus-visible:border-[#0f62fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f62fe] disabled:cursor-not-allowed disabled:bg-[#e0e0e0] disabled:text-[#8d8d8d]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
