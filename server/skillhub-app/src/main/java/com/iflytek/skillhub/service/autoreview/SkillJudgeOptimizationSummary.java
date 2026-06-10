package com.iflytek.skillhub.service.autoreview;

import java.util.List;

public record SkillJudgeOptimizationSummary(
        List<String> addedSections,
        List<String> preservedItems,
        String reportSummary,
        List<ReportMapping> reportMappings
) {

    public record ReportMapping(
            String problem,
            String suggestion,
            List<String> matchedSections
    ) {}
}
