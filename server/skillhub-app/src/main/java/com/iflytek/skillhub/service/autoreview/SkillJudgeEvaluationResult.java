package com.iflytek.skillhub.service.autoreview;

import java.util.List;

public record SkillJudgeEvaluationResult(
        int score,
        int maxScore,
        String grade,
        String summary,
        List<SkillJudgeIssue> issues
) {
    public SkillJudgeEvaluationResult {
        issues = issues == null ? List.of() : List.copyOf(issues);
    }

    public SkillJudgeEvaluationResult(int score, int maxScore, String grade, String summary) {
        this(score, maxScore, grade, summary, List.of());
    }
}
