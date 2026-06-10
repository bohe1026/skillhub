package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.domain.skill.metadata.SkillMetadata;
import com.iflytek.skillhub.domain.skill.metadata.SkillMetadataParser;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class SkillJudgePackageOptimizer {

    private final SkillMetadataParser metadataParser = new SkillMetadataParser();

    public String optimizeSkillMarkdown(String skillMarkdown, String targetVersion) {
        SkillMetadata metadata = metadataParser.parse(skillMarkdown);
        Map<String, Object> frontmatter = new LinkedHashMap<>(metadata.frontmatter());
        frontmatter.put("name", metadata.name());
        frontmatter.put("description", improvedDescription(metadata));
        frontmatter.put("version", targetVersion);

        return buildFrontmatter(frontmatter)
                + "\n"
                + cleanBody(metadata.body())
                + "\n\n"
                + optimizationBlock(metadata.name());
    }

    private String improvedDescription(SkillMetadata metadata) {
        String description = metadata.description() == null ? "" : metadata.description().trim();
        if (description.toLowerCase().contains("use when") && description.length() >= 80) {
            return description;
        }
        String subject = metadata.name() == null || metadata.name().isBlank()
                ? "this skill"
                : metadata.name();
        return "Use when executing, reviewing, or improving " + subject
                + " workflows that require clear trigger conditions, evidence-based decisions, risk checks, and actionable output.";
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
        if (text.contains(":") || text.contains("#") || text.startsWith("{") || text.startsWith("[") || text.isBlank()) {
            return "\"" + text.replace("\"", "\\\"") + "\"";
        }
        return text;
    }

    private String cleanBody(String body) {
        String normalized = body == null ? "" : body.strip();
        return normalized.isBlank() ? "# Skill" : normalized;
    }

    private String optimizationBlock(String skillName) {
        String title = skillName == null || skillName.isBlank() ? "Skill" : skillName;
        return """
                ## Workflow
                1. Confirm the user's task matches this Skill's trigger conditions before acting.
                2. Inspect the supplied context, files, logs, or references before making a recommendation.
                3. Apply the review criteria below and cite concrete evidence for important decisions.
                4. Return a concise result with the decision, reasoning, risks, and next action.

                ## Review Criteria
                - Trigger quality: the request clearly fits the Skill's stated "Use when" condition.
                - Expert delta: the answer adds domain judgment, not generic rewriting.
                - Evidence: important claims are grounded in supplied files, logs, references, or observable behavior.
                - Actionability: suggestions include exact edits, commands, examples, or verification steps.
                - Safety: risky operations, destructive actions, secrets, and unsupported assumptions are called out.

                ## Mandatory Reference Loading
                - If `references/` exists, read the relevant file before scoring or rewriting complex content.
                - If `scripts/` exists, prefer using or adapting those scripts instead of retyping long logic.

                ## Never Do
                - Do not approve or complete work only because the prose looks polished.
                - Do not ignore missing inputs, failed commands, scanner warnings, or contradictory evidence.
                - Avoid broad rewrites when a focused change solves the issue.

                ## Output Template
                - Decision: pass, reject, or needs changes.
                - Score or confidence: explain the main factors.
                - Key issues: list the highest-impact problems first.
                - Concrete fixes: include specific wording, file paths, commands, or examples.
                - Verification: state how to confirm the fix worked.

                ## Optimized By Skill Judge
                This section was generated to improve "%s" toward the Skill Judge passing rubric.
                """.formatted(title).strip();
    }
}
