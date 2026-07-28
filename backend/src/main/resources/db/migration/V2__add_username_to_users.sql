ALTER TABLE users ADD COLUMN username VARCHAR(150);

UPDATE users
SET username = LEFT(SPLIT_PART(email, '@', 1), 130) || '_' || id
WHERE username IS NULL;

ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);
