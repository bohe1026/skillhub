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
      <section className="relative overflow-hidden border-b border-[#e0e0e0] px-4 pb-14 pt-12 md:px-8 md:pb-20 md:pt-16">
        <div className="mx-auto flex min-h-[520px] max-w-[1312px] flex-col items-start justify-center text-left">
          <div className="w-full max-w-5xl">
            <div className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">
              {t('landing.badge')}
            </div>

            <h1 className="max-w-none text-left text-[clamp(2.5rem,5vw,4.75rem)] font-light leading-[1.05] text-[#161616] md:whitespace-nowrap">
              {t('landing.hero.title')}
            </h1>
            <p className="mt-6 max-w-2xl text-base font-normal leading-7 text-[#525252] md:text-lg">
              {t('landing.hero.subtitle')}
            </p>

            <div className="mt-8 flex w-full max-w-2xl items-center bg-[#f4f4f4]">
              <SearchIcon className="ml-4 h-5 w-5 flex-shrink-0 text-[#525252]" strokeWidth={1.8} />
              <input
                type="text"
                aria-label={t('landing.hero.searchPlaceholder')}
                placeholder={t('landing.hero.searchPlaceholder')}
                className="hero-input h-12 min-w-0 flex-1 border-b border-[#8d8d8d] bg-transparent px-4 text-base text-[#161616] outline-none focus:border-b-2 focus:border-[#0f62fe]"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSearch((event.target as HTMLInputElement).value)
                  }
                }}
              />
              <Button
                type="button"
                className="hidden h-12 sm:inline-flex"
                onClick={() => navigate({ to: '/search', search: { q: '', sort: 'relevance', page: 0, starredOnly: false } })}
              >
                {t('landing.hero.exploreSkills')}
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap justify-start gap-2">
              {QUICK_SCENARIOS.map((scenario) => (
                <button
                  key={scenario}
                  type="button"
                  className="rounded-full bg-[#edf5ff] px-3 py-1.5 text-sm font-medium text-[#0043ce] transition hover:bg-[#d0e2ff]"
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
                className="inline-flex min-h-12 items-center justify-center gap-8 bg-[#0f62fe] px-6 py-3 text-base font-medium text-white transition hover:bg-[#0353e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f62fe]"
              >
                {t('landing.hero.exploreSkills')}
                <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
              </Link>
              <Link
                to="/dashboard/publish"
                className="inline-flex min-h-12 items-center justify-center border border-[#0f62fe] bg-transparent px-6 py-3 text-base font-medium text-[#0f62fe] transition hover:bg-[#edf5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0f62fe]"
              >
                {t('landing.hero.publishSkill')}
              </Link>
            </div>
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
      className={`relative z-10 w-full border-b border-[#e0e0e0] px-4 py-16 md:px-8 scroll-fade-up${inView ? ' in-view' : ''}`}
      style={{ background: sort === 'downloads' ? '#f4f4f4' : '#ffffff' }}
    >
      <div className="mx-auto max-w-[1312px] space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0f62fe]">{sort === 'downloads' ? 'Popular' : 'Latest'}</p>
            <h2 className="text-3xl font-normal text-[#161616] md:text-[2.625rem] md:leading-tight">{title}</h2>
            <p className="mt-3 text-base leading-7 text-[#525252]">{description}</p>
          </div>
          <Button variant="ghost" onClick={onViewAll}>
            {viewAllLabel}
          </Button>
        </div>

        {isLoading ? (
          <SkeletonList count={6} />
        ) : (
          <div className="grid grid-cols-1 gap-px bg-[#c6c6c6] md:grid-cols-2 lg:grid-cols-3">
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
