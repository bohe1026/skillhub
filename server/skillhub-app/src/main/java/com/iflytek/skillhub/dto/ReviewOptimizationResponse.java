package com.iflytek.skillhub.dto;

public record ReviewOptimizationResponse(
        Long skillId,
        String namespace,
        String slug,
        Long skillVersionId,
        Long reviewTaskId,
        String version,
        String status
) {}
