import { Suspense, useEffect, useState } from 'react'
import { Outlet, Link, useRouterState } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/features/auth/use-auth'
import { LanguageSwitcher } from '@/shared/components/language-switcher'
import { UserMenu } from '@/shared/components/user-menu'
import { NotificationBell } from '@/features/notification/notification-bell'
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
    exact?: boolean
    auth?: boolean
  }> = [
    { label: t('nav.landing'), to: '/', exact: true },
    { label: t('nav.publish'), to: '/dashboard/publish', auth: true },
    { label: t('nav.search'), to: '/search' },
    { label: t('nav.dashboard'), to: '/dashboard', auth: true },
    { label: t('nav.mySkills'), to: '/dashboard/skills', auth: true },
  ]

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return pathname === to
    // Keep matching strict so parent dashboard paths do not highlight unrelated child links.
    return pathname === to
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-clip" style={{ background: 'var(--bg-page, hsl(var(--background)))' }}>
      {/* Header */}
      <header className={getAppHeaderClassName(isHeaderElevated)} style={{ borderColor: 'hsl(var(--border))' }}>
        <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-slate-950">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_14px_28px_-18px_rgba(37,99,235,0.8)]">
            <span className="h-4 w-4 rotate-45 rounded-[3px] border-2 border-white/90" />
          </span>
          <span>SkillCenter</span>
        </Link>

        <nav className="hidden md:flex items-center gap-9 text-[15px] font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
          {navItems.map((item) => {
            if (item.auth && !user) return null
            const active = isActive(item.to, item.exact)

            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  active
                    ? 'relative text-blue-700 after:absolute after:-bottom-5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-blue-600'
                    : 'text-slate-700 hover:text-blue-700 transition-colors duration-150'
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-4 text-[15px] font-semibold" style={{ color: 'hsl(var(--text-secondary))' }}>
          <LanguageSwitcher />
          {user && <NotificationBell />}
          {isLoading ? null : user ? (
            <UserMenu user={user} />
          ) : (
            <Link
              to="/login"
              search={{ returnTo: '' }}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-white shadow-[0_14px_28px_-18px_rgba(37,99,235,0.8)] transition hover:bg-blue-700"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
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
      <footer className="relative z-10 border-t rounded-t-lg mt-auto bg-white/70 backdrop-blur" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-12">
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm bg-blue-600">
                  S
                </div>
                <span className="text-lg font-bold text-slate-950">SkillCenter</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: 'hsl(var(--text-secondary))' }}>
                {t('layout.footerDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-12 md:gap-16">
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                  {t('nav.home')}
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link to="/" className="hover:opacity-80 transition-opacity" style={{ color: 'hsl(var(--text-secondary))' }}>
                      {t('nav.home')}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/search"
                      search={{ q: '', sort: 'relevance', page: 0, starredOnly: false }}
                      className="hover:opacity-80 transition-opacity"
                      style={{ color: 'hsl(var(--text-secondary))' }}
                    >
                      {t('nav.search')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard" className="hover:opacity-80 transition-opacity" style={{ color: 'hsl(var(--text-secondary))' }}>
                      {t('nav.dashboard')}
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'hsl(var(--foreground))' }}>
                  {t('footer.resources')}
                </h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: 'hsl(var(--text-secondary))' }}>
                      {t('footer.docs')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: 'hsl(var(--text-secondary))' }}>
                      {t('footer.api')}
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:opacity-80 transition-opacity" style={{ color: 'hsl(var(--text-secondary))' }}>
                      {t('footer.community')}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            className="mt-10 pt-6 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs"
            style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
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
