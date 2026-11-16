-- V3__add_oauth_provider_to_users.sql

-- 1. Allow password to be NULL
--    Required for OAuth/social-login users who do not have a local password.
ALTER TABLE public.users
    ALTER COLUMN password DROP NOT NULL;

-- 2. Add provider column if it does not already exist
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'LOCAL';

-- 3. Add provider_id column if it does not already exist
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS provider_id VARCHAR(255);

-- 4. Set LOCAL provider for existing users
UPDATE public.users
SET provider = 'LOCAL'
WHERE provider IS NULL;

-- 5. Make provider mandatory
ALTER TABLE public.users
    ALTER COLUMN provider SET NOT NULL;

-- 6. Create unique index for provider_id if it does not already exist
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_provider_id
    ON public.users (provider_id);