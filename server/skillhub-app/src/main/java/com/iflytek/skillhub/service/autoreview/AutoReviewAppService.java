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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    public boolean reviewPendingVersion(Long versionId) {
        if (!properties.isEnabled()) {
            return false;
        }

        SkillVersion version = skillVersionRepository.findById(versionId).orElse(null);
        if (version == null || version.getStatus() != SkillVersionStatus.PENDING_REVIEW) {
            return false;
        }

        ReviewTask task = reviewTaskRepository
                .findBySkillVersionIdAndStatus(versionId, ReviewTaskStatus.PENDING)
                .orElse(null);
        if (task == null) {
            return false;
        }

        SkillJudgeEvaluationResult result;
        try {
            SkillPackageSnapshot snapshot = packageReader.read(version.getSkillId(), versionId);
            result = evaluator.evaluate(snapshot);
        } catch (RuntimeException ex) {
            // Keep manual review as the safe fallback whenever storage or evaluation is unavailable.
            log.warn("Auto review skipped for versionId={} because Skill Judge evaluation failed",
                    versionId, ex);
            return false;
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
            return true;
        }

        reviewService.rejectReview(
                task.getId(),
                properties.getReviewerId(),
                comment,
                Map.of(),
                SYSTEM_REVIEW_ROLES
        );
        return true;
    }

    public int reviewPendingVersions(int limit) {
        if (!properties.isEnabled() || limit <= 0) {
            return 0;
        }

        Page<ReviewTask> tasks = reviewTaskRepository.findByStatus(
                ReviewTaskStatus.PENDING,
                PageRequest.of(0, limit)
        );
        int reviewed = 0;
        for (ReviewTask task : tasks.getContent()) {
            SkillVersion version = skillVersionRepository.findById(task.getSkillVersionId()).orElse(null);
            if (version == null || version.getStatus() != SkillVersionStatus.PENDING_REVIEW) {
                continue;
            }
            try {
                if (reviewPendingVersion(task.getSkillVersionId())) {
                    reviewed++;
                }
            } catch (RuntimeException ex) {
                log.warn("Auto review compensation skipped reviewTaskId={} versionId={}",
                        task.getId(), task.getSkillVersionId(), ex);
            }
        }
        return reviewed;
    }

    private String buildReviewComment(SkillJudgeEvaluationResult result) {
        boolean passed = result.score() >= properties.getPassScore();
        String decision = passed ? "自动通过" : "自动拒绝";
        String reason = decisionReason(result, passed);

        StringBuilder report = new StringBuilder();
        report.append("# Skill Judge 自动审核报告\n\n");
        report.append("结论：").append(decision).append('\n');
        report.append("分数：")
                .append(result.score()).append('/').append(result.maxScore())
                .append("（等级 ").append(result.grade())
                .append("，通过线 ").append(properties.getPassScore()).append("）\n");
        report.append(passed ? "通过原因：" : "拒绝原因：")
                .append(reason)
                .append("\n\n");

        appendIssues(report, result);
        appendSuggestions(report, result);
        appendExamples(report, result);
        return report.toString().strip();
    }

    private String decisionReason(SkillJudgeEvaluationResult result, boolean passed) {
        if (passed && result.issues().isEmpty()) {
            return "分数达到通过线，自动规则未发现阻塞性问题，可进入发布流程。";
        }
        if (passed) {
            return "分数达到通过线，但仍存在可优化项；建议发布后按报告继续打磨。";
        }
        return "分数低于通过线，存在影响触发稳定性、专家判断或可执行性的关键问题，需要修改后重新提交。";
    }

    private void appendIssues(StringBuilder report, SkillJudgeEvaluationResult result) {
        report.append("## 逐项问题\n");
        if (result.issues().isEmpty()) {
            report.append("- 未发现阻塞性问题。\n\n");
            return;
        }
        for (int i = 0; i < result.issues().size(); i++) {
            SkillJudgeIssue issue = result.issues().get(i);
            report.append(i + 1)
                    .append(". 【").append(issue.dimension())
                    .append("｜").append(issue.severity())
                    .append("｜扣 ").append(issue.penalty()).append(" 分】")
                    .append(issue.problem())
                    .append('\n');
        }
        report.append('\n');
    }

    private void appendSuggestions(StringBuilder report, SkillJudgeEvaluationResult result) {
        report.append("## 具体修改建议\n");
        if (result.issues().isEmpty()) {
            report.append("- 保持当前结构，后续可继续补充真实案例、反例和边界条件。\n\n");
            return;
        }
        for (int i = 0; i < result.issues().size(); i++) {
            SkillJudgeIssue issue = result.issues().get(i);
            report.append(i + 1)
                    .append(". ")
                    .append(issue.suggestion())
                    .append('\n');
        }
        report.append('\n');
    }

    private void appendExamples(StringBuilder report, SkillJudgeEvaluationResult result) {
        report.append("## 示例改写\n");
        if (result.issues().isEmpty()) {
            report.append("- 可增加更具体的成功/失败样例，帮助审核者复现判断过程。\n");
            return;
        }
        for (int i = 0; i < result.issues().size(); i++) {
            SkillJudgeIssue issue = result.issues().get(i);
            report.append(i + 1)
                    .append(". 建议写法：\n\n")
                    .append("```markdown\n")
                    .append(issue.example())
                    .append("\n```\n");
        }
    }
}
