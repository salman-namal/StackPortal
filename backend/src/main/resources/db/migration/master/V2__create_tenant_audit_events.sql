CREATE TABLE tenant_audit_events (
    id BIGSERIAL PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    action VARCHAR(40) NOT NULL,
    actor_email VARCHAR(150),
    detail VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ix_tenant_audit_events_tenant_created
    ON tenant_audit_events (tenant_id, created_at DESC);
