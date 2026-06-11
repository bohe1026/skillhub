/** @vitest-environment jsdom */
import { renderToStaticMarkup } from 'react-dom/server'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const navigateMock = vi.fn()
const optimizeMutateMock = vi.fn()
const optimizeResult = {
  skillId: 30,
  namespace: 'global',
  slug: 'demo-skill',
  skillVersionId: 11,
  reviewTaskId: 100,
  version: '20260610.062442.opt1',
  status: 'PENDING_REVIEW',
  optimizationSummary: {
    addedSections: ['触发条件', '执行步骤'],
    preservedItems: ['原始 description', '原有正文内容'],
    reportSummary: '分数：84/120',
    reportMappings: [
      {
        problem: 'description 缺少明确触发场景',
        suggestion: '补充什么任务会触发该 Skill',
        matchedSections: ['触发条件'],
      },
    ],
  },
}

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  useParams: (options?: { from?: string }) => (
    options?.from === '/dashboard/namespaces/$slug/reviews/$id'
      ? { id: '13', slug: 'team-alpha' }
      : { id: '13' }
  ),
}))

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next')
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, values?: Record<string, string>) =>
        values?.skill ? `${key}:${values.skill}` : key,
      i18n: { language: 'zh' },
    }),
  }
})

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false, error: null }),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}))

vi.mock('@/shared/lib/date-time', () => ({
  formatLocalDateTime: (value: string) => value,
}))

vi.mock('@/shared/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/shared/ui/dialog', () => ({
  Dialog: ({ open, children }: { open?: boolean; children: ReactNode }) => (open ? <>{children}</> : null),
  DialogContent: ({ children, ...props }: { children: ReactNode }) => <div {...props}>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
}))

vi.mock('@/features/review/review-error', () => ({
  resolveReviewActionErrorDescription: () => 'error',
}))

vi.mock('@/features/review/review-comment-report', () => ({
  ReviewCommentReport: ({ comment }: { comment: string }) => <section data-testid="review-comment-report">{comment}</section>,
}))

const useReviewDetailMock = vi.fn<() => unknown>(() => ({
  data: {
    id: 13,
    namespace: 'global',
    skillSlug: 'demo-skill',
    version: '1.2.0',
    status: 'PENDING',
    submittedBy: 'local-admin',
    submittedByName: 'Local Admin',
    submittedAt: '2026-03-19T00:00:00Z',
    reviewedBy: null,
    reviewedByName: null,
    reviewedAt: null,
    reviewComment: null,
  },
  isLoading: false,
}))

const useReviewSkillDetailMock = vi.fn<() => unknown>(() => ({
  data: {
    skill: {
      id: 1,
      slug: 'demo-skill',
      displayName: 'Demo Skill',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
      downloadCount: 3,
      starCount: 1,
      ratingCount: 0,
      hidden: false,
      namespace: 'global',
      canManageLifecycle: false,
      canSubmitPromotion: false,
      canInteract: false,
      canReport: false,
      resolutionMode: 'REVIEW_TASK',
    },
    versions: [
      {
        id: 10,
        version: '1.2.0',
        status: 'PENDING_REVIEW',
        changelog: 'Pending update',
        fileCount: 2,
        totalSize: 120,
        publishedAt: '2026-03-19T00:00:00Z',
        downloadAvailable: true,
      },
    ],
    files: [],
    documentationPath: 'README.md',
    documentationContent: '# Demo Skill',
    downloadUrl: '/api/v1/reviews/13/download',
    activeVersion: '1.2.0',
  },
  isLoading: false,
  error: null,
}))

