CREATE TABLE registration_invite (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(128) NOT NULL UNIQUE,
    label VARCHAR(160),
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(128),
    revoked_by VARCHAR(128),
    revoked_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registration_invite_expires_at ON registration_invite(expires_at);
CREATE INDEX idx_registration_invite_revoked ON registration_invite(revoked);

INSERT INTO registration_invite (
    code,
    label,
    max_uses,
    expires_at,
    created_by
) VALUES (
    'TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6',
    'AI department bootstrap invite',
    NULL,
    now() + INTERVAL '7 days',
    'system-bootstrap'
);

COMMENT ON TABLE registration_invite IS 'Invite codes required for private local self-registration';
COMMENT ON COLUMN registration_invite.code IS 'Human-readable invite code shared with eligible users';
COMMENT ON COLUMN registration_invite.max_uses IS 'Maximum allowed uses. NULL means unlimited until expiry or revocation';
