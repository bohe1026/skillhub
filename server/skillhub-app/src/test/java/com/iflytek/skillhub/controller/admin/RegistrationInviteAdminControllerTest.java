package com.iflytek.skillhub.controller.admin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.iflytek.skillhub.TestRedisConfig;
import com.iflytek.skillhub.auth.device.DeviceAuthService;
import com.iflytek.skillhub.auth.local.RegistrationInvite;
import com.iflytek.skillhub.auth.local.RegistrationInviteService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import com.iflytek.skillhub.domain.namespace.NamespaceMemberRepository;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestRedisConfig.class)
class RegistrationInviteAdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private NamespaceMemberRepository namespaceMemberRepository;

    @MockBean
    private DeviceAuthService deviceAuthService;

    @MockBean
    private RegistrationInviteService inviteService;

    @Test
    void listInvites_withUserAdminRole_returnsInvitePage() throws Exception {
        given(inviteService.listInvites(0, 20)).willReturn(new PageImpl<>(
            List.of(invite(7L)),
            PageRequest.of(0, 20),
            1
        ));

        mockMvc.perform(get("/api/v1/admin/registration-invites")
                .with(authentication(auth("USER_ADMIN"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.items[0].id").value(7))
            .andExpect(jsonPath("$.data.items[0].code").value("TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6"));
    }

    @Test
    void listInvites_withNormalUserRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/registration-invites")
                .with(authentication(auth("USER"))))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.code").value(403));
    }

    @Test
    void createInvite_withSuperAdminRole_delegatesToService() throws Exception {
        RegistrationInvite invite = invite(8L);
        given(inviteService.createInvite("AI team", 10, "admin-1")).willReturn(invite);

        mockMvc.perform(post("/api/v1/admin/registration-invites")
                .with(authentication(auth("SUPER_ADMIN")))
                .with(csrf())
                .contentType(APPLICATION_JSON)
                .content("""
                    {"label":"AI team","maxUses":10}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(8));

        verify(inviteService).createInvite("AI team", 10, "admin-1");
    }

    @Test
    void revokeInvite_withUserAdminRole_delegatesToService() throws Exception {
        RegistrationInvite invite = invite(9L);
        given(inviteService.revokeInvite(9L, "admin-1")).willReturn(invite);

        mockMvc.perform(post("/api/v1/admin/registration-invites/9/revoke")
                .with(authentication(auth("USER_ADMIN")))
                .with(csrf()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value(0))
            .andExpect(jsonPath("$.data.id").value(9));

        verify(inviteService).revokeInvite(9L, "admin-1");
    }

    private UsernamePasswordAuthenticationToken auth(String role) {
        PlatformPrincipal principal = new PlatformPrincipal(
            "admin-1",
            "admin",
            "admin@example.com",
            "",
            "local",
            Set.of(role)
        );
        return new UsernamePasswordAuthenticationToken(
            principal,
            null,
            List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    private RegistrationInvite invite(Long id) {
        RegistrationInvite invite = new RegistrationInvite(
            "TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6",
            "AI team",
            null,
            Instant.parse("2026-06-19T00:00:00Z"),
            "admin-1"
        );
        ReflectionTestUtils.setField(invite, "id", id);
        ReflectionTestUtils.setField(invite, "createdAt", Instant.parse("2026-06-12T00:00:00Z"));
        return invite;
    }
}
