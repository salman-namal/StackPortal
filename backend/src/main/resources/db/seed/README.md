# Seed data policy

Schema migrations must not create known administrator credentials or embed
database connection details. First-administrator setup is an explicit,
environment-secret-driven operational action after a tenant has been safely
provisioned and migrated.
