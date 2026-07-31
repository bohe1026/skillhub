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

  it('uses the same Carbon floating panel style as other controls', () => {
    expect(DROPDOWN_MENU_CONTENT_CLASS_NAME).toContain('border-[#c6c6c6]')
    expect(DROPDOWN_MENU_CONTENT_CLASS_NAME).toContain('bg-white')
    expect(DROPDOWN_MENU_CONTENT_CLASS_NAME).toContain('text-[#161616]')
    expect(DROPDOWN_MENU_ITEM_CLASS_NAME).toContain('focus:bg-[#e8e8e8]')
    expect(DROPDOWN_MENU_ITEM_CLASS_NAME).toContain('focus:text-[#161616]')
  })
})
