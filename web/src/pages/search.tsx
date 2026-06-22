import { startTransition, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BarChart3, Briefcase, Code2, FileText, Image, Loader2, SearchCheck, ShieldCheck } from 'lucide-react'
import type { LabelItem, SkillSummary } from '@/api/types'
import { useAuth } from '@/features/auth/use-auth'
import { SearchBar } from '@/features/search/search-bar'
import { SkillCard } from '@/features/skill/skill-card'
import { SkeletonList } from '@/shared/components/skeleton-loader'
import { EmptyState } from '@/shared/components/empty-state'
import { Pagination } from '@/shared/components/pagination'
import { useSearchSkills } from '@/shared/hooks/use-skill-queries'
import { useVisibleLabels } from '@/shared/hooks/use-label-queries'
import { useMyStars } from '@/shared/hooks/use-user-queries'
import { normalizeSearchQuery } from '@/shared/lib/search-query'
import { Button } from '@/shared/ui/button'
import { APP_SHELL_PAGE_CLASS_NAME } from '@/app/page-shell-style'

const PAGE_SIZE = 12

type DiscoveryItem = {
  labelKey: string
  fallbackLabel: string
  slug: string
  query: string
}

type DiscoveryGroup = DiscoveryItem & {
  icon: typeof Image
  accentClassName: string
  scenarios: DiscoveryItem[]
}

const DISCOVERY_GROUPS: DiscoveryGroup[] = [
  {
    icon: Image,
    labelKey: 'search.discovery.groups.content',
    fallbackLabel: '内容生成',
    slug: 'cat-content-generation',
    query: '内容生成',
    accentClassName: 'bg-blue-600 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.textToImage', fallbackLabel: '文生图', slug: 'scene-text-to-image', query: '文生图' },
      { labelKey: 'search.discovery.scenarios.imageToImage', fallbackLabel: '图生图', slug: 'scene-image-to-image', query: '图生图' },
      { labelKey: 'search.discovery.scenarios.textToVideo', fallbackLabel: '文生视频', slug: 'scene-text-to-video', query: '文生视频' },
    ],
  },
  {
    icon: FileText,
    labelKey: 'search.discovery.groups.document',
    fallbackLabel: '文档知识',
    slug: 'cat-document-knowledge',
    query: '文档 知识',
    accentClassName: 'bg-emerald-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.contractReview', fallbackLabel: '合同审查', slug: 'scene-contract-review', query: '合同审查' },
      { labelKey: 'search.discovery.scenarios.knowledgeQa', fallbackLabel: '知识问答', slug: 'scene-knowledge-qa', query: '知识问答' },
      { labelKey: 'search.discovery.scenarios.reportWriting', fallbackLabel: '报告生成', slug: 'scene-report-writing', query: '报告生成' },
    ],
  },
  {
    icon: BarChart3,
    labelKey: 'search.discovery.groups.data',
    fallbackLabel: '数据分析',
    slug: 'cat-data-analysis',
    query: '数据分析',
    accentClassName: 'bg-cyan-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.sql', fallbackLabel: 'SQL 生成', slug: 'scene-sql-generation', query: 'SQL 生成' },
      { labelKey: 'search.discovery.scenarios.reportAnalysis', fallbackLabel: '报表分析', slug: 'scene-report-analysis', query: '报表分析' },
      { labelKey: 'search.discovery.scenarios.charting', fallbackLabel: '图表生成', slug: 'scene-charting', query: '图表生成' },
    ],
  },
  {
    icon: Code2,
    labelKey: 'search.discovery.groups.development',
    fallbackLabel: '研发提效',
    slug: 'cat-development',
    query: '研发 提效',
    accentClassName: 'bg-violet-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.codeReview', fallbackLabel: '代码审查', slug: 'scene-code-review', query: '代码审查' },
      { labelKey: 'search.discovery.scenarios.unitTest', fallbackLabel: '单测生成', slug: 'scene-unit-test', query: '单测生成' },
      { labelKey: 'search.discovery.scenarios.logAnalysis', fallbackLabel: '日志分析', slug: 'scene-log-analysis', query: '日志分析' },
    ],
  },
  {
    icon: Briefcase,
    labelKey: 'search.discovery.groups.office',
    fallbackLabel: '业务办公',
    slug: 'cat-office',
    query: '业务办公',
    accentClassName: 'bg-amber-500 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.meeting', fallbackLabel: '会议纪要', slug: 'scene-meeting-notes', query: '会议纪要' },
      { labelKey: 'search.discovery.scenarios.email', fallbackLabel: '邮件撰写', slug: 'scene-email-writing', query: '邮件撰写' },
      { labelKey: 'search.discovery.scenarios.customerService', fallbackLabel: '客服回复', slug: 'scene-customer-service', query: '客服回复' },
    ],
  },
  {
    icon: ShieldCheck,
    labelKey: 'search.discovery.groups.opsSecurity',
    fallbackLabel: '运维安全',
    slug: 'cat-ops-security',
    query: '运维 安全',
    accentClassName: 'bg-slate-700 text-white',
    scenarios: [
      { labelKey: 'search.discovery.scenarios.alert', fallbackLabel: '告警分析', slug: 'scene-alert-analysis', query: '告警分析' },
      { labelKey: 'search.discovery.scenarios.securityScan', fallbackLabel: '安全扫描', slug: 'scene-security-scan', query: '安全扫描' },
      { labelKey: 'search.discovery.scenarios.riskReport', fallbackLabel: '风险报告', slug: 'scene-risk-report', query: '风险报告' },
    ],
  },
]

