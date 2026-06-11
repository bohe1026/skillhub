import { Toaster as Sonner } from 'sonner'
import { CENTER_TOASTER_ID } from '@/shared/lib/toast'

export function Toaster() {
  return (
    <Sonner
      id={CENTER_TOASTER_ID}
      position="top-center"
      className="!left-1/2 !right-auto !top-4 !-translate-x-1/2"
      offset={16}
      mobileOffset={16}
      toastOptions={{
        toasterId: CENTER_TOASTER_ID,
        classNames: {
          toast: 'mx-auto w-fit max-w-[min(100vw-2rem,32rem)] rounded-lg border border-blue-100 bg-white text-slate-950 shadow-[0_18px_46px_-30px_rgba(15,23,42,0.48)]',
          title: 'text-slate-950 font-semibold text-center',
          description: 'text-slate-600 text-center',
          content: 'w-full text-center',
          actionButton: 'rounded-lg bg-blue-600 text-white hover:bg-blue-700',
          cancelButton: 'rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100',
          error: 'border-destructive/40',
          success: 'border-emerald-500/40',
          warning: 'border-amber-500/40',
          info: 'border-blue-500/40',
        },
      }}
    />
  )
}
