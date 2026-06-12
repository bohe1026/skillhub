import { describe, expect, it, vi } from 'vitest'
import React from 'react'

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn(), setQueryData: vi.fn() }),
}))

vi.mock('@/api/client', () => ({
  ApiError: class ApiError extends Error {
    status?: number
  },
  profileApi: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
  authApi: {
    changePassword: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ user: { displayName: 'Test', avatarUrl: null, email: 'test@test.com' } }),
}))

vi.mock('@/shared/lib/error-display', () => ({
  truncateErrorMessage: (v: string) => v,
}))

vi.mock('@/shared/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/shared/ui/button', () => ({
  Button: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/shared/ui/card', () => ({
  Card: ({ children }: { children: unknown }) => children,
  CardContent: ({ children }: { children: unknown }) => children,
  CardDescription: ({ children }: { children: unknown }) => children,
  CardHeader: ({ children }: { children: unknown }) => children,
  CardTitle: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/shared/ui/dialog', () => ({
  Dialog: ({ children }: { children: unknown }) => children,
  DialogContent: ({ children }: { children: unknown }) => children,
  DialogDescription: ({ children }: { children: unknown }) => children,
  DialogFooter: ({ children }: { children: unknown }) => children,
  DialogHeader: ({ children }: { children: unknown }) => children,
  DialogTitle: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/shared/ui/input', () => ({
  Input: () => null,
}))

import { renderToStaticMarkup } from 'react-dom/server'
import { ProfileSettingsPage } from './profile'

describe('ProfileSettingsPage', () => {
  it('exports a named component function', () => {
    expect(typeof ProfileSettingsPage).toBe('function')
  })

  it('does not render the email reset-password entry action', () => {
    const html = renderToStaticMarkup(React.createElement(ProfileSettingsPage))
    expect(html).not.toContain('profile.resetPassword')
  })

  it('renders the local password change action', () => {
    const html = renderToStaticMarkup(React.createElement(ProfileSettingsPage))
    expect(html).toContain('profile.changePassword')
  })
})
