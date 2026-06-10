package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.domain.skill.metadata.SkillMetadata;
import com.iflytek.skillhub.domain.skill.metadata.SkillMetadataParser;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SkillJudgePackageOptimizer {

    private static final Pattern NUMBERED_LINE_PATTERN = Pattern.compile("^\\d+\\.\\s*(.*)$");
    private static final Pattern ISSUE_PREFIX_PATTERN = Pattern.compile("^【[^】]+】\\s*(.*)$");

    private final SkillMetadataParser metadataParser = new SkillMetadataParser();

    public String optimizeSkillMarkdown(String skillMarkdown, String targetVersion) {
        return optimizeSkillMarkdown(skillMarkdown, targetVersion, null);
    }

    public String optimizeSkillMarkdown(String skillMarkdown, String targetVersion, String reviewComment) {
        SkillMetadata metadata = metadataParser.parse(skillMarkdown);
        Map<String, Object> frontmatter = new LinkedHashMap<>(metadata.frontmatter());
        frontmatter.put("name", metadata.name());
        frontmatter.put("description", preserveDescription(metadata));
        frontmatter.put("version", targetVersion);

        String body = cleanBody(metadata.body());
        OptimizationPlan plan = planOptimization(body, reviewComment);

        return buildFrontmatter(frontmatter)
                + "\n"
                + body
                + "\n\n"
                + optimizationBlock(plan);
    }

    private String preserveDescription(SkillMetadata metadata) {
        String description = metadata.description() == null ? "" : metadata.description().trim();
        return description;
    }

    private String buildFrontmatter(Map<String, Object> frontmatter) {
        StringBuilder builder = new StringBuilder("---\n");
        for (Map.Entry<String, Object> entry : frontmatter.entrySet()) {
            builder.append(entry.getKey())
                    .append(": ")
                    .append(formatYamlScalar(entry.getValue()))
                    .append('\n');
        }
        builder.append("---\n");
        return builder.toString();
    }

    private String formatYamlScalar(Object value) {
        String text = value == null ? "" : value.toString();
        if (text.contains(":") || text.contains("#") || text.startsWith("{") || text.startsWith("[")
                || text.contains("&") || text.isBlank()) {
            return "\"" + text.replace("\"", "\\\"") + "\"";
        }
        return text;
    }

    private String cleanBody(String body) {
        String normalized = body == null ? "" : body.strip();
        return normalized.isBlank() ? "# Skill" : normalized;
    }

    private OptimizationPlan planOptimization(String body, String reviewComment) {
        List<Section> missingSections = new ArrayList<>();
        addIfMissing(missingSections, body, "触发条件", """
                ## 触发条件
                - 当用户明确要求执行本技能覆盖的任务、调用相关工具或基于本技能产出结果时触发。
                - 当用户只提出泛泛咨询、缺少必要输入或任务不属于本技能范围时，先澄清需求或说明不触发。
                - 触发前检查用户是否提供了必需参数、文件、链接、环境变量或上下文。
                """);
        addIfMissing(missingSections, body, "使用前置条件", """
                ## 使用前置条件
                - 确认必需账号、权限、环境变量、依赖工具和网络访问已经准备好。
                - 对缺失的前置条件给出明确补齐方式，避免直接执行会失败的步骤。
                - 不记录、不回显真实密钥、Token、密码或其他敏感信息。
                """);
        addIfMissing(missingSections, body, "执行步骤", """
                ## 执行步骤
                1. 解析用户目标、输入材料、约束条件和期望输出。
                2. 按原有能力说明选择合适路径、模型、脚本或参数。
                3. 执行前检查高风险参数和缺失信息，必要时先询问用户。
                4. 执行后整理结果、失败原因和下一步操作。
                """);
        addIfMissing(missingSections, body, "错误处理", """
                ## 错误处理
                - 鉴权、权限或配额失败时，说明可能原因和需要用户检查的配置项。
                - 输入格式、文件、链接或参数不符合要求时，指出具体字段并给出修正示例。
                - 外部服务超时或暂不可用时，保留任务标识和可重试步骤。
                """);
        addIfMissing(missingSections, body, "输出格式", """
                ## 输出格式
                - 先给出最终结论或生成结果，再补充关键参数、执行状态和可访问链接。
                - 失败时输出错误类型、定位依据、建议修复步骤和是否可以重试。
                - 涉及文件、脚本或接口调用时，列出关键路径、命令或请求参数摘要。
                """);
        addIfMissing(missingSections, body, "风险提示", """
                ## 风险提示
                - 不在回复中暴露真实密钥、签名、Token、密码或私有下载地址。
                - 对会产生费用、调用外部服务、修改远端状态或长时间运行的操作先确认。
                - 对不确定的模型能力、接口限制或安全风险，明确说明假设和验证方式。
                """);
        return new OptimizationPlan(
                missingSections,
                summarizeReport(reviewComment),
                reportFindings(reviewComment, missingSections)
        );
    }

    private void addIfMissing(List<Section> sections, String body, String title, String markdown) {
        if (!hasSection(body, title)) {
            sections.add(new Section(title, markdown.strip()));
        }
    }

    private boolean hasSection(String body, String title) {
        String quoted = java.util.regex.Pattern.quote(title);
        return java.util.regex.Pattern.compile("(?m)^#{2,6}\\s+" + quoted + "\\s*$")
                .matcher(body)
                .find();
    }

    private String summarizeReport(String reviewComment) {
        if (reviewComment == null || reviewComment.isBlank()) {
            return "依据 Skill Judge 自动审核报告，对缺失结构进行保守补强。";
        }
        return reviewComment.lines()
                .map(String::trim)
                .filter(line -> line.startsWith("拒绝原因：") || line.startsWith("通过原因：") || line.startsWith("分数："))
                .findFirst()
                .orElse("依据 Skill Judge 自动审核报告，对缺失结构进行保守补强。");
    }

    private List<ReportFinding> reportFindings(String reviewComment, List<Section> addedSections) {
        if (reviewComment == null || reviewComment.isBlank()) {
            return List.of();
        }
        List<String> issues = numberedLinesInSection(reviewComment, "逐项问题");
        List<String> suggestions = numberedLinesInSection(reviewComment, "具体修改建议");
        List<ReportFinding> findings = new ArrayList<>();
        for (int i = 0; i < issues.size(); i++) {
            String issue = stripIssuePrefix(issues.get(i));
            String suggestion = i < suggestions.size() ? suggestions.get(i) : "";
            List<String> matchedSections = matchedAddedSections(issue + " " + suggestion, addedSections);
            if (!issue.isBlank() || !suggestion.isBlank()) {
                findings.add(new ReportFinding(issue, suggestion, matchedSections));
            }
        }
        return findings;
    }

    private List<String> numberedLinesInSection(String markdown, String sectionTitle) {
        List<String> lines = new ArrayList<>();
        boolean inside = false;
        for (String rawLine : markdown.lines().toList()) {
            String line = rawLine.trim();
            if (line.equals("## " + sectionTitle)) {
                inside = true;
                continue;
            }
            if (inside && line.startsWith("## ")) {
                break;
            }
            if (inside) {
                Matcher matcher = NUMBERED_LINE_PATTERN.matcher(line);
                if (matcher.matches()) {
                    lines.add(matcher.group(1).trim());
                }
            }
        }
        return lines;
    }

    private String stripIssuePrefix(String issue) {
        Matcher matcher = ISSUE_PREFIX_PATTERN.matcher(issue);
        return matcher.matches() ? matcher.group(1).trim() : issue;
    }

    private List<String> matchedAddedSections(String reportText, List<Section> addedSections) {
        List<String> matches = new ArrayList<>();
        addMatch(matches, reportText, addedSections, "触发条件",
                "触发", "description", "激活", "匹配", "输入对象", "目标结果");
        addMatch(matches, reportText, addedSections, "使用前置条件",
                "前置", "权限", "账号", "依赖", "环境变量", "references/");
        addMatch(matches, reportText, addedSections, "执行步骤",
                "workflow", "checklist", "步骤", "流程", "证据收集", "评分");
        addMatch(matches, reportText, addedSections, "错误处理",
                "失败", "错误", "异常", "超时", "重试");
        addMatch(matches, reportText, addedSections, "输出格式",
                "输出", "报告", "format", "template", "分数", "通过/拒绝", "示例改写");
        addMatch(matches, reportText, addedSections, "风险提示",
                "风险", "边界", "anti-pattern", "red flag", "never", "avoid", "警惕", "拒绝");
        if (matches.isEmpty()) {
            for (Section section : addedSections) {
                matches.add(section.title());
            }
        }
        return matches;
    }

    private void addMatch(List<String> matches,
                          String reportText,
                          List<Section> addedSections,
                          String sectionTitle,
                          String... keywords) {
        if (matches.contains(sectionTitle) || addedSections.stream().noneMatch(section -> section.title().equals(sectionTitle))) {
            return;
        }
        String normalized = reportText.toLowerCase(java.util.Locale.ROOT);
        for (String keyword : keywords) {
            if (normalized.contains(keyword.toLowerCase(java.util.Locale.ROOT))) {
                matches.add(sectionTitle);
                return;
            }
        }
    }

    private String optimizationBlock(OptimizationPlan plan) {
        StringBuilder builder = new StringBuilder();
        for (Section section : plan.addedSections()) {
            builder.append(section.markdown()).append("\n\n");
        }
        builder.append("## Skill Judge 优化说明\n\n");
        builder.append("### 本次新增\n");
        if (plan.addedSections().isEmpty()) {
            builder.append("- 未追加新的业务章节；原 SKILL.md 已包含重点结构。\n");
        } else {
            for (Section section : plan.addedSections()) {
                builder.append("- ").append(section.title()).append('\n');
            }
        }
        builder.append("\n### 已保留\n");
        builder.append("- 原始 description\n");
        builder.append("- 原有正文内容\n");
        builder.append("- 原有 scripts/、references/ 等附属文件\n");
        builder.append("\n### 优化依据\n");
        builder.append("- ").append(plan.reportSummary()).append('\n');
        builder.append("- 本次优化只补充缺失说明，不覆盖原业务语义。\n");
        if (!plan.reportFindings().isEmpty()) {
            builder.append("\n### 报告问题与补强对应\n");
            for (ReportFinding finding : plan.reportFindings()) {
                if (!finding.problem().isBlank()) {
                    builder.append("- 报告问题：").append(finding.problem()).append('\n');
                }
                if (!finding.suggestion().isBlank()) {
                    builder.append("  建议来源：").append(finding.suggestion()).append('\n');
                }
                if (!finding.matchedSections().isEmpty()) {
                    builder.append("  对应补强：").append(String.join("、", finding.matchedSections())).append('\n');
                }
            }
        }
        return builder.toString().strip();
    }

    private record Section(String title, String markdown) {}

    private record ReportFinding(String problem, String suggestion, List<String> matchedSections) {}

    private record OptimizationPlan(List<Section> addedSections, String reportSummary, List<ReportFinding> reportFindings) {}
}
