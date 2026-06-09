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
        // This mirrors the publish-time storage layout used by ObjectStorageBundleStorageService.
        String bundleKey = String.format("packages/%d/%d/bundle.zip", skillId, versionId);
        try (InputStream inputStream = objectStorageService.getObject(bundleKey);
             ZipInputStream zipInputStream = new ZipInputStream(inputStream, StandardCharsets.UTF_8)) {
            List<String> filePaths = new ArrayList<>();
            String skillMarkdown = null;
            ZipEntry entry;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                String path = entry.getName();
                filePaths.add(path);
                if ("SKILL.md".equals(path)) {
                    skillMarkdown = readEntry(zipInputStream);
                }
            }
            if (skillMarkdown == null) {
                throw new IllegalStateException("Stored skill package missing SKILL.md: " + bundleKey);
            }
            return new SkillPackageSnapshot(skillId, versionId, skillMarkdown, List.copyOf(filePaths));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to read stored skill package: " + bundleKey, e);
        }
    }

    private String readEntry(ZipInputStream zipInputStream) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        zipInputStream.transferTo(outputStream);
        return outputStream.toString(StandardCharsets.UTF_8);
    }
}
