ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'provider'
    ) THEN
        ALTER TABLE users ADD COLUMN provider VARCHAR(20) DEFAULT 'LOCAL';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'provider_id'
    ) THEN
        ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
    END IF;
END $$;

UPDATE users SET provider = 'LOCAL' WHERE provider IS NULL;
ALTER TABLE users ALTER COLUMN provider SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uk_users_provider_id'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT uk_users_provider_id UNIQUE (provider_id);
    END IF;
END $$;
