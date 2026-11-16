-- Additive indexes only; safe for legacy tenant databases after a verified V3 baseline.
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_expires_at ON refresh_tokens (expires_at);
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_password_reset_tokens_expires_at ON password_reset_tokens (expires_at);
CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_user_id ON email_verification_tokens (user_id);
CREATE INDEX IF NOT EXISTS ix_email_verification_tokens_expires_at ON email_verification_tokens (expires_at);
