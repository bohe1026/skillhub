package com.iflytek.skillhub.dto;

import com.iflytek.skillhub.service.autoreview.SkillJudgeOptimizationSummary;

public record ReviewOptimizationResponse(
        Long skillId,
        String namespace,
        String slug,
        Long skillVersionId,
        Long reviewTaskId,
        String version,
        String status,
        SkillJudgeOptimizationSummary optimizationSummary
) {}
