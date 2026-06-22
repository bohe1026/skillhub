import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const useSearchMock = vi.fn()
const selectRecords: Array<{ value?: string }> = []
const buttonRecords: Array<{ label: string; disabled?: boolean }> = []

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => useSearchMock(),
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

vi.mock('@/features/publish/upload-zone', () => ({
  UploadZone: () => null,
}))

vi.mock('@/shared/ui/button', () => ({
  Button: ({ children, disabled }: { children: unknown; disabled?: boolean }) => {
    const label = Array.isArray(children) ? children.join('') : String(children ?? '')
    buttonRecords.push({ label, disabled })
    return children
  },
}))

vi.mock('@/shared/ui/select', () => ({
  Select: ({ children, value }: { children: unknown; value?: string }) => {
    selectRecords.push({ value })
    return children
  },
  SelectContent: ({ children }: { children: unknown }) => children,
  SelectItem: ({ children }: { children: unknown }) => children,
  SelectTrigger: ({ children }: { children: unknown }) => children,
  SelectValue: () => null,
  normalizeSelectValue: (v: string) => v || null,
}))

vi.mock('@/shared/ui/label', () => ({
  Label: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/shared/ui/card', () => ({
  Card: ({ children }: { children: unknown }) => children,
}))

vi.mock('@/shared/hooks/use-skill-queries', () => ({
  usePublishSkill: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/shared/hooks/use-namespace-queries', () => ({
  useMyNamespaces: () => ({ data: [], isLoading: false }),
}))

vi.mock('@/shared/components/dashboard-page-header', () => ({
  DashboardPageHeader: () => null,
}))

vi.mock('@/shared/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/api/client', () => ({
  ApiError: class ApiError extends Error {
    serverMessageKey?: string
  },
  labelApi: {
    attachSkillLabel: vi.fn(),
  },
}))

import { PublishPage } from './publish'

describe('PublishPage', () => {
  beforeEach(() => {
    selectRecords.length = 0
    buttonRecords.length = 0
    useSearchMock.mockReturnValue({
      namespace: '  team-ai  ',
      visibility: 'private',
    })
  })

  it('prefills namespace and visibility from route search params', () => {
    renderToStaticMarkup(createElement(PublishPage))

    expect(selectRecords[0]?.value).toBe('team-ai')
    expect(selectRecords[1]?.value).toBe('PRIVATE')
  })

  it('falls back to public visibility when search params are missing', () => {
    useSearchMock.mockReturnValue({})

    renderToStaticMarkup(createElement(PublishPage))

    expect(selectRecords[0]?.value).toBe('__select_namespace__')
    expect(selectRecords[1]?.value).toBe('PUBLIC')
  })

  it('renders required business category choices before publishing', () => {
    const html = renderToStaticMarkup(createElement(PublishPage))

    expect(html).toContain('publish.category.title')
    expect(html).toContain('search.discovery.groups.content')
    expect(html).toContain('search.discovery.groups.document')
    const publishButton = buttonRecords[buttonRecords.length - 1]
    expect(publishButton?.label).toBe('publish.confirm')
    expect(publishButton?.disabled).toBe(true)
  })

  it('exports a named component function', () => {
    expect(typeof PublishPage).toBe('function')
  })
})
