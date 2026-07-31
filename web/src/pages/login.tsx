import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Eye, EyeOff, KeyRound } from 'lucide-react'
import { getDirectAuthRuntimeConfig } from '@/api/client'
import { SessionBootstrapEntry } from '@/features/auth/session-bootstrap-entry'
import { useAuthMethods } from '@/features/auth/use-auth-methods'
import { usePasswordLogin } from '@/features/auth/use-password-login'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

/**
 * Authentication entry page.
 *
 * It combines password login and optional session-bootstrap support while preserving the route the
 * user originally intended to visit.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/login' })
  const loginMutation = usePasswordLogin()
  const directAuthConfig = getDirectAuthRuntimeConfig()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordPanelOpen, setPasswordPanelOpen] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string, password?: string }>({})
  const { data: authMethods } = useAuthMethods(search.returnTo)

  const returnTo = search.returnTo && search.returnTo.startsWith('/') ? search.returnTo : '/dashboard'
  const disabledMessage = search.reason === 'accountDisabled' ? t('apiError.auth.accountDisabled') : null
  const directMethod = directAuthConfig.provider
    ? authMethods?.find((method) =>
      method.methodType === 'DIRECT_PASSWORD' && method.provider === directAuthConfig.provider)
    : undefined
  const bootstrapMethod = authMethods?.find((method) => method.methodType === 'SESSION_BOOTSTRAP')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedUsername = username.trim()
    const nextFieldErrors: { username?: string, password?: string } = {}

    if (!trimmedUsername) {
      nextFieldErrors.username = t('login.usernameRequired')
    }
    if (!password) {
      nextFieldErrors.password = t('login.passwordRequired')
    }
    if (nextFieldErrors.username || nextFieldErrors.password) {
      setFieldErrors(nextFieldErrors)
      return
    }

    setFieldErrors({})
    try {
      await loginMutation.mutateAsync({ username: trimmedUsername, password })
      await navigate({ to: returnTo })
    } catch {
      // mutation state drives the error UI
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-8 animate-fade-up">
        <div className="space-y-3 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center bg-[#0f62fe]">
            <span className="text-2xl font-semibold text-white">S</span>
          </div>
          <h1 className="font-heading text-4xl font-light text-foreground">{t('login.title')}</h1>
        </div>

        <div className="border border-[#c6c6c6] bg-white p-8">
          <div className="space-y-6">
            {disabledMessage ? (
              <div className="border-l-4 border-[#da1e28] bg-[#fff1f1] px-4 py-3 text-sm text-[#a2191f]">
                {disabledMessage}
              </div>
            ) : null}
            <SessionBootstrapEntry
              methodDisplayName={bootstrapMethod?.displayName}
              onAuthenticated={() => navigate({ to: returnTo })}
            />

            <div className="border border-[#c6c6c6] bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                aria-expanded={passwordPanelOpen}
                aria-controls="password-login-panel"
                onClick={() => setPasswordPanelOpen((current) => !current)}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[#161616]">
                  <KeyRound className="h-4 w-4 text-[#0f62fe]" />
                  {t('login.passwordFallbackTitle')}
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-slate-500 transition-transform',
                    passwordPanelOpen && 'rotate-180'
                  )}
                />
              </button>

              {passwordPanelOpen ? (
                <form id="password-login-panel" className="space-y-4 border-t border-[#e0e0e0] px-4 py-4" onSubmit={handleSubmit}>
                  {directAuthConfig.enabled ? (
                    <p className="text-sm text-muted-foreground">
                      {t('login.passwordCompatHint', {
                        name: directMethod?.displayName ?? directAuthConfig.provider,
                      })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('login.passwordFallbackHint')}</p>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="username">{t('login.username')}</label>
                    <Input
                      id="username"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => {
                        setUsername(event.target.value)
                        if (fieldErrors.username) {
                          setFieldErrors((current) => ({ ...current, username: undefined }))
                        }
                      }}
                      placeholder={t('login.usernamePlaceholder')}
                      aria-invalid={fieldErrors.username ? 'true' : 'false'}
                    />
                    {fieldErrors.username ? (
                      <p className="text-sm text-red-600">{fieldErrors.username}</p>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="password">{t('login.password')}</label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          if (fieldErrors.password) {
                            setFieldErrors((current) => ({ ...current, password: undefined }))
                          }
                        }}
                        placeholder={t('login.passwordPlaceholder')}
                        className="pr-12"
                        aria-invalid={fieldErrors.password ? 'true' : 'false'}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p className="text-sm text-red-600">{fieldErrors.password}</p>
                    ) : null}
                  </div>
                  {loginMutation.error ? (
                    <p className="text-sm text-red-600">{loginMutation.error.message}</p>
                  ) : null}
                  <Button className="w-full" disabled={loginMutation.isPending} type="submit">
                    {loginMutation.isPending ? t('login.submitting') : t('login.submit')}
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
