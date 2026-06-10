package com.iflytek.skillhub.service.autoreview;

public record SkillJudgeOptimizationResult(
        Long skillId,
        String namespace,
        String slug,
        Long skillVersionId,
        Long reviewTaskId,
        String version,
        String status,
        SkillJudgeOptimizationSummary optimizationSummary
) {
}
