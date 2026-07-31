import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const INPUT_BASE_CLASS_NAME =
  'flex h-10 w-full rounded-none border-0 border-b border-[#8d8d8d] bg-[#f4f4f4] px-4 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#6f6f6f] focus-visible:border-b-2 focus-visible:border-[#0f62fe] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f62fe] disabled:cursor-not-allowed disabled:bg-[#e0e0e0] disabled:text-[#8d8d8d]'

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          INPUT_BASE_CLASS_NAME,
          className
        )}
        style={style}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
