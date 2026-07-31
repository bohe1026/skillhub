import { cn } from '@/shared/lib/utils'

export const APP_HEADER_BASE_CLASS_NAME =
  'sticky top-0 z-50 flex h-12 items-center justify-between border-b border-[#393939] bg-[#161616] px-4 text-white transition-colors duration-150 md:px-8'

export const APP_HEADER_ELEVATED_CLASS_NAME = 'border-[#525252]'

export function getAppHeaderClassName(isElevated: boolean): string {
  return cn(APP_HEADER_BASE_CLASS_NAME, isElevated && APP_HEADER_ELEVATED_CLASS_NAME)
}
