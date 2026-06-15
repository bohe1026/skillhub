package com.iflytek.skillhub.service;

import com.iflytek.skillhub.auth.local.LocalAuthService;
import com.iflytek.skillhub.auth.local.RegistrationInviteService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Coordinates private self-registration so invite usage and user creation are
 * committed or rolled back as one operation.
 */
@Service
public class LocalRegistrationAppService {

    private final RegistrationInviteService registrationInviteService;
    private final LocalAuthService localAuthService;

    public LocalRegistrationAppService(RegistrationInviteService registrationInviteService,
                                       LocalAuthService localAuthService) {
        this.registrationInviteService = registrationInviteService;
        this.localAuthService = localAuthService;
    }

    @Transactional
    public PlatformPrincipal registerWithInvite(String username,
                                                String password,
                                                String inviteCode) {
        registrationInviteService.consumeInvite(inviteCode);
        return localAuthService.register(username, password, null);
    }
}
