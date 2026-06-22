import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { RefObject } from 'react'
import { ArrowRight, Search as SearchIcon } from 'lucide-react'
import type { SkillSummary } from '@/api/types'
import { SkillCard } from '@/features/skill/skill-card'
import { SkeletonList } from '@/shared/components/skeleton-loader'
import { useSearchSkills } from '@/shared/hooks/use-skill-queries'
import { useInView } from '@/shared/hooks/use-in-view'
import { normalizeSearchQuery } from '@/shared/lib/search-query'
import { Button } from '@/shared/ui/button'

interface SkillShowcaseSectionProps {
  title: string
  description: string
  sort: 'downloads' | 'newest'
  skills?: SkillSummary[]
  isLoading: boolean
  inViewRef: RefObject<HTMLDivElement | null>
  inView: boolean
  onViewAll: () => void
  onSkillClick: (namespace: string, slug: string) => void
  viewAllLabel: string
}

const QUICK_SCENARIOS = ['文生图', '合同审查', '数据分析', '代码审查', '日志分析']

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: popularSkills, isLoading: isLoadingPopular } = useSearchSkills({
    sort: 'downloads',
    size: 6,
  })

  const { data: latestSkills, isLoading: isLoadingLatest } = useSearchSkills({
    sort: 'newest',
    size: 6,
  })

  const popularView = useInView()
  const latestView = useInView()

  const handleSearch = (query: string) => {
    navigate({
      to: '/search',
      search: { q: normalizeSearchQuery(query), sort: 'relevance', page: 0, starredOnly: false },
    })
  }

  const handleSkillClick = (namespace: string, slug: string) => {
    navigate({ to: `/space/${namespace}/${encodeURIComponent(slug)}` })
  }

  return (
    <div className="landing-tech-page">
      <section className="relative overflow-hidden px-4 pb-14 pt-12 md:px-8 md:pb-20 md:pt-16">
        <div className="mx-auto flex min-h-[520px] max-w-5xl flex-col items-center justify-center text-center">
          <div className="mb-5 inline-flex items-center rounded-lg border border-blue-100 bg-white/80 px-3 py-2 text-sm font-semibold text-blue-700 shadow-[0_12px_32px_-24px_rgba(37,99,235,0.65)] backdrop-blur">
            {t('landing.badge')}
          </div>

          <h1 className="max-w-4xl text-[clamp(2.5rem,7vw,4.8rem)] font-black leading-[1.05] text-slate-950">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-600 md:text-lg">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-8 flex w-full max-w-2xl items-center gap-2 rounded-lg border border-white/80 bg-white/86 p-2 shadow-[0_24px_64px_-38px_rgba(37,99,235,0.5)] backdrop-blur">
            <SearchIcon className="ml-3 h-5 w-5 flex-shrink-0 text-blue-500" strokeWidth={1.9} />
            <input
              type="text"
              aria-label={t('landing.hero.searchPlaceholder')}
              placeholder={t('landing.hero.searchPlaceholder')}
              className="hero-input h-12 min-w-0 flex-1 bg-transparent text-base font-medium text-slate-900 outline-none"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  handleSearch((event.target as HTMLInputElement).value)
                }
              }}
            />
            <Button
              type="button"
              className="hidden sm:inline-flex"
              onClick={() => navigate({ to: '/search', search: { q: '', sort: 'relevance', page: 0, starredOnly: false } })}
            >
              {t('landing.hero.exploreSkills')}
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {QUICK_SCENARIOS.map((scenario) => (
              <button
                key={scenario}
                type="button"
                className="rounded-lg border border-blue-100 bg-white/72 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-200 hover:bg-white"
                onClick={() => handleSearch(scenario)}
              >
                {scenario}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/search"
              search={{ q: '', sort: 'relevance', page: 0, starredOnly: false }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-[0_18px_36px_-18px_rgba(37,99,235,0.75)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t('landing.hero.exploreSkills')}
              <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
            </Link>
            <Link
              to="/dashboard/publish"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white/75 px-6 py-3 text-base font-semibold text-blue-700 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.5)] backdrop-blur transition hover:border-blue-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {t('landing.hero.publishSkill')}
            </Link>
          </div>
        </div>
      </section>

      <SkillShowcaseSection
        title={t('home.popularTitle')}
        description={t('home.popularDescription')}
        sort="downloads"
        skills={popularSkills?.items}
        isLoading={isLoadingPopular}
        inViewRef={popularView.ref}
        inView={popularView.inView}
        viewAllLabel={t('home.viewAll')}
        onViewAll={() => navigate({ to: '/search', search: { q: '', sort: 'downloads', page: 0, starredOnly: false } })}
        onSkillClick={handleSkillClick}
      />

      <SkillShowcaseSection
        title={t('home.latestTitle')}
        description={t('home.latestDescription')}
        sort="newest"
        skills={latestSkills?.items}
        isLoading={isLoadingLatest}
        inViewRef={latestView.ref}
        inView={latestView.inView}
        viewAllLabel={t('home.viewAll')}
        onViewAll={() => navigate({ to: '/search', search: { q: '', sort: 'newest', page: 0, starredOnly: false } })}
        onSkillClick={handleSkillClick}
      />
    </div>
  )
}

function SkillShowcaseSection({
  title,
  description,
  sort,
  skills,
  isLoading,
  inViewRef,
  inView,
  onViewAll,
  onSkillClick,
  viewAllLabel,
}: SkillShowcaseSectionProps) {
  return (
    <section
      ref={inViewRef}
      className={`relative z-10 w-full px-4 py-12 md:px-8 md:py-14 scroll-fade-up${inView ? ' in-view' : ''}`}
      style={{ background: sort === 'downloads' ? 'rgba(255,255,255,0.66)' : 'rgba(239,247,255,0.58)' }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase text-blue-600">{sort === 'downloads' ? 'Popular' : 'Latest'}</p>
            <h2 className="text-3xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-base leading-7 text-slate-600">{description}</p>
          </div>
          <Button variant="ghost" onClick={onViewAll}>
            {viewAllLabel}
          </Button>
        </div>

        {isLoading ? (
          <SkeletonList count={6} />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {skills?.map((skill, index) => (
              <div key={skill.id} className={`animate-fade-up delay-${Math.min(index + 1, 6)}`}>
                <SkillCard
                  skill={skill}
                  onClick={() => onSkillClick(skill.namespace, skill.slug)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
