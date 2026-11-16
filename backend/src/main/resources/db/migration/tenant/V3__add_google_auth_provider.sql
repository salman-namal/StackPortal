ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
ALTER TABLE users ADD COLUMN provider VARCHAR(20) DEFAULT 'LOCAL';
ALTER TABLE users ADD COLUMN provider_id VARCHAR(255);
UPDATE users SET provider = 'LOCAL' WHERE provider IS NULL;
ALTER TABLE users ALTER COLUMN provider SET NOT NULL;
CREATE UNIQUE INDEX uk_users_provider_id ON users (provider_id);
