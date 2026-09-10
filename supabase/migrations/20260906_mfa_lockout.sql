-- Anti-brute-force lockout for TOTP verification.
-- /api/auth/verify-mfa had no rate limiting, allowing unlimited guesses
-- against a user's 6-digit code. These columns let the endpoint lock an
-- account out for a cooldown period after repeated failures.
alter table public.user_mfa_settings
  add column if not exists failed_attempts int not null default 0,
  add column if not exists locked_until timestamptz;
