import { describe, expect, it } from 'vitest'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DROPDOWN_MENU_CONTENT_CLASS_NAME,
  DROPDOWN_MENU_ITEM_CLASS_NAME,
} from './dropdown-menu'

describe('DropdownMenu components', () => {
  it('exports all dropdown menu sub-components', () => {
    expect(DropdownMenu).toBeDefined()
    expect(DropdownMenuTrigger).toBeDefined()
    expect(DropdownMenuContent).toBeDefined()
    expect(DropdownMenuItem).toBeDefined()
    expect(DropdownMenuSeparator).toBeDefined()
  })

  it('sets displayName on styled wrapper components', () => {
    expect(DropdownMenuContent.displayName).toBeDefined()
    expect(DropdownMenuItem.displayName).toBeDefined()
    expect(DropdownMenuSeparator.displayName).toBeDefined()
  })

  it('uses the same clear blue-white floating panel style as other controls', () => {
    expect(DROPDOWN_MENU_CONTENT_CLASS_NAME).toContain('border-blue-100')
    expect(DROPDOWN_MENU_CONTENT_CLASS_NAME).toContain('bg-white')
    expect(DROPDOWN_MENU_CONTENT_CLASS_NAME).toContain('text-slate-900')
    expect(DROPDOWN_MENU_ITEM_CLASS_NAME).toContain('focus:bg-blue-50')
    expect(DROPDOWN_MENU_ITEM_CLASS_NAME).toContain('focus:text-blue-700')
  })
})
