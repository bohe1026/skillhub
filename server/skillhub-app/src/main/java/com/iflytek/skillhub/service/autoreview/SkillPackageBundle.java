package com.iflytek.skillhub.service.autoreview;

import java.nio.charset.StandardCharsets;
import java.util.List;

public record SkillPackageBundle(
        Long skillId,
        Long versionId,
        List<SkillPackageFile> files
) {
    public SkillPackageBundle {
        files = files == null ? List.of() : List.copyOf(files);
    }

    public String skillMarkdown() {
        return files.stream()
                .filter(file -> "SKILL.md".equals(file.path()))
                .findFirst()
                .map(file -> new String(file.content(), StandardCharsets.UTF_8))
                .orElseThrow(() -> new IllegalStateException("Stored skill package missing SKILL.md"));
    }

    public List<String> filePaths() {
        return files.stream().map(SkillPackageFile::path).toList();
    }
}
