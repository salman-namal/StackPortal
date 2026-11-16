# PostgreSQL inventory and baseline procedure

Run these commands with a read-only PostgreSQL role against the master database
and against every tenant database recorded in `tenants`. Do not execute Flyway
or DDL during this assessment.

```sql
SELECT current_database(), version();
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
SELECT c.relname AS table_name, i.relname AS index_name, pg_get_indexdef(i.oid) AS definition
FROM pg_class c
JOIN pg_index x ON c.oid = x.indrelid
JOIN pg_class i ON i.oid = x.indexrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
ORDER BY c.relname, i.relname;
SELECT tc.table_name, tc.constraint_name, tc.constraint_type,
       kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position;
SELECT * FROM flyway_schema_history ORDER BY installed_rank;
```

If `flyway_schema_history` does not exist, record that fact rather than treating
it as an error. Record PostgreSQL version, extensions, roles, database owner,
row counts, and the result of a backup/restore rehearsal outside the application
repository.

## Compatibility decision

* A master database is eligible only when `tenants` matches the approved master
  schema inventory.
* A tenant database is eligible only when all tenant auth tables and V3 columns
  (`username`, `provider`, `provider_id`) match the approved inventory.
* Databases failing either check must remain out of Flyway and receive a
  case-specific forward compatibility migration after review.
* Never infer V3 solely from a table name; baseline version is an approved
  operational decision recorded per database.

## Baseline execution gate

Before any existing database is baselined: take verified backups, approve the
inventory report, confirm Flyway history is absent or understood, test the same
operation on a restored staging copy, and set the migration flag only for the
controlled deployment job. The application defaults to migration execution off.
