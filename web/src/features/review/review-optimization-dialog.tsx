import type { TFunction } from 'i18next'
import type { ReviewOptimizationResult } from '@/api/types'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

export function ReviewOptimizationDialog({
  open,
  onOpenChange,
  result,
  onViewReview,
  t,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  result: ReviewOptimizationResult | null
  onViewReview: () => void
  t: TFunction
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('review.optimizeDialogTitle')}</DialogTitle>
        </DialogHeader>
        {result && (
          <div data-testid="optimization-summary-dialog" className="space-y-5 text-sm">
            <div className="rounded-md bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">{t('review.optimizeDialogVersion')}</div>
              <div className="mt-1 font-mono font-semibold text-foreground">v{result.version}</div>
            </div>
            <OptimizationSummaryList
              title={t('review.optimizeDialogAdded')}
              items={result.optimizationSummary?.addedSections}
            />
            <OptimizationSummaryList
              title={t('review.optimizeDialogPreserved')}
              items={result.optimizationSummary?.preservedItems}
            />
            {result.optimizationSummary?.reportSummary && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('review.optimizeDialogBasis')}</h3>
                <p className="rounded-md bg-muted/20 p-3 text-muted-foreground">
                  {result.optimizationSummary.reportSummary}
                </p>
              </div>
            )}
            {result.optimizationSummary?.reportMappings?.length ? (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{t('review.optimizeDialogMappings')}</h3>
                <div className="space-y-3">
                  {result.optimizationSummary.reportMappings.map((mapping, index) => (
                    <div key={`${mapping.problem}-${index}`} className="rounded-md border border-border/70 p-3">
                      {mapping.problem && (
                        <p>
                          <span className="font-medium text-foreground">{t('review.optimizeDialogProblem')}</span>
                          <span className="text-muted-foreground">{mapping.problem}</span>
                        </p>
                      )}
                      {mapping.suggestion && (
                        <p>
                          <span className="font-medium text-foreground">{t('review.optimizeDialogSuggestion')}</span>
                          <span className="text-muted-foreground">{mapping.suggestion}</span>
                        </p>
                      )}
                      {mapping.matchedSections?.length ? (
                        <p>
                          <span className="font-medium text-foreground">{t('review.optimizeDialogMatched')}</span>
                          <span className="text-muted-foreground">{mapping.matchedSections.join('、')}</span>
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('dialog.close')}
          </Button>
          {result?.reviewTaskId && (
            <Button onClick={onViewReview}>
              {t('review.optimizeDialogViewReview')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function OptimizationSummaryList({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) {
    return null
  }
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="space-y-1 rounded-md bg-muted/20 p-3 text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
