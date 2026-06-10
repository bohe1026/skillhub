package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.domain.namespace.Namespace;
import com.iflytek.skillhub.domain.namespace.NamespaceRepository;
import com.iflytek.skillhub.domain.review.ReviewService;
import com.iflytek.skillhub.domain.review.ReviewTask;
import com.iflytek.skillhub.domain.review.ReviewTaskRepository;
import com.iflytek.skillhub.domain.review.ReviewTaskStatus;
import com.iflytek.skillhub.domain.skill.Skill;
import com.iflytek.skillhub.domain.skill.SkillRepository;
import com.iflytek.skillhub.domain.skill.SkillVersion;
import com.iflytek.skillhub.domain.skill.SkillVersionRepository;
import com.iflytek.skillhub.domain.skill.SkillVersionStatus;
import com.iflytek.skillhub.domain.skill.SkillVisibility;
import com.iflytek.skillhub.domain.skill.service.SkillPublishService;
import com.iflytek.skillhub.domain.skill.validation.PackageEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillJudgeOptimizationAppServiceTest {

    @Mock private ReviewTaskRepository reviewTaskRepository;
    @Mock private SkillVersionRepository skillVersionRepository;
    @Mock private SkillRepository skillRepository;
    @Mock private NamespaceRepository namespaceRepository;
    @Mock private ReviewService reviewService;
    @Mock private StoredSkillPackageReader packageReader;
    @Mock private SkillPublishService skillPublishService;

    private SkillJudgeOptimizationAppService service;

    @BeforeEach
    void setUp() {
        service = new SkillJudgeOptimizationAppService(
                reviewTaskRepository,
                skillVersionRepository,
                skillRepository,
                namespaceRepository,
                reviewService,
                packageReader,
                skillPublishService,
                new SkillJudgePackageOptimizer()
        );
    }

    @Test
    void optimizesRejectedSkillJudgeReviewIntoNewPendingVersion() throws Exception {
        ReviewTask rejectedTask = new ReviewTask(10L, 20L, "publisher-1");
        setField(rejectedTask, "id", 99L);
        rejectedTask.setStatus(ReviewTaskStatus.REJECTED);
        rejectedTask.setReviewComment("""
                # Skill Judge 自动审核报告

                结论：自动拒绝
                分数：84/120
                """);
        SkillVersion rejectedVersion = new SkillVersion(30L, "20260610.062442", "publisher-1");
        setField(rejectedVersion, "id", 10L);
        rejectedVersion.setStatus(SkillVersionStatus.REJECTED);
        rejectedVersion.setRequestedVisibility(SkillVisibility.PUBLIC);
        Skill skill = new Skill(20L, "demo-skill", "publisher-1", SkillVisibility.PUBLIC);
        setField(skill, "id", 30L);
        Namespace namespace = new Namespace("global", "Global", "admin");
        setField(namespace, "id", 20L);
        SkillPackageBundle bundle = new SkillPackageBundle(
                30L,
                10L,
                List.of(
                        new SkillPackageFile(
                                "SKILL.md",
                                "---\nname: Demo Skill\ndescription: 中文业务描述：用于生成客户案例分析报告，保留原有业务语义。\nversion: 20260610.062442\n---\n# Demo",
                                "text/markdown"
                        ),
                        new SkillPackageFile(
                                "scripts/run.sh",
                                "echo ok",
                                "application/x-sh"
                        )
                )
        );
        SkillVersion optimizedVersion = new SkillVersion(30L, "20260610.062442.opt1", "publisher-1");
        setField(optimizedVersion, "id", 11L);
        optimizedVersion.setStatus(SkillVersionStatus.PENDING_REVIEW);
        ReviewTask optimizedTask = new ReviewTask(11L, 20L, "publisher-1");
        setField(optimizedTask, "id", 100L);
        when(reviewTaskRepository.findById(99L)).thenReturn(Optional.of(rejectedTask));
        when(namespaceRepository.findById(20L)).thenReturn(Optional.of(namespace));
        when(reviewService.canViewReview(
                eq(rejectedTask),
                eq("reviewer-1"),
                eq(namespace.getType()),
                eq(Map.of()),
                eq(Set.of("SKILL_ADMIN"))
        )).thenReturn(true);
        when(skillVersionRepository.findById(10L)).thenReturn(Optional.of(rejectedVersion));
        when(skillRepository.findById(30L)).thenReturn(Optional.of(skill));
        when(skillVersionRepository.findBySkillIdAndVersion(30L, "20260610.062442.opt1"))
                .thenReturn(Optional.empty());
        when(packageReader.readBundle(30L, 10L)).thenReturn(bundle);
        when(skillPublishService.publishFromEntries(
                eq("global"),
                any(),
                eq("publisher-1"),
                eq(SkillVisibility.PUBLIC),
                eq(Set.of()),
                eq(true)
        )).thenReturn(new SkillPublishService.PublishResult(30L, "demo-skill", optimizedVersion));
        when(reviewTaskRepository.findBySkillVersionIdAndStatus(11L, ReviewTaskStatus.PENDING))
                .thenReturn(Optional.of(optimizedTask));

        SkillJudgeOptimizationResult result = service.optimizeReview(
                99L,
                "reviewer-1",
                Map.of(),
                Set.of("SKILL_ADMIN")
        );

        assertEquals(11L, result.skillVersionId());
        assertEquals(100L, result.reviewTaskId());
        assertEquals("20260610.062442.opt1", result.version());
        assertEquals("PENDING_REVIEW", result.status());
        assertTrue(result.optimizationSummary().addedSections().contains("触发条件"));
        assertTrue(result.optimizationSummary().preservedItems().contains("原始 description"));
        assertTrue(result.optimizationSummary().reportSummary().contains("分数：84/120"));
        ArgumentCaptor<List<PackageEntry>> entriesCaptor = ArgumentCaptor.forClass(List.class);
        verify(skillPublishService).publishFromEntries(
                eq("global"),
                entriesCaptor.capture(),
                eq("publisher-1"),
                eq(SkillVisibility.PUBLIC),
                eq(Set.of()),
                eq(true)
        );
        List<PackageEntry> entries = entriesCaptor.getValue();
        String optimizedSkillMd = entries.stream()
                .filter(entry -> entry.path().equals("SKILL.md"))
                .findFirst()
                .map(entry -> new String(entry.content(), StandardCharsets.UTF_8))
                .orElseThrow();
        assertTrue(optimizedSkillMd.contains("version: 20260610.062442.opt1"));
        assertTrue(optimizedSkillMd.contains("description: 中文业务描述：用于生成客户案例分析报告，保留原有业务语义。"));
        assertTrue(optimizedSkillMd.contains("## 触发条件"));
        assertTrue(optimizedSkillMd.contains("## 使用前置条件"));
        assertTrue(optimizedSkillMd.contains("## 执行步骤"));
        assertTrue(optimizedSkillMd.contains("## 错误处理"));
        assertTrue(optimizedSkillMd.contains("## 输出格式"));
        assertTrue(optimizedSkillMd.contains("## 风险提示"));
        assertTrue(optimizedSkillMd.contains("## Skill Judge 优化说明"));
        assertTrue(optimizedSkillMd.contains("### 本次新增"));
        assertTrue(optimizedSkillMd.contains("### 已保留"));
        assertTrue(optimizedSkillMd.contains("- 原始 description"));
        assertTrue(optimizedSkillMd.contains("- 原有正文内容"));
        assertTrue(optimizedSkillMd.contains("- 分数：84/120"));
        assertTrue(entries.stream().anyMatch(entry -> entry.path().equals("scripts/run.sh")));
    }

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