const DISCOVERY_LABEL_SLUGS = new Set(
  DISCOVERY_GROUPS.flatMap((group) => [group.slug, ...group.scenarios.map((scenario) => scenario.slug)])
)

function blurActiveElement() {
  if (typeof document === 'undefined' || typeof HTMLElement === 'undefined') {
    return
  }

  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}

function findVisibleLabel(labels: LabelItem[] | undefined, slug: string) {
  return labels?.find((label) => label.slug === slug)
}

function scrollToTopOnPageChange() {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let secondFrame = 0
  const firstFrame = window.requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    secondFrame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' })
    })
  })

  return () => {
    window.cancelAnimationFrame(firstFrame)
    if (secondFrame) {
      window.cancelAnimationFrame(secondFrame)
    }
  }
}

/**
 * Skill discovery page with synchronized URL state.
 *
 * Search text, sorting, pagination, and the starred-only filter are mirrored into router search
 * params so the page can be shared, restored, and revisited without losing state.
 */
function filterStarredSkills(skills: SkillSummary[], query: string): SkillSummary[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return skills
  }

  return skills.filter((skill) =>
    [skill.displayName, skill.summary, skill.namespace, skill.slug]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery))
  )
}

function sortStarredSkills(skills: SkillSummary[], sort: string): SkillSummary[] {
  const sorted = [...skills]
  if (sort === 'downloads') {
    return sorted.sort((left, right) => right.downloadCount - left.downloadCount)
  }
  if (sort === 'newest' || sort === 'relevance') {
    return sorted.sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }
  return sorted
}

