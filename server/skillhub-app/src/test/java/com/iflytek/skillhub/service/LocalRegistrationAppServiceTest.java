package com.iflytek.skillhub.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.inOrder;

import com.iflytek.skillhub.auth.local.LocalAuthService;
import com.iflytek.skillhub.auth.local.RegistrationInviteService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.mockito.Mockito;

class LocalRegistrationAppServiceTest {

    private final RegistrationInviteService registrationInviteService =
        Mockito.mock(RegistrationInviteService.class);
    private final LocalAuthService localAuthService = Mockito.mock(LocalAuthService.class);
    private final LocalRegistrationAppService service =
        new LocalRegistrationAppService(registrationInviteService, localAuthService);

    @Test
    void registerWithInvite_consumesInviteBeforeCreatingUser() {
        PlatformPrincipal principal = new PlatformPrincipal(
            "usr_1",
            "bob",
            null,
            "",
            "local",
            Set.of()
        );
        given(localAuthService.register("bob", "Abcd123!", null)).willReturn(principal);

        PlatformPrincipal result = service.registerWithInvite(
            "bob",
            "Abcd123!",
            "TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6"
        );

        assertThat(result).isSameAs(principal);
        InOrder order = inOrder(registrationInviteService, localAuthService);
        order.verify(registrationInviteService).consumeInvite("TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6");
        order.verify(localAuthService).register("bob", "Abcd123!", null);
    }
}
