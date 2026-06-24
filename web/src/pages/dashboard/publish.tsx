import { useEffect, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { BarChart3, Briefcase, Check, Code2, FileText, Image, ShieldCheck } from 'lucide-react'
import { UploadZone } from '@/features/publish/upload-zone'
import {
  extractPrecheckWarnings,
  isFrontmatterFailureMessage,
  isPrecheckConfirmationMessage,
  isPrecheckFailureMessage,
  isVersionExistsMessage,
} from '@/features/publish/publish-error-utils'
import { normalizePublishPrefill } from '@/features/publish/publish-prefill'
import { Button } from '@/shared/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  normalizeSelectValue,
} from '@/shared/ui/select'
import { Label } from '@/shared/ui/label'
import { Card } from '@/shared/ui/card'
import { usePublishSkill } from '@/shared/hooks/use-skill-queries'
import { useMyNamespaces } from '@/shared/hooks/use-namespace-queries'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { DashboardPageHeader } from '@/shared/components/dashboard-page-header'
import { toast } from '@/shared/lib/toast'
import { ApiError, labelApi } from '@/api/client'
import { cn } from '@/shared/lib/utils'
import {
  getPublishCategoryLabelSlugs,
  SKILL_DISCOVERY_GROUPS,
} from '@/shared/lib/skill-discovery-taxonomy'

const EMPTY_NAMESPACE_VALUE = '__select_namespace__'

const CATEGORY_ICONS = {
  content: Image,
  document: FileText,
  data: BarChart3,
  development: Code2,
  office: Briefcase,
  opsSecurity: ShieldCheck,
}