export function SearchPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const searchParams = useSearch({ from: '/search' })
  const { isAuthenticated } = useAuth()

  const q = normalizeSearchQuery(searchParams.q || '')
  const selectedLabel = searchParams.label || ''
  const sort = searchParams.sort || 'newest'
  const page = searchParams.page ?? 0
  const starredOnly = searchParams.starredOnly ?? false
  const [queryInput, setQueryInput] = useState(q)
  const previousPageRef = useRef(page)

  useEffect(() => {
    setQueryInput(q)
  }, [q])

  useEffect(() => {
    if (previousPageRef.current !== page) {
      blurActiveElement()
      const cleanupScroll = scrollToTopOnPageChange()

      previousPageRef.current = page
      return () => {
        cleanupScroll()
      }
    }

    previousPageRef.current = page
  }, [page])

  const { data, isLoading, isFetching } = useSearchSkills({
    q,
    label: selectedLabel || undefined,
    sort,
    page,
    size: PAGE_SIZE,
    starredOnly,
  })
  const { data: labels } = useVisibleLabels()
  const {
    data: starredSkills,
    isLoading: isLoadingStarred,
    isFetching: isFetchingStarred,
  } = useMyStars(starredOnly && isAuthenticated)
  useEffect(() => {
    // Debounce URL updates while the user is typing so query state stays shareable without
    // triggering a navigation on every keystroke.
    const normalizedQuery = normalizeSearchQuery(queryInput)
    if (normalizedQuery === q) {
      return
    }

    if (!normalizedQuery) {
      startTransition(() => {
        navigate({ to: '/search', search: { q: '', label: selectedLabel, sort, page: 0, starredOnly }, replace: page === 0 })
      })
      return
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        navigate({ to: '/search', search: { q: normalizedQuery, label: selectedLabel, sort, page: 0, starredOnly }, replace: true })
      })
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [navigate, page, q, queryInput, selectedLabel, sort, starredOnly])

  const handleSearch = (query: string) => {
    const normalizedQuery = normalizeSearchQuery(query)
    setQueryInput(query)
    startTransition(() => {
      navigate({ to: '/search', search: { q: normalizedQuery, label: selectedLabel, sort, page: 0, starredOnly }, replace: true })
    })
  }

  const handleSortChange = (newSort: string) => {
    navigate({ to: '/search', search: { q, label: selectedLabel, sort: newSort, page: 0, starredOnly } })
  }

  const handlePageChange = (newPage: number) => {
    blurActiveElement()
    navigate({ to: '/search', search: { q, label: selectedLabel, sort, page: newPage, starredOnly } })
  }

  const handleLabelToggle = (label: string) => {
    const nextLabel = selectedLabel === label ? '' : label
    navigate({ to: '/search', search: { q, label: nextLabel, sort, page: 0, starredOnly } })
  }

  const handleDiscoverySelect = (item: DiscoveryItem) => {
    const matchedLabel = findVisibleLabel(labels, item.slug)
    navigate({
      to: '/search',
      search: {
        q: matchedLabel ? '' : item.query,
        label: matchedLabel?.slug ?? '',
        sort: 'relevance',
        page: 0,
        starredOnly: false,
      },
    })
  }

  const handleStarredToggle = () => {
    if (!isAuthenticated) {
      navigate({
        to: '/login',
        search: {
          returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
        },
      })
      return
    }

    navigate({ to: '/search', search: { q, label: selectedLabel, sort, page: 0, starredOnly: !starredOnly } })
  }

  const handleSkillClick = (namespace: string, slug: string) => {
    navigate({ to: `/space/${namespace}/${encodeURIComponent(slug)}`, search: { returnTo: `${window.location.pathname}${window.location.search}` } })
  }

  const filteredStarredSkills = starredOnly
    ? sortStarredSkills(filterStarredSkills(starredSkills ?? [], q), sort)
    : []
  const starredPageItems = starredOnly
    ? filteredStarredSkills.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : []
  const totalPages = starredOnly
    ? Math.ceil(filteredStarredSkills.length / PAGE_SIZE)
    : data
      ? Math.ceil(data.total / data.size)
      : 0
  const displayItems = starredOnly ? starredPageItems : (data?.items ?? [])
  const isPageLoading = starredOnly ? isLoadingStarred : isLoading
  const isUpdatingResults = starredOnly ? isFetchingStarred && !isLoadingStarred : isFetching && !isLoading
  const resultCount = starredOnly ? filteredStarredSkills.length : (data?.total ?? 0)
  const secondaryLabels = labels?.filter((label) => !DISCOVERY_LABEL_SLUGS.has(label.slug)) ?? []

  return (
    <div className={APP_SHELL_PAGE_CLASS_NAME}>
      {/* Search Bar */}
      <div className="max-w-3xl mx-auto">
        <SearchBar
          value={queryInput}
          isSearching={isUpdatingResults}
          onChange={setQueryInput}
          onSearch={handleSearch}
        />
      </div>

      {!starredOnly && (
        <section className="overflow-hidden rounded-lg border border-blue-100 bg-[linear-gradient(135deg,rgba(239,247,255,0.98)_0%,rgba(255,255,255,0.96)_52%,rgba(232,245,255,0.92)_100%)] p-5 shadow-[0_24px_70px_-46px_rgba(37,99,235,0.55)] md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white/80 px-3 py-1.5 text-sm font-bold text-blue-700">
                <SearchCheck className="h-4 w-4" strokeWidth={1.9} />
                {t('search.discovery.badge')}
              </div>
              <h2 className="text-2xl font-black text-slate-950 md:text-3xl">{t('search.discovery.title')}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                {t('search.discovery.description')}
              </p>
            </div>
            {selectedLabel || q ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/search', search: { q: '', label: '', sort: 'newest', page: 0, starredOnly: false } })}
              >
                {t('search.discovery.clear')}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DISCOVERY_GROUPS.map((group) => {
              const Icon = group.icon
              const isGroupActive = selectedLabel === group.slug || (!selectedLabel && q === group.query)

              return (
                <article
                  key={group.slug}
                  className={`rounded-lg border bg-white/92 p-4 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.36)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_58px_-38px_rgba(37,99,235,0.45)] ${isGroupActive ? 'border-blue-300 ring-2 ring-blue-100' : 'border-white/80'}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 text-left"
                    onClick={() => handleDiscoverySelect(group)}
                  >
                    <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg ${group.accentClassName}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </span>
                    <span>
                      <span className="block text-lg font-black text-slate-950">
                        {t(group.labelKey, { defaultValue: group.fallbackLabel })}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-slate-500">
                        {t('search.discovery.groupHint')}
                      </span>
                    </span>
                  </button>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.scenarios.map((scenario) => {
                      const matchedLabel = findVisibleLabel(labels, scenario.slug)
                      const isScenarioActive = selectedLabel === scenario.slug || (!selectedLabel && q === scenario.query)

                      return (
                        <Button
                          key={scenario.slug}
                          type="button"
                          variant={isScenarioActive ? 'default' : 'outline'}
                          size="sm"
                          className="h-auto rounded-lg px-3 py-2 text-sm font-bold"
                          title={matchedLabel ? t('search.discovery.labelMatched') : t('search.discovery.keywordFallback')}
                          onClick={() => handleDiscoverySelect(scenario)}
                        >
                          {t(scenario.labelKey, { defaultValue: scenario.fallbackLabel })}
                        </Button>
                      )
                    })}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* Sort And Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{t('search.sort.label')}</span>
            <div className="flex gap-2">
              <Button
                variant={sort === 'relevance' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('relevance')}
              >
                {t('search.sort.relevance')}
              </Button>
              <Button
                variant={sort === 'downloads' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('downloads')}
              >
                {t('search.sort.downloads')}
              </Button>
              <Button
                variant={sort === 'newest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSortChange('newest')}
              >
                {t('search.sort.newest')}
              </Button>
            </div>
          </div>

          {resultCount > 0 && (
            <div className="text-sm text-muted-foreground">
              {t('search.results', { count: resultCount })}
            </div>
          )}
        </div>

        {isUpdatingResults ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('search.loadingMore')}</span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('search.filters.label')}</span>
          <Button
            variant={starredOnly ? 'default' : 'outline'}
            size="sm"
            onClick={handleStarredToggle}
          >
            {t('search.filterStarred')}
          </Button>
          {!starredOnly && secondaryLabels.map((label) => (
            <Button
              key={label.slug}
              variant={selectedLabel === label.slug ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLabelToggle(label.slug)}
            >
              {label.displayName}
            </Button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isPageLoading ? (
        <SkeletonList count={PAGE_SIZE} />
      ) : displayItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayItems.map((skill, idx) => (
              <div key={skill.id} className={`h-full animate-fade-up delay-${Math.min(idx % 6 + 1, 6)}`}>
                <SkillCard
                  skill={skill}
                  highlightStarred
                  onClick={() => handleSkillClick(skill.namespace, skill.slug)}
                />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <EmptyState
          title={starredOnly ? t('search.noStarredResults') : t('search.noResults')}
          description={
            starredOnly
              ? (q ? t('search.noStarredResultsFor', { q }) : t('search.noStarredSkills'))
              : (q ? t('search.noResultsFor', { q }) : undefined)
          }
        />
      )}
    </div>
  )
}
