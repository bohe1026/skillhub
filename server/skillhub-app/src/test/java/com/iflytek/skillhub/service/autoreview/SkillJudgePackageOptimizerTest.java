package com.iflytek.skillhub.service.autoreview;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SkillJudgePackageOptimizerTest {

    private final SkillJudgePackageOptimizer optimizer = new SkillJudgePackageOptimizer();

    @Test
    void preservesChineseDescriptionAndAddsOnlyMissingOptimizationSections() {
        String source = """
                ---
                name: media-vod-t2v
                description: 媒体生成平台视频生成与图片生成技能。触发场景：用户要求文生视频、图生视频、文生图、图生图，或指定 VQ3P、K26、VE3.1 等模型生成内容。
                version: 20260610.072404
                ---

                # 媒体生成平台视频生成与图片生成

                ## 使用前置条件
                - 已配置 VOD_ACCESS_KEY 和 VOD_SECRET_KEY。

                ## 错误处理
                - 鉴权失败时提示用户检查 AK/SK。
                """;

        String optimized = optimizer.optimizeSkillMarkdown(source, "20260610.072404.opt1");

        assertTrue(optimized.contains("description: 媒体生成平台视频生成与图片生成技能。触发场景"));
        assertFalse(optimized.contains("Use when executing, reviewing, or improving"));
        assertTrue(optimized.contains("version: 20260610.072404.opt1"));
        assertTrue(optimized.contains("## 触发条件"));
        assertTrue(optimized.contains("## 执行步骤"));
        assertTrue(optimized.contains("## 输出格式"));
        assertTrue(optimized.contains("## 风险提示"));
        assertFalse(optimized.contains("## 使用前置条件\n\n## 使用前置条件"));
        assertFalse(optimized.contains("## 错误处理\n\n## 错误处理"));
        assertTrue(optimized.contains("## Skill Judge 优化说明"));
        assertTrue(optimized.contains("### 本次新增"));
        assertTrue(optimized.contains("- 触发条件"));
        assertTrue(optimized.contains("### 已保留"));
        assertTrue(optimized.contains("- 原始 description"));
        assertTrue(optimized.contains("- 原有正文内容"));
    }

    @Test
    void recordsReportIssuesAndMatchingAddedSectionsInOptimizationSummary() {
        String source = """
                ---
                name: customer-case
                description: 客户案例分析技能，基于客户材料生成案例报告。
                version: 20260610.072404
                ---

                # 客户案例分析
                """;
        String report = """
                # Skill Judge 自动审核报告

                结论：自动拒绝
                分数：84/120（等级 C，通过线 96）
                拒绝原因：分数低于通过线，存在影响触发稳定性、专家判断或可执行性的关键问题，需要修改后重新提交。

                ## 逐项问题
                1. 【触发描述｜中｜12 分】description 缺少明确触发场景，自动激活会不稳定。
                2. 【可执行性｜中｜8 分】缺少立即可用的 workflow 或 checklist，执行者需要自己猜流程。

                ## 具体修改建议
                1. 补充什么任务会触发该 Skill，并点出输入对象和目标结果。
                2. 写出从输入检查、证据收集、评分、生成建议到最终报告的步骤。
                """;

        String optimized = optimizer.optimizeSkillMarkdown(source, "20260610.072404.opt1", report);

        assertTrue(optimized.contains("### 报告问题与补强对应"));
        assertTrue(optimized.contains("description 缺少明确触发场景，自动激活会不稳定"));
        assertTrue(optimized.contains("补充什么任务会触发该 Skill"));
        assertTrue(optimized.contains("对应补强：触发条件"));
        assertTrue(optimized.contains("缺少立即可用的 workflow 或 checklist"));
        assertTrue(optimized.contains("对应补强：执行步骤"));
    }
}
