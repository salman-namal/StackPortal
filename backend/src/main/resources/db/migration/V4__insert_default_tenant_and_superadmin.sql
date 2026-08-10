-- Insert default tenant and super admin user (idempotent)

-- Enable pgcrypto for bcrypt hashing (requires pg extension privileges)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Create default tenant 'Stack' if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE code = 'stack') THEN
        INSERT INTO tenants (
            name, code, logo, email, website, phone, address, city, country,
            database_name, database_url, database_username, database_password,
            status, created_at, updated_at
        ) VALUES (
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
        );
    END IF;
END $$;

-- 2) Create super admin user if it doesn't exist, using pgcrypto's crypt() to store bcrypt hash
DO $$
DECLARE
    role_id BIGINT;
    user_id BIGINT;
BEGIN
    -- Ensure the SUPER_ADMIN role exists
    SELECT id INTO role_id FROM roles WHERE role_name = 'SUPER_ADMIN' LIMIT 1;
    IF role_id IS NULL THEN
        RAISE NOTICE 'SUPER_ADMIN role not found; please ensure roles table contains SUPER_ADMIN';
        RETURN;
    END IF;

    -- Insert user if not exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'superadmin@gmail.com') THEN
        INSERT INTO users (name, email, username, password, active, email_verified, created_at, updated_at)
        VALUES (
            'Super Admin',
            'superadmin@gmail.com',
            'superadmin',
            crypt('admin123@', gen_salt('bf', 10)),
            TRUE,
            TRUE,
            NOW(),
            NOW()
        )
        RETURNING id INTO user_id;
    ELSE
        SELECT id INTO user_id FROM users WHERE email = 'superadmin@gmail.com' LIMIT 1;
    END IF;

    -- Assign SUPER_ADMIN role to user (idempotent)
    IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = user_id AND role_id = role_id) THEN
        INSERT INTO user_roles (user_id, role_id) VALUES (user_id, role_id);
    END IF;
END $$;
