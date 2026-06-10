package com.iflytek.skillhub.service.autoreview;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class HeuristicSkillJudgeEvaluatorTest {

    private final HeuristicSkillJudgeEvaluator evaluator = new HeuristicSkillJudgeEvaluator();

    @Test
    void scoresStrongSkillAboveDefaultPassThreshold() {
        SkillPackageSnapshot snapshot = new SkillPackageSnapshot(
                1L,
                2L,
                strongSkillMarkdown(),
                List.of("SKILL.md", "references/rubrics.md", "references/failure-patterns.md")
        );

        SkillJudgeEvaluationResult result = evaluator.evaluate(snapshot);

        assertThat(result.score()).isGreaterThanOrEqualTo(96);
        assertThat(result.grade()).isIn("A", "B");
        assertThat(result.issues())
                .allSatisfy(issue -> {
                    assertThat(issue.problem()).isNotBlank();
                    assertThat(issue.suggestion()).isNotBlank();
                    assertThat(issue.example()).isNotBlank();
                });
    }

    @Test
    void penalizesWeakSkillBelowDefaultPassThreshold() {
        SkillPackageSnapshot snapshot = new SkillPackageSnapshot(
                1L,
                2L,
                """
                ---
                name: weak-skill
                description: Helpful guidance.
                ---

                # Weak Skill

                This skill explains basic things and gives generic advice.
                """,
                List.of("SKILL.md")
        );

        SkillJudgeEvaluationResult result = evaluator.evaluate(snapshot);

        assertThat(result.score()).isLessThan(96);
        assertThat(result.summary()).contains("description 缺少明确触发场景");
        assertThat(result.issues())
                .anySatisfy(issue -> {
                    assertThat(issue.dimension()).isEqualTo("触发描述");
                    assertThat(issue.problem()).contains("description 缺少明确触发场景");
                    assertThat(issue.suggestion()).contains("Use when");
                    assertThat(issue.example()).contains("description: Use when reviewing");
                });
    }

    @Test
    void acceptsChineseTriggerDescription() {
        SkillPackageSnapshot snapshot = new SkillPackageSnapshot(
                1L,
                2L,
                strongSkillMarkdown().replace(
                        "Evaluate Agent Skill design quality. Use when reviewing, auditing, or improving SKILL.md packages with trigger keywords for skill quality.",
                        "用于审核和优化 Agent Skill 设计质量。触发场景：当用户要求审核、评估、改进 SKILL.md 包，或需要输出评分报告和具体优化建议时使用。"
                ),
                List.of("SKILL.md", "references/rubrics.md", "references/failure-patterns.md")
        );

        SkillJudgeEvaluationResult result = evaluator.evaluate(snapshot);

        assertThat(result.issues())
                .noneSatisfy(issue -> assertThat(issue.problem()).contains("description 缺少明确触发场景"));
    }

    private String strongSkillMarkdown() {
        return """
                ---
                name: skill-judge
                description: Evaluate Agent Skill design quality. Use when reviewing, auditing, or improving SKILL.md packages with trigger keywords for skill quality.
                ---

                # Skill Judge

                Evaluate Skills by measuring baseline knowledge, expert knowledge, rubric evidence, and practical usability.

                ## Evaluation Workflow

                ### Step 0: Establish Baseline
                Record target agent, baseline used, assumptions, and tradeoff constraints before scoring.

                ### Step 1: Inspect Structure
                Check frontmatter, description trigger language, file count, references, scripts, assets, and load guidance.

                ### Step 2: Knowledge Delta Scan
                Mark sections as expert, activation, or redundant. Prefer evidence that captures expert judgment.

                ### Step 3: Score Dimensions
                Apply the detailed rubric for knowledge delta, procedures, anti-pattern quality, progressive disclosure, freedom calibration, pattern recognition, and usability.

                ### Step 4: Check Failure Patterns
                Identify root causes before writing improvements so the reviewer does not only list symptoms.

                ### Step 5: Generate Report
                Output a report with total score, grade, dimension table, critical issues, top improvements, detailed analysis, and assumptions.

                ## Mandatory Reads
                MANDATORY - READ WHEN SCORING: Read `references/rubrics.md` before assigning final scores.
                MANDATORY - READ WHEN WRITING IMPROVEMENTS: Read `references/failure-patterns.md` before writing fixes.

                ## Never Do
                NEVER give high scores because a Skill looks professional.
                NEVER ignore token waste when content repeats baseline knowledge.
                NEVER skip mentally testing decision trees.
                NEVER undervalue description trigger quality.
                NEVER put trigger guidance only in the body.

                ## Report Format
                Use the exact report template from this Skill so the output can be audited.
                """;
    }
}
