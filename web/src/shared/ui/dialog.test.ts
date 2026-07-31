import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DIALOG_CONTENT_CLASS_NAME,
  DIALOG_OVERLAY_CLASS_NAME,
} from './dialog'

describe('Dialog components', () => {
  it('exports all dialog sub-components', () => {
    expect(Dialog).toBeDefined()
    expect(DialogTrigger).toBeDefined()
    expect(DialogContent).toBeDefined()
    expect(DialogHeader).toBeDefined()
    expect(DialogFooter).toBeDefined()
    expect(DialogTitle).toBeDefined()
    expect(DialogDescription).toBeDefined()
  })

  it('sets displayName on forwardRef components', () => {
    expect(DialogTrigger.displayName).toBe('DialogTrigger')
    expect(DialogContent.displayName).toBe('DialogContent')
    expect(DialogTitle.displayName).toBe('DialogTitle')
    expect(DialogDescription.displayName).toBe('DialogDescription')
  })

  it('sets displayName on function components', () => {
    expect(DialogHeader.displayName).toBe('DialogHeader')
    expect(DialogFooter.displayName).toBe('DialogFooter')
  })

  it('keeps modal panels readable over busy pages', () => {
    expect(DIALOG_OVERLAY_CLASS_NAME).toContain('bg-[#161616]/50')
    expect(DIALOG_OVERLAY_CLASS_NAME).not.toContain('backdrop-blur')
    expect(DIALOG_CONTENT_CLASS_NAME).toContain('bg-white')
    expect(DIALOG_CONTENT_CLASS_NAME).toContain('text-[#161616]')
    expect(DIALOG_CONTENT_CLASS_NAME).not.toContain('backdrop-blur')
  })
})
