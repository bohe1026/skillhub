package com.iflytek.skillhub.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminUserPasswordUpdateRequest(
        @NotBlank(message = "{validation.auth.local.newPassword.notBlank}")
        String newPassword
) {
}
