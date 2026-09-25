-- V2__add_username_to_users.sql

-- Add username column if it does not already exist
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS username VARCHAR(150);

-- Populate username for existing users
UPDATE public.users
SET username = LEFT(SPLIT_PART(email, '@', 1), 130) || '_' || id
WHERE username IS NULL;

-- Make username required
ALTER TABLE public.users
    ALTER COLUMN username SET NOT NULL;

-- Create unique index for username if it does not already exist
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_username
    ON public.users (username);