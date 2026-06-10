package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.domain.shared.exception.DomainBadRequestException;
import com.iflytek.skillhub.domain.skill.metadata.SkillMetadata;
import com.iflytek.skillhub.domain.skill.metadata.SkillMetadataParser;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class HeuristicSkillJudgeEvaluator implements SkillJudgeEvaluator {

    private static final int MAX_SCORE = 120;
    private static final Pattern SKILL_NAME_PATTERN = Pattern.compile("^[a-z0-9-]{1,64}$");

    private final SkillMetadataParser metadataParser = new SkillMetadataParser();

    @Override
    public SkillJudgeEvaluationResult evaluate(SkillPackageSnapshot snapshot) {
        List<SkillJudgeIssue> issues = new ArrayList<>();
        SkillMetadata metadata = parseMetadata(snapshot.skillMarkdown(), issues);

        int score = MAX_SCORE;
        score -= specificationPenalty(metadata, issues);
        score -= descriptionPenalty(metadata.description(), issues);
        score -= knowledgeDeltaPenalty(metadata.body(), issues);
        score -= antiPatternPenalty(metadata.body(), issues);
        score -= progressiveDisclosurePenalty(snapshot.filePaths(), metadata.body(), issues);
        score -= usabilityPenalty(metadata.body(), issues);

        int boundedScore = Math.max(0, Math.min(MAX_SCORE, score));
        return new SkillJudgeEvaluationResult(
                boundedScore,
                MAX_SCORE,
                gradeFor(boundedScore),
                summaryFor(issues),
                issues
        );
    }

    private SkillMetadata parseMetadata(String skillMarkdown, List<SkillJudgeIssue> issues) {
        try {
            return metadataParser.parse(skillMarkdown);
        } catch (DomainBadRequestException ex) {
            issues.add(issue(
                    "格式规范",
                    "严重",
                    0,
                    "SKILL.md frontmatter 解析失败，系统无法可靠读取 name、description、version 等元数据。",
                    "检查文件开头的 YAML frontmatter，确保使用 --- 包裹，并且每个字段都是合法的 key: value。",
                    """
                    ---
                    name: skill-judge
                    description: Use when reviewing, auditing, or improving Agent Skill packages.
                    version: 20260610.010000
                    ---
                    """
            ));
            return new SkillMetadata("", "", null, skillMarkdown == null ? "" : skillMarkdown, java.util.Map.of());
        }
    }

    private int specificationPenalty(SkillMetadata metadata, List<SkillJudgeIssue> issues) {
        // Hard specification issues get the largest penalties because they affect installability.
        int penalty = 0;
        if (!SKILL_NAME_PATTERN.matcher(metadata.name()).matches()) {
            penalty += 15;
            issues.add(issue(
                    "格式规范",
                    "严重",
                    15,
                    "name 不符合 Skill 规范：仅允许小写字母、数字和连字符，长度不超过 64。",
                    "把 name 改成稳定、短小、可读的 slug，避免空格、下划线、大写字母和中文。",
                    "name: skill-judge"
            ));
        }
        if (metadata.description().isBlank()) {
            penalty += 15;
            issues.add(issue(
                    "触发描述",
                    "严重",
                    15,
                    "description 为空，系统和用户都无法判断什么时候应该触发这个 Skill。",
                    "在 frontmatter 的 description 中写清适用场景、触发条件和任务边界。",
                    "description: Use when reviewing, auditing, or improving Agent Skill packages for quality and usability."
            ));
        }
        return penalty;
    }

    private int descriptionPenalty(String description, List<SkillJudgeIssue> issues) {
        String normalized = normalize(description);
        int penalty = 0;
        if (!containsAny(normalized, "use when", "when ", "trigger", "review", "audit", "evaluate", "improve")) {
            penalty += 12;
            issues.add(issue(
                    "触发描述",
                    "中",
                    12,
                    "description 缺少明确触发场景，自动激活会不稳定。",
                    "用 “Use when ...” 或 “When ...” 说明什么任务会触发该 Skill，并点出输入对象和目标结果。",
                    "description: Use when reviewing SKILL.md packages and producing a scored optimization report."
            ));
        }
        if (description.length() < 40) {
            penalty += 8;
            issues.add(issue(
                    "触发描述",
                    "中",
                    8,
                    "description 太短，缺少足够的语义信号来支撑可靠匹配。",
                    "补充任务类型、适用对象、动作和产出，不要只写泛泛的 helpful guidance。",
                    "description: Use when auditing an Agent Skill package for trigger quality, expert workflow, references, and report format."
            ));
        }
        return penalty;
    }

    private int knowledgeDeltaPenalty(String body, List<SkillJudgeIssue> issues) {
        // Skill Judge rewards transferable expert procedure, not just a short prompt.
        String normalized = normalize(body);
        int penalty = 0;
        if (lineCount(body) < 40) {
            penalty += 12;
            issues.add(issue(
                    "知识增量",
                    "中",
                    12,
                    "SKILL.md 正文过短，难以沉淀可迁移的专家流程。",
                    "增加完整工作流、判断标准、失败模式和输出模板，让模型不仅知道“做什么”，也知道“怎么判断好坏”。",
                    """
                    ## Workflow
                    1. Inspect frontmatter and trigger quality.
                    2. Score the expert procedure against the rubric.
                    3. Return prioritized fixes with examples.
                    """
            ));
        }
        if (!containsAny(normalized, "baseline", "expert", "tradeoff", "decision", "criteria", "rubric", "evidence")) {
            penalty += 14;
            issues.add(issue(
                    "专家判断",
                    "严重",
                    14,
                    "缺少明确的专家评分标准或决策框架，审核结果会停留在主观印象。",
                    "加入 criteria、rubric、evidence、tradeoff 等判断依据，并说明何时给高分、何时扣分。",
                    """
                    ## Review Criteria
                    - Trigger quality: description states when to use the Skill.
                    - Expert delta: content adds non-obvious decisions and evidence checks.
                    """
            ));
        }
        return penalty;
    }

    private int antiPatternPenalty(String body, List<SkillJudgeIssue> issues) {
        String normalized = normalize(body);
        if (containsAny(normalized, "never", "do not", "don't", "avoid", "anti-pattern", "red flag")) {
            return 0;
        }
        issues.add(issue(
                "风险边界",
                "中",
                12,
                "缺少 anti-pattern 或 red flag，模型不知道哪些情况必须警惕或拒绝。",
                "增加 Never Do / Avoid / Red Flags 小节，列出常见误判、危险捷径和必须人工确认的边界。",
                """
                ## Never Do
                - Do not approve a Skill only because the prose looks polished.
                - Avoid scoring without checking trigger quality and references.
                """
        ));
        return 12;
    }

    private int progressiveDisclosurePenalty(List<String> filePaths, String body, List<SkillJudgeIssue> issues) {
        // Large skills should point to references/ explicitly so agents load extra context lazily.
        boolean hasReference = filePaths.stream().anyMatch(path -> path.startsWith("references/"));
        if (!hasReference) {
            issues.add(issue(
                    "渐进披露",
                    "中",
                    10,
                    "缺少 references/ 辅助资料，复杂规则只能堆在 SKILL.md 里，难以按需加载。",
                    "把详细 rubric、失败模式、长示例或模板放到 references/，在主文件中只保留触发条件和加载时机。",
                    """
                    references/rubrics.md
                    references/failure-patterns.md
                    references/report-template.md
                    """
            ));
            return 10;
        }
        String normalized = normalize(body);
        if (!containsAny(normalized, "read `references/", "read [", "mandatory - read", "references/")) {
            issues.add(issue(
                    "渐进披露",
                    "低",
                    6,
                    "存在 references/ 文件，但 SKILL.md 没有说明何时读取，模型可能忽略关键资料。",
                    "在正文增加 Mandatory Reads 或 Workflow 提示，明确评分、写建议、处理边界场景时应加载哪些 reference。",
                    "MANDATORY - READ WHEN SCORING: Read `references/rubrics.md` before assigning the final score."
            ));
            return 6;
        }
        return 0;
    }

    private int usabilityPenalty(String body, List<SkillJudgeIssue> issues) {
        String normalized = normalize(body);
        int penalty = 0;
        if (!containsAny(normalized, "workflow", "step 1", "step 0", "process", "checklist")) {
            penalty += 8;
            issues.add(issue(
                    "可执行性",
                    "中",
                    8,
                    "缺少立即可用的 workflow 或 checklist，执行者需要自己猜流程。",
                    "写出从输入检查、证据收集、评分、生成建议到最终报告的步骤，步骤要能直接照做。",
                    """
                    ## Workflow
                    1. Read SKILL.md frontmatter.
                    2. Check trigger, expert criteria, red flags, references, and report format.
                    3. Produce a scored report with prioritized fixes.
                    """
            ));
        }
        if (!containsAny(normalized, "report", "output", "template", "format")) {
            penalty += 6;
            issues.add(issue(
                    "输出质量",
                    "低",
                    6,
                    "缺少 output/report format 指引，最终审核结果不容易对齐和复查。",
                    "补充固定报告模板，至少包含分数、通过/拒绝原因、逐项问题、修改建议和示例改写。",
                    """
                    ## Report Format
                    - Score: x/120
                    - Decision: pass/reject
                    - Issues: problem, suggestion, example rewrite
                    """
            ));
        }
        return penalty;
    }

    private boolean containsAny(String text, String... needles) {
        for (String needle : needles) {
            if (text.contains(needle)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private int lineCount(String value) {
        if (value == null || value.isBlank()) {
            return 0;
        }
        return value.split("\\R").length;
    }

    private String gradeFor(int score) {
        if (score >= 108) {
            return "A";
        }
        if (score >= 96) {
            return "B";
        }
        if (score >= 84) {
            return "C";
        }
        if (score >= 72) {
            return "D";
        }
        return "F";
    }

    private SkillJudgeIssue issue(String dimension,
                                  String severity,
                                  int penalty,
                                  String problem,
                                  String suggestion,
                                  String example) {
        return new SkillJudgeIssue(dimension, severity, penalty, problem, suggestion, example.strip());
    }

    private String summaryFor(List<SkillJudgeIssue> issues) {
        if (issues.isEmpty()) {
            return "自动规则未发现阻塞性 Skill Judge 问题。";
        }
        return issues.stream()
                .map(SkillJudgeIssue::problem)
                .reduce((left, right) -> left + " " + right)
                .orElse("");
    }
}
