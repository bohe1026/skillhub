import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { useLocalRegister } from '@/features/auth/use-local-auth'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'

type RegisterErrors = {
  username?: string
  email?: string
  password?: string
  inviteCode?: string
}

/**
 * Invite-code registration keeps private deployments self-service without
 * exposing open public sign-up.
 */
export function RegisterPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const registerMutation = useLocalRegister()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<RegisterErrors>({})

  function validateForm(): RegisterErrors {
    const nextErrors: RegisterErrors = {}
    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()
    const trimmedInviteCode = inviteCode.trim()

    if (!trimmedUsername) {
      nextErrors.username = t('register.usernameRequired')
    } else if (!/^[A-Za-z0-9_]{3,64}$/.test(trimmedUsername)) {
      nextErrors.username = t('register.usernameInvalid')
    }
    if (!trimmedEmail) {
      nextErrors.email = t('register.emailRequired')
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(trimmedEmail)) {
      nextErrors.email = t('register.emailInvalid')
    }
    if (!password) {
      nextErrors.password = t('register.passwordRequired')
    } else if (password.length < 8) {
      nextErrors.password = t('register.passwordTooShort')
    }
    if (!trimmedInviteCode) {
      nextErrors.inviteCode = t('register.inviteCodeRequired')
    }

    return nextErrors
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    try {
      await registerMutation.mutateAsync({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        inviteCode: inviteCode.trim(),
      })
      await navigate({ to: '/dashboard' })
    } catch {
      // mutation state drives the error UI
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center py-8">
      <Card className="w-full border-blue-100 bg-white/95 shadow-[0_24px_80px_-48px_rgba(37,99,235,0.68)]">
        <CardHeader className="space-y-3 text-center">
          <CardTitle>{t('register.title')}</CardTitle>
          <CardDescription>{t('register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="register-username">{t('register.username')}</label>
              <Input
                id="register-username"
                autoComplete="username"
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value)
                  setFieldErrors((current) => ({ ...current, username: undefined }))
                }}
                placeholder={t('register.usernamePlaceholder')}
                aria-invalid={fieldErrors.username ? 'true' : 'false'}
              />
              {fieldErrors.username ? <p className="text-sm text-red-600">{fieldErrors.username}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="register-email">{t('register.email')}</label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  setFieldErrors((current) => ({ ...current, email: undefined }))
                }}
                placeholder={t('register.emailPlaceholder')}
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
              />
              {fieldErrors.email ? <p className="text-sm text-red-600">{fieldErrors.email}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="register-password">{t('register.password')}</label>
              <div className="relative">
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFieldErrors((current) => ({ ...current, password: undefined }))
                  }}
                  placeholder={t('register.passwordPlaceholder')}
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
              {fieldErrors.password ? <p className="text-sm text-red-600">{fieldErrors.password}</p> : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="register-invite-code">{t('register.inviteCode')}</label>
              <Input
                id="register-invite-code"
                autoComplete="off"
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(event.target.value)
                  setFieldErrors((current) => ({ ...current, inviteCode: undefined }))
                }}
                placeholder={t('register.inviteCodePlaceholder')}
                aria-invalid={fieldErrors.inviteCode ? 'true' : 'false'}
              />
              <p className="text-xs text-muted-foreground">{t('register.inviteCodeHint')}</p>
              {fieldErrors.inviteCode ? <p className="text-sm text-red-600">{fieldErrors.inviteCode}</p> : null}
            </div>
            {registerMutation.error ? (
              <p className="text-sm text-red-600">{registerMutation.error.message}</p>
            ) : null}
            <Button className="w-full" disabled={registerMutation.isPending} type="submit">
              {registerMutation.isPending ? t('register.submitting') : t('register.submit')}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {t('register.hasAccount')}{' '}
            <Link to="/login" search={{ returnTo: '' }} className="font-medium text-primary hover:underline">
              {t('register.login')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
