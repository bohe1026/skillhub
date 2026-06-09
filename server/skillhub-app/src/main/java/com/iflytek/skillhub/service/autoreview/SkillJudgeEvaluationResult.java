package com.iflytek.skillhub.service.autoreview;

public record SkillJudgeEvaluationResult(
        int score,
        int maxScore,
        String grade,
        String summary
) {
}
