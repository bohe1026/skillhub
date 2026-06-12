import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: unknown }) => children,
}))

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('@/shared/ui/card', () => ({
  Card: ({ children }: { children: unknown }) => children,
  CardContent: ({ children }: { children: unknown }) => children,
  CardDescription: ({ children }: { children: unknown }) => children,
  CardHeader: ({ children }: { children: unknown }) => children,
  CardTitle: ({ children }: { children: unknown }) => children,
}))

import { renderToStaticMarkup } from 'react-dom/server'
import { ResetPasswordPage } from './reset-password'

describe('ResetPasswordPage', () => {
  it('exports a named component function', () => {
    expect(typeof ResetPasswordPage).toBe('function')
  })

  it('renders the private-deployment disabled state', () => {
    const html = renderToStaticMarkup(<ResetPasswordPage />)
    expect(html).toContain('resetPassword.disabledTitle')
    expect(html).toContain('resetPassword.disabledDescription')
    expect(html).toContain('resetPassword.backToLogin')
  })
})
