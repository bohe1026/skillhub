import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:bg-[#c6c6c6] disabled:text-[#8d8d8d]',
  {
    variants: {
      variant: {
        default:
          'bg-[#0f62fe] text-white hover:bg-[#0353e9] active:bg-[#002d9c]',
        destructive:
          'bg-[#da1e28] text-white hover:bg-[#ba1b23] active:bg-[#750e13]',
        outline:
          'border border-[#0f62fe] bg-transparent text-[#0f62fe] hover:bg-[#edf5ff] active:bg-[#d0e2ff]',
        secondary:
          'bg-[#393939] text-white hover:bg-[#4c4c4c] active:bg-[#6f6f6f]',
        ghost:
          'text-[#0f62fe] hover:bg-[#e8e8e8] hover:text-[#0043ce]',
        link:
          'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
