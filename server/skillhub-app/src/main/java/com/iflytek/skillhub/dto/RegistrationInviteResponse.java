package com.iflytek.skillhub.dto;

import com.iflytek.skillhub.auth.local.RegistrationInvite;
import java.time.Instant;

public record RegistrationInviteResponse(
        Long id,
        String code,
        String label,
        Integer maxUses,
        int usedCount,
        Instant expiresAt,
        boolean revoked,
        String createdBy,
        String revokedBy,
        Instant revokedAt,
        Instant lastUsedAt,
        Instant createdAt
) {
    public static RegistrationInviteResponse from(RegistrationInvite invite) {
        return new RegistrationInviteResponse(
                invite.getId(),
                invite.getCode(),
                invite.getLabel(),
                invite.getMaxUses(),
                invite.getUsedCount(),
                invite.getExpiresAt(),
                invite.isRevoked(),
                invite.getCreatedBy(),
                invite.getRevokedBy(),
                invite.getRevokedAt(),
                invite.getLastUsedAt(),
                invite.getCreatedAt()
        );
    }
}
