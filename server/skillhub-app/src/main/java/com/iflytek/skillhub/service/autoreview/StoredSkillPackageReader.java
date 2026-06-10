package com.iflytek.skillhub.service.autoreview;

public interface StoredSkillPackageReader {
    SkillPackageSnapshot read(Long skillId, Long versionId);
    SkillPackageBundle readBundle(Long skillId, Long versionId);
}
