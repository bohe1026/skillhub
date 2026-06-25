package com.iflytek.skillhub.auth.gateway;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.iflytek.skillhub.auth.bootstrap.PassiveSessionAuthenticator;
import com.iflytek.skillhub.auth.exception.AuthFlowException;
import com.iflytek.skillhub.auth.oauth.AccountDisabledException;
import com.iflytek.skillhub.auth.oauth.AccountPendingException;
import com.iflytek.skillhub.auth.oauth.OAuthClaims;
import com.iflytek.skillhub.auth.oauth.OAuthLoginFlowService;
import com.iflytek.skillhub.auth.rbac.PlatformPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.stereotype.Component;

/**
 * Establishes a SkillCenter session from enterprise gateway JWT headers.
 */
@Component
@ConditionalOnProperty(prefix = "skillhub.auth.gateway-jwt", name = "enabled", havingValue = "true")
public class GatewayJwtSessionAuthenticator implements PassiveSessionAuthenticator {

    private static final Logger logger = LoggerFactory.getLogger(GatewayJwtSessionAuthenticator.class);

    private final GatewayJwtAuthProperties properties;
    private final OAuthLoginFlowService oAuthLoginFlowService;

    public GatewayJwtSessionAuthenticator(GatewayJwtAuthProperties properties,
                                          OAuthLoginFlowService oAuthLoginFlowService) {
        this.properties = properties;
        this.oAuthLoginFlowService = oAuthLoginFlowService;
    }

    @Override
    public String providerCode() {
        return normalizedOrDefault(properties.getProviderCode(), "enterprise-sso");
    }

    @Override
    public String displayName() {
        return normalizedOrDefault(properties.getDisplayName(), providerCode());
    }

    @Override
    public Optional<PlatformPrincipal> authenticate(HttpServletRequest request) {
        if (!properties.isEnabled() || isBlank(properties.getSecret())) {
            return Optional.empty();
        }

        String token = readGatewayToken(request);
        if (isBlank(token)) {
            return Optional.empty();
        }

        DecodedJWT jwt;
        try {
            jwt = JWT.require(Algorithm.HMAC256(properties.getSecret()))
                .build()
                .verify(token);
        } catch (JWTVerificationException ex) {
            logger.warn("Rejected gateway JWT for provider {}: {}", providerCode(), ex.getMessage());
            return Optional.empty();
        }
        if (jwt.getIssuedAt() == null || jwt.getExpiresAt() == null) {
            logger.warn("Rejected gateway JWT for provider {} because iat or exp is missing", providerCode());
            return Optional.empty();
        }

        String username = trimToNull(jwt.getClaim("username").asString());
        if (username == null) {
            logger.warn("Rejected gateway JWT for provider {} because username claim is empty", providerCode());
            return Optional.empty();
        }

        try {
            return Optional.of(oAuthLoginFlowService.authenticate(toOAuthClaims(jwt, username)));
        } catch (AccountPendingException ex) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.local.accountPending");
        } catch (AccountDisabledException ex) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.auth.local.accountDisabled");
        } catch (OAuth2AuthenticationException ex) {
            throw new AuthFlowException(HttpStatus.FORBIDDEN, "error.forbidden");
        }
    }

    private OAuthClaims toOAuthClaims(DecodedJWT jwt, String username) {
        String email = trimToNull(jwt.getClaim("email").asString());
        String name = trimToNull(jwt.getClaim("name").asString());
        String displayName = name != null ? name : username;
        Map<String, Object> extra = new LinkedHashMap<>();
        extra.put("username", username);
        if (name != null) {
            extra.put("name", name);
        }
        if (email != null) {
            extra.put("email", email);
        }
        return new OAuthClaims(providerCode(), username, email, email != null, displayName, extra);
    }

    private String readGatewayToken(HttpServletRequest request) {
        String configuredHeader = normalizedOrDefault(properties.getHeaderName(), "X-Enterprise-Authorization");
        return trimToNull(request.getHeader(configuredHeader));
    }

    private static String normalizedOrDefault(String value, String defaultValue) {
        String normalized = trimToNull(value);
        return normalized != null ? normalized : defaultValue;
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static boolean isBlank(String value) {
        return trimToNull(value) == null;
    }
}
