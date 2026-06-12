import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

/**
 * Private deployments issue local accounts through administrators.
 */
export function RegisterPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
      <Card className="w-full border-slate-200 bg-white/95 shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <CardTitle>{t('register.disabledTitle')}</CardTitle>
          <CardDescription>{t('register.disabledDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            to="/login"
            search={{ returnTo: '' }}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_-22px_rgba(37,99,235,0.78)] transition-all duration-200 hover:bg-blue-700"
          >
            {t('register.login')}
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
