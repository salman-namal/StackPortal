-- Profile fields added without removing or rewriting existing tenant data.
ALTER TABLE tenants
    ADD COLUMN IF NOT EXISTS admin_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- A Base64 data URL for a 2 MB image is substantially larger than VARCHAR(255).
-- Existing URL/path values remain valid text values after this conversion.
ALTER TABLE tenants
    ALTER COLUMN logo TYPE TEXT;

-- Provide a safe, meaningful value for historical records that predate admin_name.
UPDATE tenants
SET admin_name = name
WHERE admin_name IS NULL OR btrim(admin_name) = '';
