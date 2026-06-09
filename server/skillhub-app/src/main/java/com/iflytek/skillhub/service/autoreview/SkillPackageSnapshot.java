package com.iflytek.skillhub.service.autoreview;

import java.util.List;

public record SkillPackageSnapshot(
        Long skillId,
        Long versionId,
        String skillMarkdown,
        List<String> filePaths
) {
}