vi.mock('@/features/review/use-review-detail', () => ({
  useReviewDetail: () => useReviewDetailMock(),
  useReviewSkillDetail: () => useReviewSkillDetailMock(),
  useApproveReview: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRejectReview: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useOptimizeReview: (callbacks?: { onSuccess?: (result: typeof optimizeResult) => void }) => ({
    mutate: (payload: { taskId: number }) => {
      optimizeMutateMock(payload)
      callbacks?.onSuccess?.(optimizeResult)
    },
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

const userMock = { userId: 'local-admin', platformRoles: ['SKILL_ADMIN'] as string[] }
vi.mock('@/features/auth/use-auth', () => ({
  useAuth: () => ({ user: userMock }),
}))

vi.mock('@/shared/hooks/use-namespace-queries', () => ({
  useMyNamespaces: () => ({ data: [], isLoading: false }),
}))

// Mock hooks used directly by the review-detail page for file browser sidebar
vi.mock('@/features/review/use-review-file', () => ({
  useReviewFile: () => ({ data: null, isLoading: false, error: null }),
}))

vi.mock('@/api/client', () => ({
  buildApiUrl: (path: string) => path,
  WEB_API_PREFIX: '/api/web',
}))

import { NamespaceReviewDetailPage, ReviewDetailPage } from './review-detail'

describe('ReviewDetailPage', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    navigateMock.mockReset()
    optimizeMutateMock.mockReset()
    userMock.userId = 'local-admin'
    userMock.platformRoles = ['SKILL_ADMIN']
    useReviewDetailMock.mockReset()
    useReviewSkillDetailMock.mockReset()
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'PENDING',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
      },
      isLoading: false,
    })
    useReviewSkillDetailMock.mockReturnValue({
      data: {
        skill: {
          id: 1,
          slug: 'demo-skill',
          displayName: 'Demo Skill',
          visibility: 'PUBLIC',
          status: 'ACTIVE',
          downloadCount: 3,
          starCount: 1,
          ratingCount: 0,
          hidden: false,
          namespace: 'global',
          canManageLifecycle: false,
          canSubmitPromotion: false,
          canInteract: false,
          canReport: false,
          resolutionMode: 'REVIEW_TASK',
        },
        versions: [
          {
            id: 10,
            version: '1.2.0',
            status: 'PENDING_REVIEW',
            changelog: 'Pending update',
            fileCount: 2,
            totalSize: 120,
            publishedAt: '2026-03-19T00:00:00Z',
            downloadAvailable: true,
          },
        ],
        files: [],
        documentationPath: 'README.md',
        documentationContent: '# Demo Skill',
        downloadUrl: '/api/v1/reviews/13/download',
        activeVersion: '1.2.0',
      },
      isLoading: false,
      error: null,
    })
  })

  it('keeps the page in a single-column flow and leaves the skill detail behind a collapsed section', () => {
    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).toContain('max-w-6xl mx-auto flex')
    expect(html).toContain('aria-expanded="false"')
  })

  it('renders not-found state when the review record is missing', () => {
    useReviewDetailMock.mockReturnValue({
      data: null,
      isLoading: false,
    })

    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).toContain('review.notFound')
  })

  it('renders the automatic Skill Judge report from reviewComment', () => {
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'REJECTED',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: 'system-auto-review',
        reviewedByName: 'system-auto-review',
        reviewedAt: '2026-03-19T00:05:00Z',
        reviewComment: '# Skill Judge 自动审核报告\n\n结论：自动拒绝\n分数：84/120\n\n## 逐项问题\n1. description 缺少明确触发场景',
      },
      isLoading: false,
    })

    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).toContain('data-testid="review-comment-report"')
    expect(html).toContain('Skill Judge 自动审核报告')
    expect(html).toContain('结论：自动拒绝')
    expect(html).toContain('description 缺少明确触发场景')
    expect(html).toContain('review.optimizeWithSkillJudge')
    expect(html).toContain('review.optimizeDescription')
  })

  it('hides approve and reject actions from the submitter on pending review detail', () => {
    userMock.userId = 'local-admin'
    userMock.platformRoles = []
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 25,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '20260611.061949.opt1',
        status: 'PENDING',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-06-11T07:04:00Z',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
      },
      isLoading: false,
    })

    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).not.toContain('review.actions')
  })

  it('shows approve and reject actions to a skill admin reviewing someone else submission', () => {
    userMock.userId = 'reviewer-1'
    userMock.platformRoles = ['SKILL_ADMIN']
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 25,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '20260611.061949.opt1',
        status: 'PENDING',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-06-11T07:04:00Z',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
      },
      isLoading: false,
    })

    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).toContain('review.actions')
    expect(html).toContain('review.approve')
    expect(html).toContain('review.reject')
  })

  it('shows optimization summary dialog after one-click optimization succeeds', async () => {
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'REJECTED',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: 'system-auto-review',
        reviewedByName: 'system-auto-review',
        reviewedAt: '2026-03-19T00:05:00Z',
        reviewComment: '# Skill Judge 自动审核报告\n\n结论：自动拒绝\n分数：84/120',
      },
      isLoading: false,
    })

    render(<ReviewDetailPage />)
    fireEvent.click(screen.getByText('review.optimizeWithSkillJudge'))

    await waitFor(() => {
      expect(screen.getByTestId('optimization-summary-dialog')).toBeDefined()
    })
    expect(screen.getAllByText('触发条件').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('原始 description')).toBeDefined()
    expect(screen.getByText('分数：84/120')).toBeDefined()
    expect(screen.getByText('description 缺少明确触发场景')).toBeDefined()
    expect(screen.getByText('补充什么任务会触发该 Skill')).toBeDefined()
  })

  it('hides one-click optimization from reviewers who did not submit the rejected review', () => {
    userMock.userId = 'reviewer-1'
    userMock.platformRoles = ['SKILL_ADMIN']
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'REJECTED',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: 'system-auto-review',
        reviewedByName: 'system-auto-review',
        reviewedAt: '2026-03-19T00:05:00Z',
        reviewComment: '# Skill Judge 自动审核报告\n\n结论：自动拒绝\n分数：84/120',
      },
      isLoading: false,
    })

    render(<ReviewDetailPage />)

    expect(screen.getByTestId('review-comment-report')).toBeDefined()
    expect(screen.queryByText('review.optimizeWithSkillJudge')).toBeNull()
  })

  it('closes the optimization dialog and opens the optimized review task', async () => {
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'global',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'REJECTED',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: 'system-auto-review',
        reviewedByName: 'system-auto-review',
        reviewedAt: '2026-03-19T00:05:00Z',
        reviewComment: '# Skill Judge 自动审核报告\n\n结论：自动拒绝\n分数：84/120',
      },
      isLoading: false,
    })

    render(<ReviewDetailPage />)
    fireEvent.click(screen.getByText('review.optimizeWithSkillJudge'))

    await waitFor(() => {
      expect(screen.getByTestId('optimization-summary-dialog')).toBeDefined()
    })

    fireEvent.click(screen.getByText('review.optimizeDialogViewReview'))

    expect(navigateMock).toHaveBeenCalledWith({ to: '/dashboard/reviews/100' })
    await waitFor(() => {
      expect(screen.queryByTestId('optimization-summary-dialog')).toBeNull()
    })
  })

  it('renders namespace review detail through the namespace route wrapper', () => {
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'team-alpha',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'PENDING',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
      },
      isLoading: false,
    })

    const html = renderToStaticMarkup(<NamespaceReviewDetailPage />)

    expect(html).toContain('review.detail')
    expect(html).toContain('demo-skill')
  })

  it('redirects namespace reviews opened through the global route for namespace operators', () => {
    userMock.platformRoles = []
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'team-alpha',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'PENDING',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
      },
      isLoading: false,
    })

    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).toBe('')
  })

  it('shows not-found state when the namespace route slug does not match the review namespace', () => {
    useReviewDetailMock.mockReturnValue({
      data: {
        id: 13,
        namespace: 'other-team',
        skillSlug: 'demo-skill',
        version: '1.2.0',
        status: 'PENDING',
        submittedBy: 'local-admin',
        submittedByName: 'Local Admin',
        submittedAt: '2026-03-19T00:00:00Z',
        reviewedBy: null,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
      },
      isLoading: false,
    })

    const html = renderToStaticMarkup(<NamespaceReviewDetailPage />)

    expect(html).toContain('review.notFound')
    expect(html).toContain('review.backToList')
  })

  it('disables approval and shows a scanning hint while the active review version is scanning', () => {
    userMock.userId = 'reviewer-1'
    userMock.platformRoles = ['SKILL_ADMIN']
    useReviewSkillDetailMock.mockReturnValue({
      data: {
        skill: {
          id: 1,
          slug: 'demo-skill',
          displayName: 'Demo Skill',
          visibility: 'PUBLIC',
          status: 'ACTIVE',
          downloadCount: 3,
          starCount: 1,
          ratingCount: 0,
          hidden: false,
          namespace: 'global',
          canManageLifecycle: false,
          canSubmitPromotion: false,
          canInteract: false,
          canReport: false,
          resolutionMode: 'REVIEW_TASK',
        },
        versions: [
          {
            id: 10,
            version: '1.2.0',
            status: 'SCANNING',
            changelog: 'Pending update',
            fileCount: 2,
            totalSize: 120,
            publishedAt: '2026-03-19T00:00:00Z',
            downloadAvailable: true,
          },
        ],
        files: [],
        documentationPath: 'README.md',
        documentationContent: '# Demo Skill',
        downloadUrl: '/api/v1/reviews/13/download',
        activeVersion: '1.2.0',
      },
      isLoading: false,
      error: null,
    })

    const html = renderToStaticMarkup(<ReviewDetailPage />)

    expect(html).toContain('review.approveDisabledScanning')
    expect(html).toContain('disabled=""')
  })
})
