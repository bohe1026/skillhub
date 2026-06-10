package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.storage.ObjectStorageService;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class ObjectStorageSkillPackageReader implements StoredSkillPackageReader {

    private final ObjectStorageService objectStorageService;

    public ObjectStorageSkillPackageReader(ObjectStorageService objectStorageService) {
        this.objectStorageService = objectStorageService;
    }

    @Override
    public SkillPackageSnapshot read(Long skillId, Long versionId) {
        SkillPackageBundle bundle = readBundle(skillId, versionId);
        return new SkillPackageSnapshot(
                skillId,
                versionId,
                bundle.skillMarkdown(),
                bundle.filePaths()
        );
    }

    @Override
    public SkillPackageBundle readBundle(Long skillId, Long versionId) {
        // This mirrors the publish-time storage layout used by ObjectStorageBundleStorageService.
        String bundleKey = String.format("packages/%d/%d/bundle.zip", skillId, versionId);
        try (InputStream inputStream = objectStorageService.getObject(bundleKey);
             ZipInputStream zipInputStream = new ZipInputStream(inputStream, StandardCharsets.UTF_8)) {
            List<SkillPackageFile> files = new ArrayList<>();
            ZipEntry entry;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String path = entry.getName();
                byte[] content = readEntryBytes(zipInputStream);
                files.add(new SkillPackageFile(path, content, contentTypeFor(path)));
            }
            SkillPackageBundle bundle = new SkillPackageBundle(skillId, versionId, files);
            if (bundle.filePaths().stream().noneMatch("SKILL.md"::equals)) {
                throw new IllegalStateException("Stored skill package missing SKILL.md: " + bundleKey);
            }
            return bundle;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read stored skill package: " + bundleKey, e);
        }
    }

    private byte[] readEntryBytes(ZipInputStream zipInputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        zipInputStream.transferTo(outputStream);
        return outputStream.toByteArray();
    }

    private String contentTypeFor(String path) {
        if (path.endsWith(".md")) {
            return "text/markdown";
        }
        if (path.endsWith(".json")) {
            return "application/json";
        }
        if (path.endsWith(".yml") || path.endsWith(".yaml")) {
            return "application/x-yaml";
        }
        if (path.endsWith(".sh")) {
            return "application/x-sh";
        }
        if (path.endsWith(".txt")) {
            return "text/plain";
        }
        return "application/octet-stream";
    }
}
