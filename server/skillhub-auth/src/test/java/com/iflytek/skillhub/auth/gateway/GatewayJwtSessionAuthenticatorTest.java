package com.iflytek.skillhub.auth.gateway;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.iflytek.skillhub.auth.oauth.OAuthClaims;
import com.iflytek.skillhub.auth.oauth.OAuthLoginFlowService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class GatewayJwtSessionAuthenticatorTest {

    private static final String SECRET = "11111111-1111-1111-1111-111111111111";

    @Test
    void authenticate_verifiesGatewayJwtAndMapsClaims() {
        GatewayJwtAuthProperties properties = enabledProperties();
        OAuthLoginFlowService loginFlowService = mock(OAuthLoginFlowService.class);
        PlatformPrincipal principal = new PlatformPrincipal(
            "usr_zt",
            "张三",
            "zhangsan@example.com",
            null,
            "enterprise-sso",
            Set.of("USER")
        );
        when(loginFlowService.authenticate(org.mockito.ArgumentMatchers.any(OAuthClaims.class)))
            .thenReturn(principal);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Enterprise-Authorization", signedToken("zhangsan", "张三", "zhangsan@example.com", SECRET));

        var result = new GatewayJwtSessionAuthenticator(properties, loginFlowService).authenticate(request);

        assertThat(result).contains(principal);
        ArgumentCaptor<OAuthClaims> captor = ArgumentCaptor.forClass(OAuthClaims.class);
        verify(loginFlowService).authenticate(captor.capture());
        OAuthClaims claims = captor.getValue();
        assertThat(claims.provider()).isEqualTo("enterprise-sso");
        assertThat(claims.subject()).isEqualTo("zhangsan");
        assertThat(claims.providerLogin()).isEqualTo("张三");
        assertThat(claims.email()).isEqualTo("zhangsan@example.com");
        assertThat(claims.emailVerified()).isTrue();
    }

    @Test
    void authenticate_rejectsInvalidSignature() {
        GatewayJwtAuthProperties properties = enabledProperties();
        OAuthLoginFlowService loginFlowService = mock(OAuthLoginFlowService.class);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Enterprise-Authorization", signedToken("zhangsan", null, null, "wrong-secret"));

        var result = new GatewayJwtSessionAuthenticator(properties, loginFlowService).authenticate(request);

        assertThat(result).isEmpty();
        verifyNoInteractions(loginFlowService);
    }

    @Test
    void authenticate_rejectsBlankUsername() {
        GatewayJwtAuthProperties properties = enabledProperties();
        OAuthLoginFlowService loginFlowService = mock(OAuthLoginFlowService.class);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Enterprise-Authorization", signedToken("  ", null, null, SECRET));

        var result = new GatewayJwtSessionAuthenticator(properties, loginFlowService).authenticate(request);

        assertThat(result).isEmpty();
        verifyNoInteractions(loginFlowService);
    }

    @Test
    void authenticate_rejectsTokenWithoutRequiredTimes() {
        GatewayJwtAuthProperties properties = enabledProperties();
        OAuthLoginFlowService loginFlowService = mock(OAuthLoginFlowService.class);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("X-Enterprise-Authorization", JWT.create()
            .withClaim("username", "zhangsan")
            .sign(Algorithm.HMAC256(SECRET)));

        var result = new GatewayJwtSessionAuthenticator(properties, loginFlowService).authenticate(request);

        assertThat(result).isEmpty();
        verifyNoInteractions(loginFlowService);
    }

    @Test
    void authenticate_returnsEmptyWhenDisabledOrSecretMissing() {
        GatewayJwtAuthProperties properties = enabledProperties();
        properties.setEnabled(false);
        OAuthLoginFlowService loginFlowService = mock(OAuthLoginFlowService.class);

        var result = new GatewayJwtSessionAuthenticator(properties, loginFlowService)
            .authenticate(new MockHttpServletRequest());

        assertThat(result).isEmpty();
        verifyNoInteractions(loginFlowService);
    }

    private static GatewayJwtAuthProperties enabledProperties() {
        GatewayJwtAuthProperties properties = new GatewayJwtAuthProperties();
        properties.setEnabled(true);
        properties.setSecret(SECRET);
        return properties;
    }

    private static String signedToken(String username, String name, String email, String secret) {
        Instant now = Instant.now();
        var builder = JWT.create()
            .withIssuedAt(now)
            .withExpiresAt(now.plusSeconds(300))
            .withClaim("username", username);
        if (name != null) {
            builder.withClaim("name", name);
        }
        if (email != null) {
            builder.withClaim("email", email);
        }
        return builder.sign(Algorithm.HMAC256(secret));
    }
}
