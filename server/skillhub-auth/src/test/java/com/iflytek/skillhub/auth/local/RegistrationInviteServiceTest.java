package com.iflytek.skillhub.auth.local;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.iflytek.skillhub.auth.exception.AuthFlowException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;

class RegistrationInviteServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-06-12T00:00:00Z"), ZoneOffset.UTC);

    private final RegistrationInviteRepository inviteRepository = Mockito.mock(RegistrationInviteRepository.class);
    private final RegistrationInviteService service = new RegistrationInviteService(inviteRepository, CLOCK);

    @Test
    void createInvite_generatesSevenDayDepartmentCode() {
        given(inviteRepository.existsByCodeIgnoreCase(any())).willReturn(false);
        given(inviteRepository.save(any(RegistrationInvite.class))).willAnswer(invocation -> invocation.getArgument(0));

        RegistrationInvite invite = service.createInvite("AI team", 3, "admin");

        assertThat(invite.getCode()).startsWith("TEAM-AI-2026-7D-");
        assertThat(invite.getLabel()).isEqualTo("AI team");
        assertThat(invite.getMaxUses()).isEqualTo(3);
        assertThat(invite.getExpiresAt()).isEqualTo(Instant.parse("2026-06-19T00:00:00Z"));
    }

    @Test
    void consumeInvite_incrementsUsageForActiveInvite() {
        RegistrationInvite invite = new RegistrationInvite(
            "TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6",
            "AI team",
            2,
            Instant.parse("2026-06-13T00:00:00Z"),
            "admin"
        );
        given(inviteRepository.findByCodeForUpdate("TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6"))
            .willReturn(Optional.of(invite));
        given(inviteRepository.save(invite)).willReturn(invite);

        RegistrationInvite consumed = service.consumeInvite(" team-ai-2026-7d-m9q4-x7k2-p8vn-l3r6 ");

        assertThat(consumed.getUsedCount()).isEqualTo(1);
        assertThat(consumed.getLastUsedAt()).isEqualTo(Instant.parse("2026-06-12T00:00:00Z"));
        verify(inviteRepository).save(invite);
    }

    @Test
    void consumeInvite_rejectsExpiredInvite() {
        RegistrationInvite invite = new RegistrationInvite(
            "TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6",
            "AI team",
            null,
            Instant.parse("2026-06-11T23:59:59Z"),
            "admin"
        );
        given(inviteRepository.findByCodeForUpdate("TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6"))
            .willReturn(Optional.of(invite));

        assertThatThrownBy(() -> service.consumeInvite("TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6"))
            .isInstanceOfSatisfying(AuthFlowException.class, ex -> {
                assertThat(ex.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                assertThat(ex.getMessage()).contains("error.auth.invite.expired");
            });
    }
}
