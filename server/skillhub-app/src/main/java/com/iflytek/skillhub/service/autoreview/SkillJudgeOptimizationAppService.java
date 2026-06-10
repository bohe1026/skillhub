package com.iflytek.skillhub.service.autoreview;

import com.iflytek.skillhub.domain.namespace.Namespace;
import com.iflytek.skillhub.domain.namespace.NamespaceRepository;
import com.iflytek.skillhub.domain.namespace.NamespaceRole;
import com.iflytek.skillhub.domain.review.ReviewService;
import com.iflytek.skillhub.domain.review.ReviewTask;
import com.iflytek.skillhub.domain.review.ReviewTaskRepository;
import com.iflytek.skillhub.domain.review.ReviewTaskStatus;
import com.iflytek.skillhub.domain.shared.exception.DomainBadRequestException;
import com.iflytek.skillhub.domain.shared.exception.DomainForbiddenException;
import com.iflytek.skillhub.domain.shared.exception.DomainNotFoundException;
import com.iflytek.skillhub.domain.skill.Skill;
import com.iflytek.skillhub.domain.skill.SkillRepository;
import com.iflytek.skillhub.domain.skill.SkillVersion;
import com.iflytek.skillhub.domain.skill.SkillVersionRepository;
import com.iflytek.skillhub.domain.skill.SkillVisibility;
import com.iflytek.skillhub.domain.skill.service.SkillPublishService;
import com.iflytek.skillhub.domain.skill.validation.PackageEntry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class SkillJudgeOptimizationAppService {

    private final ReviewTaskRepository reviewTaskRepository;
    private final SkillVersionRepository skillVersionRepository;
    private final SkillRepository skillRepository;
    private final NamespaceRepository namespaceRepository;
    private final ReviewService reviewService;
    private final StoredSkillPackageReader packageReader;
    private final SkillPublishService skillPublishService;
    private final SkillJudgePackageOptimizer optimizer;

    public SkillJudgeOptimizationAppService(ReviewTaskRepository reviewTaskRepository,
                                            SkillVersionRepository skillVersionRepository,
                                            SkillRepository skillRepository,
                                            NamespaceRepository namespaceRepository,
                                            ReviewService reviewService,
                                            StoredSkillPackageReader packageReader,
                                            SkillPublishService skillPublishService,
                                            SkillJudgePackageOptimizer optimizer) {
        this.reviewTaskRepository = reviewTaskRepository;
        this.skillVersionRepository = skillVersionRepository;
        this.skillRepository = skillRepository;
        this.namespaceRepository = namespaceRepository;
        this.reviewService = reviewService;
        this.packageReader = packageReader;
        this.skillPublishService = skillPublishService;
        this.optimizer = optimizer;
    }

    @Transactional
    public SkillJudgeOptimizationResult optimizeReview(Long reviewTaskId,
                                                       String actorUserId,
                                                       Map<Long, NamespaceRole> userNamespaceRoles,
                                                       Set<String> platformRoles) {
        ReviewTask task = reviewTaskRepository.findById(reviewTaskId)
                .orElseThrow(() -> new DomainNotFoundException("review_task.not_found", reviewTaskId));
        Namespace namespace = namespaceRepository.findById(task.getNamespaceId())
                .orElseThrow(() -> new DomainNotFoundException("namespace.not_found", task.getNamespaceId()));
        if (!reviewService.canViewReview(task, actorUserId, namespace.getType(),
                userNamespaceRoles != null ? userNamespaceRoles : Map.of(),
                platformRoles != null ? platformRoles : Set.of())) {
            throw new DomainForbiddenException("review.no_permission");
        }
        if (task.getStatus() != ReviewTaskStatus.REJECTED) {
            throw new DomainBadRequestException("review.optimize.not_rejected", reviewTaskId);
        }
        if (task.getReviewComment() == null || !task.getReviewComment().contains("Skill Judge 自动审核报告")) {
            throw new DomainBadRequestException("review.optimize.not_skill_judge", reviewTaskId);
        }

        SkillVersion sourceVersion = skillVersionRepository.findById(task.getSkillVersionId())
                .orElseThrow(() -> new DomainNotFoundException("skill_version.not_found", task.getSkillVersionId()));
        Skill skill = skillRepository.findById(sourceVersion.getSkillId())
                .orElseThrow(() -> new DomainNotFoundException("skill.not_found", sourceVersion.getSkillId()));
        String targetVersion = nextOptimizationVersion(skill.getId(), sourceVersion.getVersion());
        SkillPackageBundle sourceBundle = packageReader.readBundle(skill.getId(), sourceVersion.getId());
        String optimizedSkillMarkdown = optimizer.optimizeSkillMarkdown(
                sourceBundle.skillMarkdown(),
                targetVersion,
                task.getReviewComment()
        );
        List<PackageEntry> entries = sourceBundle.files().stream()
                .map(file -> toPackageEntry(file, optimizedSkillMarkdown))
                .toList();

        SkillVisibility visibility = sourceVersion.getRequestedVisibility() != null
                ? sourceVersion.getRequestedVisibility()
                : skill.getVisibility();
        SkillPublishService.PublishResult publishResult = skillPublishService.publishFromEntries(
                namespace.getSlug(),
                entries,
                task.getSubmittedBy(),
                visibility,
                Set.of(),
                true
        );
        Long optimizedReviewTaskId = reviewTaskRepository
                .findBySkillVersionIdAndStatus(publishResult.version().getId(), ReviewTaskStatus.PENDING)
                .map(ReviewTask::getId)
                .orElse(null);
        return new SkillJudgeOptimizationResult(
                publishResult.skillId(),
                namespace.getSlug(),
                publishResult.slug(),
                publishResult.version().getId(),
                optimizedReviewTaskId,
                publishResult.version().getVersion(),
                publishResult.version().getStatus().name()
        );
    }

    private String nextOptimizationVersion(Long skillId, String sourceVersion) {
        for (int i = 1; i <= 20; i++) {
            String candidate = sourceVersion + ".opt" + i;
            if (skillVersionRepository.findBySkillIdAndVersion(skillId, candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new DomainBadRequestException("review.optimize.version_exhausted", sourceVersion);
    }

    private PackageEntry toPackageEntry(SkillPackageFile file, String optimizedSkillMarkdown) {
        byte[] content = "SKILL.md".equals(file.path())
                ? optimizedSkillMarkdown.getBytes(StandardCharsets.UTF_8)
                : file.content();
        return new PackageEntry(file.path(), content, content.length, file.contentType());
    }
}
