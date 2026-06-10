package com.iflytek.skillhub.task;

import com.iflytek.skillhub.service.autoreview.AutoReviewAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Backfills public Skill versions that reached PENDING_REVIEW but missed the
 * security-scan completion event, for example during a rolling restart.
 */
@Component
@ConditionalOnProperty(prefix = "skillhub.auto-review", name = "enabled", havingValue = "true")
public class AutoReviewCompensationTask {

    private static final Logger logger = LoggerFactory.getLogger(AutoReviewCompensationTask.class);
    private static final int BATCH_SIZE = 50;

    private final AutoReviewAppService autoReviewAppService;

    public AutoReviewCompensationTask(AutoReviewAppService autoReviewAppService) {
        this.autoReviewAppService = autoReviewAppService;
    }

    @Scheduled(
            initialDelayString = "${skillhub.auto-review.compensation-initial-delay-ms:15000}",
            fixedDelayString = "${skillhub.auto-review.compensation-delay-ms:60000}"
    )
    public void backfillPendingReviews() {
        int reviewed = autoReviewAppService.reviewPendingVersions(BATCH_SIZE);
        if (reviewed > 0) {
            logger.info("Auto review compensation processed {} pending review tasks", reviewed);
        }
    }
}
