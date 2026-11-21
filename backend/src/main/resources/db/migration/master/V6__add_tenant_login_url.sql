ALTER TABLE tenants ADD COLUMN IF NOT EXISTS login_url VARCHAR(500);
UPDATE tenants SET login_url = 'http://' || code || '.localhost:4200/auth/login'
WHERE login_url IS NULL OR btrim(login_url) = '';
ALTER TABLE tenants ALTER COLUMN login_url SET NOT NULL;
