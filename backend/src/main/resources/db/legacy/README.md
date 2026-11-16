# Legacy migration archive

The SQL files in this directory are preserved exactly as historical evidence.
They are deliberately excluded from Flyway locations. Existing databases must
be inspected and explicitly baselined before the new scoped Flyway locations
are used. `V4__insert_default_tenant_and_superadmin.sql` is not a supported
bootstrap path because it mixes master and tenant ownership and contains
unsafe development credentials.
