package com.iflytek.skillhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "skillhub.auth.local.self-service")
public class LocalAuthSelfServiceProperties {

    /**
     * Private deployments should create users through administrators instead
     * of allowing anonymous visitors to self-register.
     */
    private boolean registrationEnabled = false;

    /**
     * Allows users to self-register only when they provide a valid invite code.
     */
    private boolean inviteRegistrationEnabled = true;

    /**
     * Email-based password recovery is disabled by default because private
     * installs often do not have a working outbound mail channel.
     */
    private boolean passwordResetEnabled = false;

    public boolean isRegistrationEnabled() {
        return registrationEnabled;
    }

    public void setRegistrationEnabled(boolean registrationEnabled) {
        this.registrationEnabled = registrationEnabled;
    }

    public boolean isInviteRegistrationEnabled() {
        return inviteRegistrationEnabled;
    }

    public void setInviteRegistrationEnabled(boolean inviteRegistrationEnabled) {
        this.inviteRegistrationEnabled = inviteRegistrationEnabled;
    }

    public boolean isPasswordResetEnabled() {
        return passwordResetEnabled;
    }

    public void setPasswordResetEnabled(boolean passwordResetEnabled) {
        this.passwordResetEnabled = passwordResetEnabled;
    }
}
