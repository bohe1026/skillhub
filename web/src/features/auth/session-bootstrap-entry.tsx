import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck } from 'lucide-react'
import { ApiError, getSessionBootstrapRuntimeConfig } from '@/api/client'
import { Button } from '@/shared/ui/button'
import { useSessionBootstrap } from './use-session-bootstrap'

interface SessionBootstrapEntryProps {
  onAuthenticated: () => Promise<void>
  methodDisplayName?: string
}

/**
 * Optional login entry that attempts to bootstrap a browser session from an upstream enterprise
 * identity before showing manual login choices.
 */
export function SessionBootstrapEntry({ onAuthenticated, methodDisplayName }: SessionBootstrapEntryProps) {
  const { t } = useTranslation()
  const config = getSessionBootstrapRuntimeConfig()
  const bootstrapMutation = useSessionBootstrap()
  const attemptedRef = useRef(false)
  const [manualAttempted, setManualAttempted] = useState(false)
  const providerName = methodDisplayName || t('login.enterpriseSsoTitle')

  useEffect(() => {
    // Auto-bootstrap should only be attempted once per page load; if it fails the page must remain
    // usable for normal login options.
    if (!config.enabled || !config.provider || !config.auto || attemptedRef.current) {
      return
    }
    attemptedRef.current = true
    void bootstrapMutation.mutateAsync(config.provider, {
      onSuccess: async () => {
        await onAuthenticated()
      },
      onError: () => {
        // Fallback to normal login options without surfacing a global auth error.
      },
    })
  }, [bootstrapMutation, config.auto, config.enabled, config.provider, onAuthenticated])

  if (!config.enabled || !config.provider) {
    return null
  }

  const manualError = manualAttempted && bootstrapMutation.error instanceof ApiError
    ? bootstrapMutation.error.status === 401 || bootstrapMutation.error.status === 403
      ? t('login.enterpriseSsoUnavailable')
      : bootstrapMutation.error.message
    : null

  return (
    <div className="space-y-3">
      <Button
        className="h-12 w-full gap-2"
        type="button"
        disabled={bootstrapMutation.isPending}
        onClick={() => {
          setManualAttempted(true)
          void bootstrapMutation.mutateAsync(config.provider!, {
            onSuccess: async () => {
              await onAuthenticated()
            },
            onError: () => {
              // Keep the page usable for other login methods.
            },
          })
        }}
      >
        <ShieldCheck className="h-4 w-4" />
        {bootstrapMutation.isPending
          ? t('login.enterpriseSsoSubmitting', { name: providerName })
          : t('login.enterpriseSsoAction', { name: providerName })}
      </Button>
      <div className="space-y-1 border-l-4 border-[#0f62fe] bg-[#edf5ff] p-3">
        <p className="text-sm text-muted-foreground">
          {config.auto
            ? t('login.enterpriseSsoAutoHint', { name: providerName })
            : t('login.enterpriseSsoHint', { name: providerName })}
        </p>
      </div>

      {manualError ? (
        <p className="text-sm text-red-600">{manualError}</p>
      ) : null}
    </div>
  )
}
