import { cn } from '@/shared/lib/utils'

export const APP_HEADER_BASE_CLASS_NAME =
  'sticky top-2 z-50 mx-3 flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_20px_50px_-38px_rgba(37,99,235,0.46)] backdrop-blur-xl transition-shadow duration-200 md:top-3 md:mx-5 md:px-8'

export const APP_HEADER_ELEVATED_CLASS_NAME = 'shadow-[0_22px_56px_-34px_rgba(15,23,42,0.42)]'

export function getAppHeaderClassName(isElevated: boolean): string {
  return cn(APP_HEADER_BASE_CLASS_NAME, isElevated && APP_HEADER_ELEVATED_CLASS_NAME)
}
