package com.iflytek.skillhub.service.autoreview;

public record SkillJudgeIssue(
        String dimension,
        String severity,
        int penalty,
        String problem,
        String suggestion,
        String example
) {
}
