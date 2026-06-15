package com.iflytek.skillhub.auth.local;

import com.iflytek.skillhub.auth.exception.AuthFlowException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class RegistrationInviteService {

    private static final String DEFAULT_PREFIX = "TEAM-AI-2026";
    private static final Duration DEFAULT_TTL = Duration.ofDays(7);
    private static final String ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

    private final RegistrationInviteRepository inviteRepository;
    private final Clock clock;
    private final SecureRandom secureRandom = new SecureRandom();

    public RegistrationInviteService(RegistrationInviteRepository inviteRepository, Clock clock) {
        this.inviteRepository = inviteRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public Page<RegistrationInvite> listInvites(int page, int size) {
        int resolvedSize = Math.max(1, Math.min(size, 100));
        return inviteRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(Math.max(page, 0), resolvedSize));
    }

    @Transactional
    public RegistrationInvite createInvite(String label, Integer maxUses, String createdBy) {
        if (maxUses != null && maxUses <= 0) {
            throw new AuthFlowException(HttpStatus.BAD_REQUEST, "error.auth.invite.maxUses.invalid");
        }
        String code = generateUniqueCode();
        RegistrationInvite invite = new RegistrationInvite(
            code,
            normalizeLabel(label),
            maxUses,
            Instant.now(clock).plus(DEFAULT_TTL),
            createdBy
        );
        return inviteRepository.save(invite);
    }

    @Transactional
    public RegistrationInvite revokeInvite(Long inviteId, String revokedBy) {
        RegistrationInvite invite = inviteRepository.findById(inviteId)
            .orElseThrow(() -> new AuthFlowException(HttpStatus.NOT_FOUND, "error.auth.invite.notFound"));
        if (!invite.isRevoked()) {
            invite.revoke(revokedBy, Instant.now(clock));
            inviteRepository.save(invite);
        }
        return invite;
    }

    @Transactional
    public RegistrationInvite consumeInvite(String code) {
        String normalizedCode = normalizeCode(code);
        if (!StringUtils.hasText(normalizedCode)) {
            throw new AuthFlowException(HttpStatus.BAD_REQUEST, "validation.auth.local.inviteCode.notBlank");
        }

        RegistrationInvite invite = inviteRepository.findByCodeForUpdate(normalizedCode)
            .orElseThrow(() -> new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.invite.invalid"));
        Instant now = Instant.now(clock);
        if (invite.isRevoked()) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.invite.revoked");
        }
        if (invite.getExpiresAt() != null && !invite.getExpiresAt().isAfter(now)) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.invite.expired");
        }
        if (invite.getMaxUses() != null && invite.getUsedCount() >= invite.getMaxUses()) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.invite.exhausted");
        }
        invite.markUsed(now);
        return inviteRepository.save(invite);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = DEFAULT_PREFIX + "-7D-" + randomGroup() + "-" + randomGroup() + "-" + randomGroup() + "-" + randomGroup();
            if (!inviteRepository.existsByCodeIgnoreCase(code)) {
                return code;
            }
        }
        throw new IllegalStateException("Unable to generate unique registration invite");
    }

    private String randomGroup() {
        StringBuilder builder = new StringBuilder(4);
        for (int i = 0; i < 4; i++) {
            builder.append(ALPHABET.charAt(secureRandom.nextInt(ALPHABET.length())));
        }
        return builder.toString();
    }

    private String normalizeCode(String code) {
        return code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLabel(String label) {
        return StringUtils.hasText(label) ? label.trim() : "Department invite";
    }
}
