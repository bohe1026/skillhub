import { Suspense, useEffect, useState } from 'react'
import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/use-auth'
import { LanguageSwitcher } from '@/shared/components/language-switcher'
import { UserMenu } from '@/shared/components/user-menu'
import { NotificationBell } from '@/features/notification/notification-bell'
import { Menu, X } from 'lucide-react'
import { getAppHeaderClassName } from './layout-header-style'
import { getAppMainContentLayout, resolveAppMainContentPathname } from './layout-main-content'

/**
 * Application shell shared by all routed pages.
 *
 * It owns the global header, footer, language switcher, auth-aware navigation, and suspense
 * fallback used while lazy route modules are loading.
 */
export function Layout() {
  const { t } = useTranslation()
  const { pathname, resolvedPathname } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      resolvedPathname: s.resolvedLocation?.pathname,
    }),
  })
  const { user, isLoading } = useAuth()
  const [isHeaderElevated, setIsHeaderElevated] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const contentLayoutPathname = resolveAppMainContentPathname(pathname, resolvedPathname)
  const mainContentLayout = getAppMainContentLayout(contentLayoutPathname)

  useEffect(() => {
    const updateHeaderElevation = () => {
      setIsHeaderElevated(window.scrollY > 0)
    }

    updateHeaderElevation()
    window.addEventListener('scroll', updateHeaderElevation, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateHeaderElevation)
    }
  }, [])

  const navItems: Array<{
    label: string
    to: string
    params?: { resourceId: string }
    activePath?: string
    exact?: boolean
    auth?: boolean
  }> = [
    { label: t('nav.landing'), to: '/', exact: true },
    { label: '产品介绍', to: '/resources/$resourceId', params: { resourceId: 'baidu-cloud-products' }, activePath: '/resources/baidu-cloud-products' },
    { label: '方案中心', to: '/resources/$resourceId', params: { resourceId: 'tech-solutions' }, activePath: '/resources/tech-solutions' },
    { label: '行业场景', to: '/resources/$resourceId', params: { resourceId: 'industry-scenes' }, activePath: '/resources/industry-scenes' },
    { label: t('nav.publish'), to: '/dashboard/publish', auth: true },
    { label: t('nav.dashboard'), to: '/dashboard', auth: true },
    { label: t('nav.mySkills'), to: '/dashboard/skills', auth: true },
    { label: 'Skill中心', to: '/search' },
  ]

  const isActive = (to: string, exact?: boolean, activePath?: string) => {
    if (activePath) return pathname === activePath
    if (exact) return pathname === to
    // Keep matching strict so parent dashboard paths do not highlight unrelated child links.
    return pathname === to
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip bg-[#f4f4f4]">
      {/* Header */}
      <header className={getAppHeaderClassName(isHeaderElevated)}>
        <Link to="/" className="flex h-12 min-w-0 items-center gap-2 text-lg font-semibold text-white">
          <span className="relative flex h-12 w-12 items-center justify-center bg-[#0f62fe] text-white">
            <span className="h-4 w-4 rotate-45 border-2 border-white" />
          </span>
          <span className="truncate">SkillCenter</span>
        </Link>

        <nav className="hidden h-12 items-stretch text-sm md:flex">
          {navItems.map((item) => {
            if (item.auth && !user) return null
            const active = isActive(item.to, item.exact, item.activePath)

            return (
              <Link
                key={item.activePath ?? item.to}
                to={item.to}
                params={item.params}
                className={
                  active
                    ? 'relative flex items-center bg-[#262626] px-4 text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[#0f62fe]'
                    : 'flex items-center px-4 text-[#c6c6c6] transition-colors duration-150 hover:bg-[#262626] hover:text-white'
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex h-12 items-center gap-0 text-sm">
          <button
            type="button"
            aria-label={isMobileNavOpen ? '关闭导航' : '打开导航'}
            aria-expanded={isMobileNavOpen}
            className="inline-flex h-12 w-10 items-center justify-center text-[#c6c6c6] hover:bg-[#262626] hover:text-white md:hidden"
            onClick={() => setIsMobileNavOpen((open) => !open)}
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <LanguageSwitcher className="w-10 gap-0 px-0 text-[#c6c6c6] hover:bg-[#262626] hover:text-white [&_span]:hidden [&_svg:last-child]:hidden sm:w-auto sm:gap-2 sm:px-3 sm:[&_span]:inline sm:[&_svg:last-child]:block" />
          {user && <NotificationBell />}
          {isLoading ? null : user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              to="/login"
              search={{ returnTo: '' }}
              className="inline-flex h-12 items-center bg-[#0f62fe] px-3 text-sm font-medium text-white transition hover:bg-[#0353e9] sm:px-5"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>

        {isMobileNavOpen ? (
          <nav className="absolute left-0 right-0 top-12 grid border-b border-[#525252] bg-[#161616] md:hidden">
            {navItems.map((item) => {
              if (item.auth && !user) return null
              const active = isActive(item.to, item.exact, item.activePath)

              return (
                <Link
                  key={`mobile-${item.activePath ?? item.to}`}
                  to={item.to}
                  params={item.params}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={
                    active
                      ? 'border-l-4 border-[#0f62fe] bg-[#262626] px-4 py-3 text-sm text-white'
                      : 'border-l-4 border-transparent px-4 py-3 text-sm text-[#c6c6c6] hover:bg-[#262626] hover:text-white'
                  }
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        ) : null}
      </header>

      {/* Main content */}
      <main className={mainContentLayout.mainClassName}>
        <Suspense
          fallback={
            <div className="space-y-4 animate-fade-up">
              <div className="h-10 w-48 animate-shimmer rounded-lg" />
              <div className="h-5 w-72 animate-shimmer rounded-md" />
              <div className="h-64 animate-shimmer rounded-xl" />
            </div>
          }
        >
          <div className={mainContentLayout.contentClassName}>
            <Outlet />
          </div>
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-auto border-t border-[#393939] bg-[#161616] text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-12">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-10 w-10 items-center justify-center bg-[#0f62fe] text-sm font-semibold text-white">
                  S
                </div>
                <span className="text-lg font-semibold text-white">SkillCenter</span>
              </div>
              <p className="max-w-xs text-sm text-[#c6c6c6]">
                {t('layout.footerDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-12 md:gap-16">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-white">
                  {t('nav.home')}
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/" className="text-[#c6c6c6] transition-colors hover:text-white">
                      {t('nav.home')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/search"
                      search={{ q: '', sort: 'relevance', page: 0, starredOnly: false }}
                      className="text-[#c6c6c6] transition-colors hover:text-white"
                    >
                      {t('nav.search')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="text-[#c6c6c6] transition-colors hover:text-white">
                      {t('nav.dashboard')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-white">
                  {t('footer.resources')}
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-[#c6c6c6] transition-colors hover:text-white">
                      {t('footer.docs')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#c6c6c6] transition-colors hover:text-white">
                      {t('footer.api')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-[#c6c6c6] transition-colors hover:text-white">
                      {t('footer.community')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            className="mt-10 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
            style={{ borderColor: '#393939', color: '#8d8d8d' }}
          >
            <div className="flex items-center gap-2">
              <Link to="/privacy" className="hover:opacity-80 transition-opacity">
                {t('footer.privacy')}
              </Link>
              <span>|</span>
              <Link to="/terms" className="hover:opacity-80 transition-opacity">
                {t('footer.terms')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
