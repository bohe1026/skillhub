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
import {
  SKILL_DISCOVERY_GROUPS,
  SKILL_DISCOVERY_LABEL_SLUGS,
  type SkillDiscoveryItem,
} from '@/shared/lib/skill-discovery-taxonomy'

const PAGE_SIZE = 12

const DISCOVERY_ICONS = {
  content: Image,
  document: FileText,
  data: BarChart3,
  development: Code2,
  office: Briefcase,
  opsSecurity: ShieldCheck,
}

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

  const handleDiscoverySelect = (item: SkillDiscoveryItem) => {
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
  const secondaryLabels = labels?.filter((label) => !SKILL_DISCOVERY_LABEL_SLUGS.has(label.slug)) ?? []

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
            {SKILL_DISCOVERY_GROUPS.map((group) => {
              const Icon = DISCOVERY_ICONS[group.iconKey]
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
