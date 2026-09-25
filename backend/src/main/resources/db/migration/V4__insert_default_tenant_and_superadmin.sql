-- Insert default tenant and super admin user (idempotent)

-- Enable pgcrypto for bcrypt hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- 1) Create default tenant 'Stack' if it does not exist
-- ============================================================

INSERT INTO tenants (
    name,
    code,
    logo,
    email,
    website,
    phone,
    address,
    city,
    country,
    database_name,
    database_url,
    database_username,
    database_password,
    status,
    created_at,
    updated_at
)
SELECT
    'Stack',
    'stack',
    NULL,
    'admin@stack.com',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'stack',
    'jdbc:postgresql://localhost:5432/stack_portal_master',
    'postgres',
    'admin',
    'ACTIVE',
    NOW(),
    NOW()
    WHERE NOT EXISTS (
    SELECT 1
    FROM tenants
    WHERE code = 'stack'
);


-- ============================================================
-- 2) Create super admin user if it does not exist
-- ============================================================

INSERT INTO users (
    name,
    email,
    username,
    password,
    active,
    email_verified,
    created_at,
    updated_at
)
SELECT
    'Super Admin',
    'superadmin@gmail.com',
    'superadmin',
    crypt('admin123@', gen_salt('bf', 10)),
    TRUE,
    TRUE,
    NOW(),
    NOW()
    WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'superadmin@gmail.com'
);


-- ============================================================
-- 3) Assign SUPER_ADMIN role to super admin
-- ============================================================

INSERT INTO user_roles (
    user_id,
    role_id
)
SELECT
    u.id,
    r.id
FROM users u
         CROSS JOIN roles r
WHERE u.email = 'superadmin@gmail.com'
  AND r.role_name = 'SUPER_ADMIN'
  AND NOT EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = u.id
      AND ur.role_id = r.id
);