package com.iflytek.skillhub.auth.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for enterprise gateway JWT session bootstrap.
 *
 * <p>The gateway injects a signed JWT header. The app must verify the HS256
 * signature with the per-application secret before trusting any claims.
 */
@ConfigurationProperties(prefix = "skillhub.auth.gateway-jwt")
public class GatewayJwtAuthProperties {

    private boolean enabled = false;
    private String providerCode = "enterprise-sso";
    private String displayName = "企业 SSO";
    private String headerName = "X-Enterprise-Authorization";
    private String secret = "";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getProviderCode() {
        return providerCode;
    }

    public void setProviderCode(String providerCode) {
        this.providerCode = providerCode;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getHeaderName() {
        return headerName;
    }

    public void setHeaderName(String headerName) {
        this.headerName = headerName;
    }

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }
}
