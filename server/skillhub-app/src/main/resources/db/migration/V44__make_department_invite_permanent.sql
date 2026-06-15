ALTER TABLE registration_invite
    ALTER COLUMN expires_at DROP NOT NULL;

UPDATE registration_invite
SET
    label = 'AI department permanent invite',
    expires_at = NULL,
    updated_at = now()
WHERE code = 'TEAM-AI-2026-7D-M9Q4-X7K2-P8VN-L3R6';

COMMENT ON COLUMN registration_invite.expires_at IS 'Expiration time. NULL means the invite never expires unless revoked';
