package com.iflytek.skillhub.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "skillhub.auto-review")
public class AutoReviewProperties {

    /**
     * Disabled by default so operators can deploy the code first and then turn
     * on automatic decisions only after confirming their review threshold.
     */
    private boolean enabled = false;
    /**
     * Skill Judge scores out of 120. The default pass score is grade B.
     */
    private int passScore = 96;
    /**
     * System actor recorded on the generated review task decision.
     */
    private String reviewerId = "system-auto-review";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public int getPassScore() {
        return passScore;
    }

    public void setPassScore(int passScore) {
        this.passScore = passScore;
    }

    public String getReviewerId() {
        return reviewerId;
    }

    public void setReviewerId(String reviewerId) {
        this.reviewerId = reviewerId;
    }
}
