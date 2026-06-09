package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.domain.event.SecurityScanCompletedEvent;
import com.iflytek.skillhub.domain.event.ReviewSubmittedEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AutoReviewEventListener {

    private final AutoReviewAppService autoReviewAppService;

    public AutoReviewEventListener(AutoReviewAppService autoReviewAppService) {
        this.autoReviewAppService = autoReviewAppService;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onSecurityScanCompleted(SecurityScanCompletedEvent event) {
        // With scanner enabled, this is the normal entry point: review only after SAFE.
        autoReviewAppService.reviewAfterSecurityScan(event);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onReviewSubmitted(ReviewSubmittedEvent event) {
        // With scanner disabled, public versions enter PENDING_REVIEW immediately.
        // If scanner is enabled, the service will no-op while the version is SCANNING.
        autoReviewAppService.reviewPendingVersion(event.versionId());
    }
}
