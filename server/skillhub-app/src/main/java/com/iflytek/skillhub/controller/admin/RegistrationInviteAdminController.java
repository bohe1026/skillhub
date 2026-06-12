package com.iflytek.skillhub.controller.admin;

import com.iflytek.skillhub.auth.local.RegistrationInviteService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import com.iflytek.skillhub.controller.BaseApiController;
import com.iflytek.skillhub.dto.ApiResponse;
import com.iflytek.skillhub.dto.ApiResponseFactory;
import com.iflytek.skillhub.dto.PageResponse;
import com.iflytek.skillhub.dto.RegistrationInviteCreateRequest;
import com.iflytek.skillhub.dto.RegistrationInviteResponse;
import com.iflytek.skillhub.exception.UnauthorizedException;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/registration-invites")
public class RegistrationInviteAdminController extends BaseApiController {

    private final RegistrationInviteService inviteService;

    public RegistrationInviteAdminController(RegistrationInviteService inviteService,
                                             ApiResponseFactory responseFactory) {
        super(responseFactory);
        this.inviteService = inviteService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<PageResponse<RegistrationInviteResponse>> listInvites(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = inviteService.listInvites(page, size);
        return ok("response.success.read", new PageResponse<>(
                result.getContent().stream().map(RegistrationInviteResponse::from).toList(),
                result.getTotalElements(),
                result.getNumber(),
                result.getSize()
        ));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<RegistrationInviteResponse> createInvite(
            @AuthenticationPrincipal PlatformPrincipal principal,
            @Valid @RequestBody RegistrationInviteCreateRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("error.auth.required");
        }
        return ok("response.success.created", RegistrationInviteResponse.from(
                inviteService.createInvite(request.label(), request.maxUses(), principal.userId())
        ));
    }

    @PostMapping("/{inviteId}/revoke")
    @PreAuthorize("hasAnyRole('USER_ADMIN', 'SUPER_ADMIN')")
    public ApiResponse<RegistrationInviteResponse> revokeInvite(
            @PathVariable Long inviteId,
            @AuthenticationPrincipal PlatformPrincipal principal) {
        if (principal == null) {
            throw new UnauthorizedException("error.auth.required");
        }
        return ok("response.success.updated", RegistrationInviteResponse.from(
                inviteService.revokeInvite(inviteId, principal.userId())
        ));
    }
}
