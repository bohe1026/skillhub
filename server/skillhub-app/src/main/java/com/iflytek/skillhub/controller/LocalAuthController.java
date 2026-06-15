package com.iflytek.skillhub.controller;

import com.iflytek.skillhub.auth.local.LocalAuthService;
import com.iflytek.skillhub.auth.local.PasswordResetService;
import com.iflytek.skillhub.auth.exception.AuthFlowException;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import com.iflytek.skillhub.auth.session.PlatformSessionService;
import com.iflytek.skillhub.config.LocalAuthSelfServiceProperties;
import com.iflytek.skillhub.dto.ApiResponse;
import com.iflytek.skillhub.dto.ApiResponseFactory;
import com.iflytek.skillhub.dto.AuthMeResponse;
import com.iflytek.skillhub.dto.ChangePasswordRequest;
import com.iflytek.skillhub.dto.LocalLoginRequest;
import com.iflytek.skillhub.dto.LocalRegisterRequest;
import com.iflytek.skillhub.dto.PasswordResetConfirmRequest;
import com.iflytek.skillhub.dto.PasswordResetRequestDto;
import com.iflytek.skillhub.exception.UnauthorizedException;
import com.iflytek.skillhub.metrics.SkillHubMetrics;
import com.iflytek.skillhub.ratelimit.RateLimit;
import com.iflytek.skillhub.security.AuthFailureThrottleService;
import com.iflytek.skillhub.service.LocalRegistrationAppService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * HTTP endpoints for local account registration, login, and password changes.
 */
@RestController
@RequestMapping("/api/v1/auth/local")
public class LocalAuthController extends BaseApiController {

    private final LocalAuthService localAuthService;
    private final SkillHubMetrics skillHubMetrics;
    private final PlatformSessionService platformSessionService;
    private final AuthFailureThrottleService authFailureThrottleService;
    private final PasswordResetService passwordResetService;
    private final LocalRegistrationAppService localRegistrationAppService;
    private final LocalAuthSelfServiceProperties selfServiceProperties;

    public LocalAuthController(ApiResponseFactory responseFactory,
                               LocalAuthService localAuthService,
                               SkillHubMetrics skillHubMetrics,
                               PlatformSessionService platformSessionService,
                               AuthFailureThrottleService authFailureThrottleService,
                               PasswordResetService passwordResetService,
                               LocalRegistrationAppService localRegistrationAppService,
                               LocalAuthSelfServiceProperties selfServiceProperties) {
        super(responseFactory);
        this.localAuthService = localAuthService;
        this.skillHubMetrics = skillHubMetrics;
        this.platformSessionService = platformSessionService;
        this.authFailureThrottleService = authFailureThrottleService;
        this.passwordResetService = passwordResetService;
        this.localRegistrationAppService = localRegistrationAppService;
        this.selfServiceProperties = selfServiceProperties;
    }

    @PostMapping("/register")
    @RateLimit(category = "auth-register", authenticated = 10, anonymous = 5, windowSeconds = 300)
    public ApiResponse<AuthMeResponse> register(@Valid @RequestBody LocalRegisterRequest request,
                                                HttpServletRequest httpRequest) {
        if (!selfServiceProperties.isRegistrationEnabled() && !selfServiceProperties.isInviteRegistrationEnabled()) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.local.registration.disabled");
        }
        PlatformPrincipal principal = selfServiceProperties.isInviteRegistrationEnabled()
            ? localRegistrationAppService.registerWithInvite(
                request.username(),
                request.password(),
                request.inviteCode()
            )
            : localAuthService.register(request.username(), request.password(), null);
        skillHubMetrics.incrementUserRegister();
        platformSessionService.establishSession(principal, httpRequest);
        return ok("response.success.created", AuthMeResponse.from(principal));
    }

    @PostMapping("/login")
    @RateLimit(category = "auth-local-login", authenticated = 20, anonymous = 10, windowSeconds = 60)
    public ApiResponse<AuthMeResponse> login(@Valid @RequestBody LocalLoginRequest request,
                                             HttpServletRequest httpRequest) {
        authFailureThrottleService.assertAllowed("local", request.username(), resolveClientIp(httpRequest));
        PlatformPrincipal principal;
        try {
            principal = localAuthService.login(request.username(), request.password());
        } catch (AuthFlowException ex) {
            if (HttpStatus.UNAUTHORIZED.equals(ex.getStatus())) {
                authFailureThrottleService.recordFailure("local", request.username(), resolveClientIp(httpRequest));
            }
            skillHubMetrics.recordLocalLogin(false);
            throw ex;
        } catch (RuntimeException ex) {
            skillHubMetrics.recordLocalLogin(false);
            throw ex;
        }
        authFailureThrottleService.resetIdentifier("local", request.username());
        skillHubMetrics.recordLocalLogin(true);
        platformSessionService.establishSession(principal, httpRequest);
        return ok("response.success.read", AuthMeResponse.from(principal));
    }

    @PostMapping("/change-password")
    @RateLimit(category = "auth-change-password", authenticated = 5, anonymous = 20, windowSeconds = 300)
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal PlatformPrincipal principal,
                                            @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            throw new UnauthorizedException("error.auth.required");
        }
        localAuthService.changePassword(principal.userId(), request.currentPassword(), request.newPassword());
        return ok("response.success.updated", null);
    }

    @PostMapping("/password-reset/request")
    @RateLimit(category = "auth-password-reset-request", authenticated = 8, anonymous = 5, windowSeconds = 300)
    public ApiResponse<Void> requestPasswordReset(@Valid @RequestBody PasswordResetRequestDto request) {
        if (!selfServiceProperties.isPasswordResetEnabled()) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.password.reset.disabled");
        }
        passwordResetService.requestPasswordReset(request.email());
        return ok("response.auth.password.reset.requested", null);
    }

    @PostMapping("/password-reset/confirm")
    @RateLimit(category = "auth-password-reset-confirm", authenticated = 10, anonymous = 10, windowSeconds = 300)
    public ApiResponse<Void> confirmPasswordReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
        if (!selfServiceProperties.isPasswordResetEnabled()) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.password.reset.disabled");
        }
        passwordResetService.confirmPasswordReset(request.email(), request.code(), request.newPassword());
        return ok("response.auth.password.reset.confirmed", null);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