export function PublishPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const search = useSearch({ from: '/dashboard/publish' })
  const prefill = normalizePublishPrefill(search)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [namespaceSlug, setNamespaceSlug] = useState<string>(prefill.namespace)
  const [visibility, setVisibility] = useState<string>(prefill.visibility)
  const [warningDialogOpen, setWarningDialogOpen] = useState(false)
  const [precheckWarnings, setPrecheckWarnings] = useState<string[]>([])
  const [categorySlug, setCategorySlug] = useState('')
  const [scenarioSlugs, setScenarioSlugs] = useState<string[]>([])

  const { data: namespaces, isLoading: isLoadingNamespaces } = useMyNamespaces()
  const publishMutation = usePublishSkill()
  const selectedNamespace = namespaces?.find((ns) => ns.slug === namespaceSlug)
  const namespaceOnlyLabel = selectedNamespace?.type === 'GLOBAL'
    ? t('publish.visibilityOptions.loggedInUsersOnly')
    : t('publish.visibilityOptions.namespaceOnly')
  const selectedCategory = SKILL_DISCOVERY_GROUPS.find((group) => group.slug === categorySlug)

  useEffect(() => {
    setNamespaceSlug(prefill.namespace)
    setVisibility(prefill.visibility)
  }, [prefill.namespace, prefill.visibility])

  const handleRemoveSelectedFile = () => {
    setSelectedFile(null)
    setPrecheckWarnings([])
    setWarningDialogOpen(false)
  }

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setPrecheckWarnings([])
    setWarningDialogOpen(false)
  }

  const publishSkill = async (confirmWarnings = false) => {
    if (!selectedFile || !namespaceSlug) {
      toast.error(t('publish.selectRequired'))
      return
    }
    if (!categorySlug) {
      toast.error(t('publish.categoryRequiredTitle'), t('publish.categoryRequiredDescription'))
      return
    }

    try {
      const result = await publishMutation.mutateAsync({
        namespace: namespaceSlug,
        file: selectedFile,
        visibility,
        confirmWarnings,
      })
      let classificationSaved = true
      const labelSlugs = getPublishCategoryLabelSlugs(categorySlug, scenarioSlugs)
      try {
        await Promise.all(labelSlugs.map((labelSlug) =>
          labelApi.attachSkillLabel(result.namespace, result.slug, labelSlug)
        ))
      } catch {
        classificationSaved = false
      }
      setPrecheckWarnings([])
      setWarningDialogOpen(false)
      const skillLabel = `${result.namespace}/${result.slug}@${result.version}`
      if (result.status === 'PUBLISHED') {
        toast.success(
          t('publish.publishedTitle'),
          t('publish.publishedDescription', { skill: skillLabel })
        )
      } else {
        toast.success(
          t('publish.pendingReviewTitle'),
          t('publish.pendingReviewDescription', { skill: skillLabel })
        )
      }
      if (!classificationSaved) {
        toast.warning(t('publish.categorySaveWarningTitle'), t('publish.categorySaveWarningDescription'))
      }
      navigate({ to: '/dashboard/skills' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 408) {
        toast.error(t('publish.timeoutTitle'), t('publish.timeoutDescription'))
        return
      }

      if (error instanceof ApiError && isVersionExistsMessage(error.serverMessage || error.message)) {
        toast.error(
          t('publish.versionExistsTitle'),
          t('publish.versionExistsDescription'),
        )
        return
      }

      if (error instanceof ApiError && isPrecheckConfirmationMessage(error.serverMessage || error.message)) {
        setPrecheckWarnings(extractPrecheckWarnings(error.serverMessage || error.message))
        setWarningDialogOpen(true)
        return
      }

      if (error instanceof ApiError && isPrecheckFailureMessage(error.serverMessage || error.message)) {
        toast.error(
          t('publish.precheckFailedTitle'),
          error.serverMessage || t('publish.precheckFailedDescription'),
        )
        return
      }

      if (error instanceof ApiError && isFrontmatterFailureMessage(error.serverMessage || error.message)) {
        toast.error(
          t('publish.frontmatterFailedTitle'),
          error.serverMessage || t('publish.frontmatterFailedDescription'),
        )
        return
      }

      toast.error(t('publish.error'), error instanceof Error ? error.message : '')
    }
  }

  const handlePublish = async () => {
    await publishSkill(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-up">
      <DashboardPageHeader title={t('publish.title')} subtitle={t('publish.subtitle')} />

      <Card className="p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground mb-1">{t('publish.reviewNotice.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('publish.reviewNotice.description')}</p>
          </div>
        </div>
      </Card>

      <Card className="p-8 space-y-8">
        <div className="space-y-3">
          <Label htmlFor="namespace" className="text-sm font-semibold font-heading">{t('publish.namespace')}</Label>
          {isLoadingNamespaces ? (
            <div className="h-11 animate-shimmer rounded-lg" />
          ) : (
            <Select
              value={normalizeSelectValue(namespaceSlug) ?? EMPTY_NAMESPACE_VALUE}
              onValueChange={(value) => {
                setNamespaceSlug(value === EMPTY_NAMESPACE_VALUE ? '' : value)
              }}
            >
              <SelectTrigger id="namespace">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_NAMESPACE_VALUE}>{t('publish.selectNamespace')}</SelectItem>
                {namespaces?.map((ns) => (
                  <SelectItem key={ns.id} value={ns.slug}>
                    {ns.displayName} (@{ns.slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="visibility" className="text-sm font-semibold font-heading">{t('publish.visibility')}</Label>
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLIC">{t('publish.visibilityOptions.public')}</SelectItem>
              <SelectItem value="NAMESPACE_ONLY">{namespaceOnlyLabel}</SelectItem>
              <SelectItem value="PRIVATE">{t('publish.visibilityOptions.private')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <section className="space-y-4 rounded-lg border border-blue-100 bg-[linear-gradient(135deg,rgba(239,247,255,0.95)_0%,rgba(255,255,255,0.96)_58%,rgba(232,245,255,0.92)_100%)] p-5">
          <div>
            <Label className="text-sm font-semibold font-heading">{t('publish.category.title')}</Label>
            <p className="mt-1 text-sm leading-6 text-slate-600">{t('publish.category.description')}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {SKILL_DISCOVERY_GROUPS.map((group) => {
              const Icon = CATEGORY_ICONS[group.iconKey]
              const selected = categorySlug === group.slug

              return (
                <button
                  key={group.slug}
                  type="button"
                  className={cn(
                    'flex min-h-[76px] items-center gap-3 rounded-lg border bg-white/85 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_42px_-32px_rgba(37,99,235,0.52)]',
                    selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-white/90'
                  )}
                  aria-pressed={selected}
                  onClick={() => {
                    setCategorySlug(group.slug)
                    setScenarioSlugs([])
                  }}
                >
                  <span className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg', group.accentClassName)}>
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-black text-slate-950">
                      {t(group.labelKey, { defaultValue: group.fallbackLabel })}
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">{t('publish.category.groupHint')}</span>
                  </span>
                  {selected ? <Check className="h-4 w-4 flex-shrink-0 text-blue-600" strokeWidth={2.2} /> : null}
                </button>
              )
            })}
          </div>

          {selectedCategory ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-700">{t('publish.category.scenarioTitle')}</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={scenarioSlugs.length === 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScenarioSlugs([])}
                >
                  {t('publish.category.noScenario')}
                </Button>
                {selectedCategory.scenarios.map((scenario) => {
                  const selected = scenarioSlugs.includes(scenario.slug)

                  return (
                    <Button
                      key={scenario.slug}
                      type="button"
                      variant={selected ? 'default' : 'outline'}
                      size="sm"
                      aria-pressed={selected}
                      onClick={() => {
                        setScenarioSlugs((current) =>
                          current.includes(scenario.slug)
                            ? current.filter((slug) => slug !== scenario.slug)
                            : [...current, scenario.slug]
                        )
                      }}
                    >
                      {t(scenario.labelKey, { defaultValue: scenario.fallbackLabel })}
                    </Button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </section>

        <div className="space-y-3">
          <Label className="text-sm font-semibold font-heading">{t('publish.file')}</Label>
          <UploadZone
            key={selectedFile ? `${selectedFile.name}-${selectedFile.lastModified}` : 'empty'}
            onFileSelect={handleFileSelect}
            disabled={publishMutation.isPending}
          />
          {selectedFile && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-secondary/30 px-4 py-3">
              <div className="min-w-0 text-sm text-muted-foreground flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveSelectedFile}
                disabled={publishMutation.isPending}
              >
                {t('publish.removeSelectedFile')}
              </Button>
            </div>
          )}
        </div>

        <Button
          className="w-full text-primary-foreground disabled:text-primary-foreground"
          size="lg"
          onClick={handlePublish}
          disabled={!selectedFile || !namespaceSlug || !categorySlug || publishMutation.isPending}
        >
          {publishMutation.isPending ? t('publish.publishing') : t('publish.confirm')}
        </Button>
      </Card>

      <ConfirmDialog
        open={warningDialogOpen}
        onOpenChange={setWarningDialogOpen}
        title={t('publish.warningConfirmTitle')}
        description={(
          <div className="space-y-3 text-left">
            <p>{t('publish.warningConfirmDescription')}</p>
            {precheckWarnings.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {precheckWarnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        confirmText={t('publish.warningConfirmContinue')}
        cancelText={t('publish.warningConfirmCancel')}
        onConfirm={() => publishSkill(true)}
      />
    </div>
  )
}
