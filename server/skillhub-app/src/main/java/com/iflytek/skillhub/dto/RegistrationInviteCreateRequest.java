package com.iflytek.skillhub.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record RegistrationInviteCreateRequest(
        @Size(max = 160, message = "{validation.auth.invite.label.tooLong}")
        String label,
        @Min(value = 1, message = "{error.auth.invite.maxUses.invalid}")
        @Max(value = 10000, message = "{error.auth.invite.maxUses.invalid}")
        Integer maxUses
) {
}
