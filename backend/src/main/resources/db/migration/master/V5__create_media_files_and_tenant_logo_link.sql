CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size >= 0 AND file_size <= 2097152),
    file_data BYTEA NOT NULL,
    thumbnail_data BYTEA,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_id UUID;
ALTER TABLE tenants
    ADD CONSTRAINT fk_tenants_logo_media
    FOREIGN KEY (logo_id) REFERENCES media_files(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_logo_id ON tenants(logo_id);
