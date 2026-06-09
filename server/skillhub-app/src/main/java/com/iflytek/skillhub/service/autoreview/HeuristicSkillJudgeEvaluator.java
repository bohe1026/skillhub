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
        List<String> issues = new ArrayList<>();
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
                summaryFor(issues)
        );
    }

    private SkillMetadata parseMetadata(String skillMarkdown, List<String> issues) {
        try {
            return metadataParser.parse(skillMarkdown);
        } catch (DomainBadRequestException ex) {
            issues.add("Invalid SKILL.md frontmatter.");
            return new SkillMetadata("", "", null, skillMarkdown == null ? "" : skillMarkdown, java.util.Map.of());
        }
    }

    private int specificationPenalty(SkillMetadata metadata, List<String> issues) {
        // Hard specification issues get the largest penalties because they affect installability.
        int penalty = 0;
        if (!SKILL_NAME_PATTERN.matcher(metadata.name()).matches()) {
            penalty += 15;
            issues.add("Skill name must be lowercase alphanumeric with hyphens and <=64 characters.");
        }
        if (metadata.description().isBlank()) {
            penalty += 15;
            issues.add("Description is required.");
        }
        return penalty;
    }

    private int descriptionPenalty(String description, List<String> issues) {
        String normalized = normalize(description);
        int penalty = 0;
        if (!containsAny(normalized, "use when", "when ", "trigger", "review", "audit", "evaluate", "improve")) {
            penalty += 12;
            issues.add("Description should include WHEN trigger guidance.");
        }
        if (description.length() < 40) {
            penalty += 8;
            issues.add("Description is too short to activate reliably.");
        }
        return penalty;
    }

    private int knowledgeDeltaPenalty(String body, List<String> issues) {
        // Skill Judge rewards transferable expert procedure, not just a short prompt.
        String normalized = normalize(body);
        int penalty = 0;
        if (lineCount(body) < 40) {
            penalty += 12;
            issues.add("SKILL.md is too short to transfer expert procedures.");
        }
        if (!containsAny(normalized, "baseline", "expert", "tradeoff", "decision", "criteria", "rubric", "evidence")) {
            penalty += 14;
            issues.add("Missing explicit expert criteria or decision framework.");
        }
        return penalty;
    }

    private int antiPatternPenalty(String body, List<String> issues) {
        String normalized = normalize(body);
        if (containsAny(normalized, "never", "do not", "don't", "avoid", "anti-pattern", "red flag")) {
            return 0;
        }
        issues.add("Missing explicit anti-patterns or red flags.");
        return 12;
    }

    private int progressiveDisclosurePenalty(List<String> filePaths, String body, List<String> issues) {
        // Large skills should point to references/ explicitly so agents load extra context lazily.
        boolean hasReference = filePaths.stream().anyMatch(path -> path.startsWith("references/"));
        if (!hasReference) {
            issues.add("No references/ files for progressive disclosure.");
            return 10;
        }
        String normalized = normalize(body);
        if (!containsAny(normalized, "read `references/", "read [", "mandatory - read", "references/")) {
            issues.add("Reference files exist but SKILL.md does not clearly say when to load them.");
            return 6;
        }
        return 0;
    }

    private int usabilityPenalty(String body, List<String> issues) {
        String normalized = normalize(body);
        int penalty = 0;
        if (!containsAny(normalized, "workflow", "step 1", "step 0", "process", "checklist")) {
            penalty += 8;
            issues.add("Missing an immediately usable workflow.");
        }
        if (!containsAny(normalized, "report", "output", "template", "format")) {
            penalty += 6;
            issues.add("Missing output/report format guidance.");
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

    private String summaryFor(List<String> issues) {
        if (issues.isEmpty()) {
            return "No blocking Skill Judge issues found by automated checks.";
        }
        return String.join(" ", issues);
    }
}
