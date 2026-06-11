import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import type { RefObject } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Bot,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  GitBranch,
  Globe2,
  LockKeyhole,
  PackageOpen,
  PlayCircle,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
} from 'lucide-react'
import type { SkillSummary } from '@/api/types'
import { normalizeSearchQuery } from '@/shared/lib/search-query'
import { LandingQuickStartSection } from '@/shared/components/landing-quick-start'
import { SkillCard } from '@/features/skill/skill-card'
import { SkeletonList } from '@/shared/components/skeleton-loader'
import { useSearchSkills } from '@/shared/hooks/use-skill-queries'
import { useInView } from '@/shared/hooks/use-in-view'
import { Button } from '@/shared/ui/button'

interface LandingIconItem {
  icon: LucideIcon
  title: string
  description?: string
  tone?: string
}

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

/**
 * Landing page for unauthenticated and first-time visitors.
 *
 * The first viewport uses a light enterprise-tech composition while keeping the existing registry
 * actions live: search, publish, popular skills, latest skills, and quick-start commands.
 */
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

  const heroView = useInView()
  const quickStartView = useInView()
  const popularView = useInView()
  const latestView = useInView()

  const handleSearch = (query: string) => {
    const normalized = normalizeSearchQuery(query)
    navigate({
      to: '/search',
      search: { q: normalized, sort: 'relevance', page: 0, starredOnly: false },
    })
  }

  const handleSkillClick = (namespace: string, slug: string) => {
    navigate({ to: `/space/${namespace}/${encodeURIComponent(slug)}` })
  }

  const capabilityTags: LandingIconItem[] = [
    {
      icon: Sparkles,
      title: t('landing.techTags.ai', { defaultValue: 'AI skills' }),
    },
    {
      icon: Cloud,
      title: t('landing.techTags.cloud', { defaultValue: 'Private registry' }),
    },
    {
      icon: Database,
      title: t('landing.techTags.data', { defaultValue: 'Versioned assets' }),
    },
    {
      icon: ShieldCheck,
      title: t('landing.techTags.security', { defaultValue: 'Trusted review' }),
    },
  ]

  const featureCards: LandingIconItem[] = [
    {
      icon: Boxes,
      title: t('landing.features.integration.title'),
      description: t('landing.features.integration.description'),
      tone: 'from-blue-600 to-cyan-400',
    },
    {
      icon: GitBranch,
      title: t('landing.features.versionControl.title'),
      description: t('landing.features.versionControl.description'),
      tone: 'from-emerald-500 to-teal-400',
    },
    {
      icon: ShieldCheck,
      title: t('landing.features.secure.title'),
      description: t('landing.features.secure.description'),
      tone: 'from-blue-700 to-sky-500',
    },
    {
      icon: Users,
      title: t('landing.features.community.title'),
      description: t('landing.features.community.description'),
      tone: 'from-sky-500 to-blue-600',
    },
  ]

  const stats: LandingIconItem[] = [
    {
      icon: PackageOpen,
      title: '1000+',
      description: t('landing.stats.skills', { defaultValue: 'Registry items' }),
    },
    {
      icon: Workflow,
      title: '50K+',
      description: t('landing.stats.downloads', { defaultValue: 'Downloads' }),
    },
    {
      icon: Users,
      title: '200+',
      description: t('landing.stats.teams', { defaultValue: 'Teams' }),
    },
    {
      icon: Globe2,
      title: '10+',
      description: t('landing.stats.coverage', { defaultValue: 'Workflows' }),
    },
  ]

  const missionItems: LandingIconItem[] = [
    {
      icon: Bot,
      title: t('landing.mission.automation.title', { defaultValue: 'Automation' }),
      description: t('landing.mission.automation.description', {
        defaultValue: 'Use review and reuse workflows to keep Agent skills moving.',
      }),
    },
    {
      icon: CheckCircle2,
      title: t('landing.mission.quality.title', { defaultValue: 'Quality first' }),
      description: t('landing.mission.quality.description', {
        defaultValue: 'Make every package easier to evaluate, approve, and install.',
      }),
    },
    {
      icon: LockKeyhole,
      title: t('landing.mission.control.title', { defaultValue: 'Controlled sharing' }),
      description: t('landing.mission.control.description', {
        defaultValue: 'Keep enterprise skill assets discoverable without losing governance.',
      }),
    },
  ]

  return (
    <div className="landing-tech-page">
      <section
        ref={heroView.ref}
        className="relative overflow-hidden px-4 pb-10 pt-8 md:px-8 md:pb-14 md:pt-12"
      >
        <div className="mx-auto max-w-[1440px]">
          <div className="grid min-h-[560px] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
            <div className="relative z-10 max-w-2xl pt-4 md:pt-0">
              <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white/78 px-3 py-2 text-sm font-semibold text-blue-700 shadow-[0_12px_32px_-24px_rgba(37,99,235,0.65)] backdrop-blur">
                <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                <span>{t('landing.badge')}</span>
              </div>

              <h1 className="whitespace-nowrap text-[clamp(2.1rem,9.5vw,3.2rem)] font-black leading-[1.08] text-slate-950 lg:text-[3.7rem]">
                {t('landing.hero.title')}
              </h1>
              <p className="mt-6 max-w-xl text-base font-medium leading-8 text-slate-600 md:text-lg">
                {t('landing.hero.subtitle')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/search"
                  search={{ q: '', sort: 'relevance', page: 0, starredOnly: false }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-[0_18px_36px_-18px_rgba(37,99,235,0.75)] transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <SearchIcon className="h-4 w-4" strokeWidth={1.9} />
                  {t('landing.hero.exploreSkills')}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
                </Link>
                <Link
                  to="/dashboard/publish"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/72 px-6 py-3 text-base font-semibold text-blue-700 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.5)] backdrop-blur transition hover:border-blue-200 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {t('landing.hero.publishSkill')}
                  <PlayCircle className="h-4 w-4" strokeWidth={1.9} />
                </Link>
              </div>

              <div className="mt-8 max-w-xl rounded-lg border border-white/80 bg-white/78 p-2 shadow-[0_22px_52px_-34px_rgba(15,23,42,0.45)] backdrop-blur">
                <div className="flex min-h-12 items-center gap-3 rounded-md border border-blue-50 bg-slate-50/85 px-4">
                  <SearchIcon className="h-5 w-5 flex-shrink-0 text-blue-500" strokeWidth={1.8} />
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
                </div>
              </div>

              <div className="mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
                {capabilityTags.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.title}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/75 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_30px_-26px_rgba(15,23,42,0.45)] backdrop-blur"
                    >
                      <Icon className="h-4 w-4 flex-shrink-0 text-blue-600" strokeWidth={1.8} />
                      <span className="truncate">{item.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <TechHeroVisual />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  key={feature.title}
                  className="group rounded-lg border border-white/80 bg-white/82 p-5 shadow-[0_20px_50px_-34px_rgba(15,23,42,0.38)] backdrop-blur transition hover:-translate-y-0.5 hover:shadow-[0_24px_56px_-30px_rgba(37,99,235,0.28)]"
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.tone} text-white shadow-[0_18px_30px_-18px_rgba(37,99,235,0.55)]`}>
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-blue-500 transition group-hover:translate-x-1" strokeWidth={1.8} />
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-5 grid gap-4 rounded-lg border border-white/85 bg-white/74 px-5 py-5 shadow-[0_20px_48px_-34px_rgba(15,23,42,0.36)] backdrop-blur md:grid-cols-4 md:px-8">
            {stats.map((stat) => {
              const Icon = stat.icon

              return (
                <div key={stat.description} className="flex items-center gap-4 md:justify-center">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Icon className="h-7 w-7" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-3xl font-black leading-none text-slate-950">{stat.title}</div>
                    <div className="mt-1 text-sm font-medium text-slate-500">{stat.description}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <section className="mt-5 overflow-hidden rounded-lg border border-blue-100 bg-[linear-gradient(105deg,rgba(239,247,255,0.96)_0%,rgba(231,244,255,0.9)_54%,rgba(255,255,255,0.45)_100%)] px-6 py-7 shadow-[0_18px_46px_-34px_rgba(15,23,42,0.35)] md:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.8fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-950">{t('landing.whySkillHub.title')}</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
                  {t('landing.whySkillHub.subtitle')}
                </p>
                <Link
                  to="/search"
                  search={{ q: '', sort: 'relevance', page: 0, starredOnly: false }}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800"
                >
                  {t('home.viewAll')}
                  <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {missionItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <div key={item.title} className="flex gap-3">
                      <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/82 text-blue-600 shadow-[0_12px_26px_-22px_rgba(37,99,235,0.6)]">
                        <Icon className="h-5 w-5" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </section>

      <div ref={quickStartView.ref} className={`scroll-fade-up${quickStartView.inView ? ' in-view' : ''}`}>
        <LandingQuickStartSection />
      </div>

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

function TechHeroVisual() {
  return (
    <div className="tech-hero-visual" aria-hidden="true">
      <div className="tech-grid-plane" />
      <div className="tech-platform">
        <div className="tech-platform-ring tech-platform-ring-outer" />
        <div className="tech-platform-ring tech-platform-ring-inner" />
        <div className="tech-cube">
          <span className="tech-cube-face tech-cube-front" />
          <span className="tech-cube-face tech-cube-back" />
          <span className="tech-cube-face tech-cube-right" />
          <span className="tech-cube-face tech-cube-left" />
          <span className="tech-cube-face tech-cube-top" />
          <span className="tech-cube-face tech-cube-bottom" />
        </div>
      </div>
      <div className="tech-node tech-node-cloud">
        <Cloud className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <div className="tech-node tech-node-shield">
        <ShieldCheck className="h-8 w-8" strokeWidth={1.8} />
      </div>
      <div className="tech-node tech-node-data">
        <Database className="h-7 w-7" strokeWidth={1.8} />
      </div>
      <div className="tech-node tech-node-package">
        <PackageOpen className="h-7 w-7" strokeWidth={1.8} />
      </div>
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
      className={`relative z-10 w-full px-4 py-14 md:px-8 md:py-16 scroll-fade-up${inView ? ' in-view' : ''}`}
      style={{ background: sort === 'downloads' ? 'rgba(255,255,255,0.62)' : 'rgba(239,247,255,0.58)' }}
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
