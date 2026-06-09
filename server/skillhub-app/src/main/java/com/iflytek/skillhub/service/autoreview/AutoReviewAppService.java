package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.config.AutoReviewProperties;
import com.iflytek.skillhub.domain.event.SecurityScanCompletedEvent;
import com.iflytek.skillhub.domain.review.ReviewService;
import com.iflytek.skillhub.domain.review.ReviewTask;
import com.iflytek.skillhub.domain.review.ReviewTaskRepository;
import com.iflytek.skillhub.domain.review.ReviewTaskStatus;
import com.iflytek.skillhub.domain.skill.SkillVersion;
import com.iflytek.skillhub.domain.skill.SkillVersionRepository;
import com.iflytek.skillhub.domain.skill.SkillVersionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;

@Service
public class AutoReviewAppService {

    private static final Logger log = LoggerFactory.getLogger(AutoReviewAppService.class);
    // Reuse the existing review permission path instead of bypassing governance rules.
    private static final Set<String> SYSTEM_REVIEW_ROLES = Set.of("SUPER_ADMIN");

    private final AutoReviewProperties properties;
    private final SkillVersionRepository skillVersionRepository;
    private final ReviewTaskRepository reviewTaskRepository;
    private final ReviewService reviewService;
    private final StoredSkillPackageReader packageReader;
    private final SkillJudgeEvaluator evaluator;

    public AutoReviewAppService(AutoReviewProperties properties,
                                SkillVersionRepository skillVersionRepository,
                                ReviewTaskRepository reviewTaskRepository,
                                ReviewService reviewService,
                                StoredSkillPackageReader packageReader,
                                SkillJudgeEvaluator evaluator) {
        this.properties = properties;
        this.skillVersionRepository = skillVersionRepository;
        this.reviewTaskRepository = reviewTaskRepository;
        this.reviewService = reviewService;
        this.packageReader = packageReader;
        this.evaluator = evaluator;
    }

    @Transactional
    public void reviewAfterSecurityScan(SecurityScanCompletedEvent event) {
        if (!properties.isEnabled() || !event.safe()) {
            return;
        }
        reviewPendingVersion(event.versionId());
    }

    @Transactional
    public void reviewPendingVersion(Long versionId) {
        if (!properties.isEnabled()) {
            return;
        }

        SkillVersion version = skillVersionRepository.findById(versionId).orElse(null);
        if (version == null || version.getStatus() != SkillVersionStatus.PENDING_REVIEW) {
            return;
        }

        ReviewTask task = reviewTaskRepository
                .findBySkillVersionIdAndStatus(versionId, ReviewTaskStatus.PENDING)
                .orElse(null);
        if (task == null) {
            return;
        }

        SkillJudgeEvaluationResult result;
        try {
            SkillPackageSnapshot snapshot = packageReader.read(version.getSkillId(), versionId);
            result = evaluator.evaluate(snapshot);
        } catch (RuntimeException ex) {
            // Keep manual review as the safe fallback whenever storage or evaluation is unavailable.
            log.warn("Auto review skipped for versionId={} because Skill Judge evaluation failed",
                    versionId, ex);
            return;
        }

        String comment = buildReviewComment(result);
        if (result.score() >= properties.getPassScore()) {
            reviewService.approveReview(
                    task.getId(),
                    properties.getReviewerId(),
                    comment,
                    Map.of(),
                    SYSTEM_REVIEW_ROLES
            );
            return;
        }

        reviewService.rejectReview(
                task.getId(),
                properties.getReviewerId(),
                comment,
                Map.of(),
                SYSTEM_REVIEW_ROLES
        );
    }

    private String buildReviewComment(SkillJudgeEvaluationResult result) {
        String action = result.score() >= properties.getPassScore()
                ? "auto-approved"
                : "auto-rejected";
        return "Skill Judge " + action + ": "
                + result.score() + "/" + result.maxScore()
                + " (" + result.grade() + "). "
                + result.summary();
    }
}
