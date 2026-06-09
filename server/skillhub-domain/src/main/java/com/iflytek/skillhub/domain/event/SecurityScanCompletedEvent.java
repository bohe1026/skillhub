package com.iflytek.skillhub.domain.event;

import com.iflytek.skillhub.domain.security.ScannerType;
import com.iflytek.skillhub.domain.security.SecurityVerdict;

/**
 * Published after a scanner result has been persisted and the skill version has
 * moved out of SCANNING. Application listeners can safely start follow-up
 * workflows, such as automatic review, without racing the audit write.
 */
public record SecurityScanCompletedEvent(
        Long versionId,
        ScannerType scannerType,
        SecurityVerdict verdict,
        boolean safe
) {
}
