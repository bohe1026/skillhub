package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.config.AutoReviewProperties;
import com.iflytek.skillhub.domain.event.SecurityScanCompletedEvent;
import com.iflytek.skillhub.domain.review.ReviewService;
import com.iflytek.skillhub.domain.review.ReviewTask;
import com.iflytek.skillhub.domain.review.ReviewTaskRepository;
import com.iflytek.skillhub.domain.review.ReviewTaskStatus;
import com.iflytek.skillhub.domain.security.ScannerType;
import com.iflytek.skillhub.domain.security.SecurityVerdict;
import com.iflytek.skillhub.domain.skill.SkillVersion;
import com.iflytek.skillhub.domain.skill.SkillVersionRepository;
import com.iflytek.skillhub.domain.skill.SkillVersionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AutoReviewAppServiceTest {

    private static final Long VERSION_ID = 10L;
    private static final Long SKILL_ID = 30L;
    private static final Long REVIEW_TASK_ID = 99L;

    @Mock private SkillVersionRepository skillVersionRepository;
    @Mock private ReviewTaskRepository reviewTaskRepository;
    @Mock private ReviewService reviewService;
    @Mock private StoredSkillPackageReader packageReader;
    @Mock private SkillJudgeEvaluator evaluator;

    private AutoReviewProperties properties;
    private AutoReviewAppService service;

    @BeforeEach
    void setUp() {
        properties = new AutoReviewProperties();
        properties.setEnabled(true);
        service = new AutoReviewAppService(
                properties,
                skillVersionRepository,
                reviewTaskRepository,
                reviewService,
                packageReader,
                evaluator
        );
    }

    @Test
    void skipsEverythingWhenDisabled() {
        properties.setEnabled(false);

        service.reviewAfterSecurityScan(safeCompletedEvent());

        verifyNoInteractions(skillVersionRepository, reviewTaskRepository, reviewService, packageReader, evaluator);
    }

    @Test
    void doesNotAutoReviewUnsafeScanResults() {
        service.reviewAfterSecurityScan(new SecurityScanCompletedEvent(
                VERSION_ID,
                ScannerType.SKILL_SCANNER,
                SecurityVerdict.DANGEROUS,
                false
        ));

        verifyNoInteractions(skillVersionRepository, reviewTaskRepository, reviewService, packageReader, evaluator);
    }

    @Test
    void approvesPendingReviewWhenSkillJudgeScoreMeetsThreshold() throws Exception {
        SkillVersion version = pendingReviewVersion();
        ReviewTask task = pendingReviewTask();
        SkillPackageSnapshot snapshot = new SkillPackageSnapshot(
                SKILL_ID,
                VERSION_ID,
                "---\nname: demo-skill\ndescription: Use when reviewing skills.\n---\n# Demo",
                List.of("SKILL.md")
        );
        SkillJudgeEvaluationResult result = new SkillJudgeEvaluationResult(
                108,
                120,
                "A",
                "Production-ready expert Skill."
        );
        when(skillVersionRepository.findById(VERSION_ID)).thenReturn(Optional.of(version));
        when(reviewTaskRepository.findBySkillVersionIdAndStatus(VERSION_ID, ReviewTaskStatus.PENDING))
                .thenReturn(Optional.of(task));
        when(packageReader.read(SKILL_ID, VERSION_ID)).thenReturn(snapshot);
        when(evaluator.evaluate(snapshot)).thenReturn(result);

        service.reviewAfterSecurityScan(safeCompletedEvent());

        verify(reviewService).approveReview(
                eq(REVIEW_TASK_ID),
                eq("system-auto-review"),
                argThat(comment -> comment != null
                        && comment.contains("# Skill Judge 自动审核报告")
                        && comment.contains("结论：自动通过")
                        && comment.contains("分数：108/120")
                        && comment.contains("通过原因：分数达到通过线")
                        && comment.contains("## 逐项问题")
                        && comment.contains("## 具体修改建议")
                        && comment.contains("## 示例改写")),
                eq(Map.of()),
                eq(Set.of("SUPER_ADMIN"))
        );
        verify(reviewService, never()).rejectReview(
                eq(REVIEW_TASK_ID),
                eq("system-auto-review"),
                contains("Skill Judge auto-rejected"),
                eq(Map.of()),
                eq(Set.of("SUPER_ADMIN"))
        );
    }

    @Test
    void approvesPendingVersionWithoutSecurityScanEvent() throws Exception {
        SkillVersion version = pendingReviewVersion();
        ReviewTask task = pendingReviewTask();
        SkillPackageSnapshot snapshot = new SkillPackageSnapshot(
                SKILL_ID,
                VERSION_ID,
                "---\nname: demo-skill\ndescription: Use when reviewing skills.\n---\n# Demo",
                List.of("SKILL.md")
        );
        SkillJudgeEvaluationResult result = new SkillJudgeEvaluationResult(
                100,
                120,
                "B",
                "Good Skill with minor improvements."
        );
        when(skillVersionRepository.findById(VERSION_ID)).thenReturn(Optional.of(version));
        when(reviewTaskRepository.findBySkillVersionIdAndStatus(VERSION_ID, ReviewTaskStatus.PENDING))
                .thenReturn(Optional.of(task));
        when(packageReader.read(SKILL_ID, VERSION_ID)).thenReturn(snapshot);
        when(evaluator.evaluate(snapshot)).thenReturn(result);

        service.reviewPendingVersion(VERSION_ID);

        verify(reviewService).approveReview(
                eq(REVIEW_TASK_ID),
                eq("system-auto-review"),
                contains("分数：100/120"),
                eq(Map.of()),
                eq(Set.of("SUPER_ADMIN"))
        );
    }


    @Test
    void rejectsPendingReviewWhenSkillJudgeScoreIsBelowThreshold() throws Exception {
        SkillVersion version = pendingReviewVersion();
        ReviewTask task = pendingReviewTask();
        SkillPackageSnapshot snapshot = new SkillPackageSnapshot(
                SKILL_ID,
                VERSION_ID,
                "---\nname: weak-skill\ndescription: Helpful stuff.\n---\n# Weak",
                List.of("SKILL.md")
        );
        SkillJudgeEvaluationResult result = new SkillJudgeEvaluationResult(
                84,
                120,
                "C",
                "description 缺少明确触发场景。",
                List.of(new SkillJudgeIssue(
                        "触发描述",
                        "中",
                        12,
                        "description 缺少明确触发场景，自动激活会不稳定。",
                        "用 “Use when ...” 说明什么任务会触发该 Skill。",
                        "description: Use when reviewing SKILL.md packages and producing a scored optimization report."
                ))
        );
        when(skillVersionRepository.findById(VERSION_ID)).thenReturn(Optional.of(version));
        when(reviewTaskRepository.findBySkillVersionIdAndStatus(VERSION_ID, ReviewTaskStatus.PENDING))
                .thenReturn(Optional.of(task));
        when(packageReader.read(SKILL_ID, VERSION_ID)).thenReturn(snapshot);
        when(evaluator.evaluate(snapshot)).thenReturn(result);

        service.reviewAfterSecurityScan(safeCompletedEvent());

        verify(reviewService).rejectReview(
                eq(REVIEW_TASK_ID),
                eq("system-auto-review"),
                argThat(comment -> comment != null
                        && comment.contains("# Skill Judge 自动审核报告")
                        && comment.contains("结论：自动拒绝")
                        && comment.contains("分数：84/120")
                        && comment.contains("拒绝原因：分数低于通过线")
                        && comment.contains("【触发描述｜中｜扣 12 分】description 缺少明确触发场景")
                        && comment.contains("用 “Use when ...” 说明什么任务会触发该 Skill")
                        && comment.contains("description: Use when reviewing SKILL.md packages")),
                eq(Map.of()),
                eq(Set.of("SUPER_ADMIN"))
        );
        verify(reviewService, never()).approveReview(
                eq(REVIEW_TASK_ID),
                eq("system-auto-review"),
                contains("结论：自动通过"),
                eq(Map.of()),
                eq(Set.of("SUPER_ADMIN"))
        );
    }

    @Test
    void skipsWhenVersionIsNoLongerPendingReview() {
        SkillVersion version = new SkillVersion(SKILL_ID, "1.0.0", "publisher-1");
        version.setStatus(SkillVersionStatus.PUBLISHED);
        when(skillVersionRepository.findById(VERSION_ID)).thenReturn(Optional.of(version));

        service.reviewAfterSecurityScan(safeCompletedEvent());

        verifyNoInteractions(reviewTaskRepository, reviewService, packageReader, evaluator);
    }

    private SecurityScanCompletedEvent safeCompletedEvent() {
        return new SecurityScanCompletedEvent(
                VERSION_ID,
                ScannerType.SKILL_SCANNER,
                SecurityVerdict.SAFE,
                true
        );
    }

    private SkillVersion pendingReviewVersion() {
        SkillVersion version = new SkillVersion(SKILL_ID, "1.0.0", "publisher-1");
        version.setStatus(SkillVersionStatus.PENDING_REVIEW);
        return version;
    }

    private ReviewTask pendingReviewTask() throws Exception {
        ReviewTask task = new ReviewTask(VERSION_ID, 20L, "publisher-1");
        Field idField = ReviewTask.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(task, REVIEW_TASK_ID);
        return task;
    }
}
