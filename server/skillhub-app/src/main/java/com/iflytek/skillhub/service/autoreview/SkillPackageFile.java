package com.iflytek.skillhub.service.autoreview;

import java.nio.charset.StandardCharsets;

public record SkillPackageFile(
        String path,
        byte[] content,
        String contentType
) {
    public SkillPackageFile(String path, String textContent, String contentType) {
        this(path, textContent.getBytes(StandardCharsets.UTF_8), contentType);
    }
}
