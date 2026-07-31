## Stack Portal – User Management System

**Tech stack**: Angular (frontend), Spring Boot (Java 17+, backend), PostgreSQL, JWT auth, RBAC, Flyway, Gmail SMTP.

---

### Backend – Spring Boot

- **Project**: `backend`
- **Key modules**:
  - `auth`: registration, login, logout, refresh token, email verification, forgot/reset password, Google login (contract in `GoogleOAuth2Service`).
  - `user`: RBAC (`SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`), user CRUD, activate/deactivate, assign roles, list/search.
  - `security`: JWT service and filter, stateless Spring Security config with role-based protection.
  - `token`: entities and repositories for email verification, password reset, and refresh tokens.
  - `common/exception`: `ApiResponse<T>` wrapper and global exception handler.
  - `config`: `SecurityConfig`.

**Main endpoints (all JSON, wrapped in `ApiResponse`):**

- `/api/auth/register` `POST` – register with `name`, `email`, `password`; sends verification email.
- `/api/auth/login` `POST` – returns `accessToken`, `refreshToken`, `roles`.
- `/api/auth/refresh-token` `POST` – refresh JWT with `refreshToken` query param.
- `/api/auth/logout` `POST` – revoke refresh token (blacklist).
- `/api/auth/verify-email` `GET` – verify email with `token` query param.
- `/api/auth/forgot-password` `POST` – send password reset link.
- `/api/auth/reset-password` `POST` – reset password using token.
- `/api/auth/google-login` `POST` – login with Google ID token (implement verification in `GoogleOAuth2Service`).
- `/api/admin/users` (secured: `ROLE_SUPER_ADMIN` or `ROLE_ADMIN`):
  - `POST` – create user.
  - `PUT /{id}` – update user.
  - `DELETE /{id}` – delete user.
  - `POST /{id}/activate` – activate user.
  - `POST /{id}/deactivate` – deactivate user.
  - `POST /{id}/roles` – assign roles.
  - `GET` – list users (paged, placeholder search).

**Database & Flyway**

- DB: PostgreSQL `stack_portal`
- Migrations: `backend/src/main/resources/db/migration/V1__init.sql`
  - Tables: `users`, `roles`, `user_roles`, `password_reset_tokens`, `email_verification_tokens`, `refresh_tokens`.
  - Seeds roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `USER`.

**Email (Gmail SMTP)**

- Config in `backend/src/main/resources/application.yml`:
  - Uses `spring.mail.host=smtp.gmail.com`, port `587`, TLS enabled.
  - `spring.mail.username` / `spring.mail.password` are read from env vars `MAIL_USERNAME` / `MAIL_PASSWORD` (with placeholders).
- Notifications:
  - Registration verification email.
  - Password reset email.
  - Account activation/deactivation email.

**Security**

- Spring Security 6 / Boot 3:
  - Stateless JWT via `JwtAuthenticationFilter`.
  - Role-based method security (`@PreAuthorize`) on admin controller.
  - Password hashing with BCrypt.
  - Input validation via Jakarta Bean Validation on DTOs.

**Running backend**

1. Create PostgreSQL database:
   - `CREATE DATABASE stack_portal;`
2. Set environment variables (recommended):
   - `JWT_SECRET` – long base64-encoded secret.
   - `MAIL_USERNAME` – your Gmail address.
   - `MAIL_PASSWORD` – your app-specific Gmail password.
   - `GOOGLE_CLIENT_ID` – Google OAuth client ID (for Google login).
3. From `backend` folder:
   - `mvn clean install`
   - `mvn spring-boot:run`
4. Backend runs at the address configured by `BACKEND_URL`.

---

### Frontend – Angular

- **Project**: `frontend`
- **Modules**:
  - `auth`:
    - `LoginComponent`: email/password login.
    - `RegisterComponent`: registration form.
    - `ForgotPasswordComponent`: request reset email.
    - `ResetPasswordComponent`: set new password via token.
    - `Google login`: call `/api/auth/google-login` with Google ID token (UI wiring for actual Google button can be added).
  - `admin`:
    - `UserListComponent`: view users for admin.
    - `UserFormComponent`: create/edit users, set active state, assign roles.
  - `core`:
    - `AuthService`: handles auth APIs, JWT storage, role tracking.
    - `AuthGuard`: protects authenticated routes.
    - `RoleGuard`: enforces RBAC on routes.
    - `JwtInterceptor`: attaches `Authorization: Bearer <token>` header.
    - `ErrorInterceptor`: simple global HTTP error logger.

**Routing**

- Root routes:
  - `/auth/**` – lazy loads `AuthModule`.
  - `/admin/**` – lazy loads `AdminModule`, protected by `AuthGuard` + `RoleGuard` with required roles `[SUPER_ADMIN, ADMIN]`.

**Running frontend**

1. From `frontend` folder:
   - `npm install`
   - `npm start` (runs `ng serve` via Angular CLI)
2. Copy `frontend/.env.example` to `frontend/.env`, set the runtime values, then run `npm start`.

---

### Environment configuration

- **Backend**: Copy `backend/.env.example` to `backend/.env` and provide every value. Spring Boot loads this file when started from either the repository root or the backend directory; process environment variables take precedence.
- **Frontend**: Copy `frontend/.env.example` to `frontend/.env`. `npm start` and `npm run build` generate the browser runtime configuration from it. Do not put secrets in the frontend file because its values are visible to browser users.

---

### Notes & Next steps

- **Google login**: The `GoogleOAuth2Service.verifyIdToken` method is a stub; plug in Google’s official libraries (or a backend HTTP call) to validate ID tokens and map them to `GoogleUserInfo`.
- **Search & pagination**: `UserService.listUsers` currently uses basic paging; implement custom repository/specification for full-text or multi-field search if needed.
- **API docs**: For interactive docs, you can add SpringDoc OpenAPI (`springdoc-openapi-starter-webmvc-ui`) and expose Swagger UI under `/swagger-ui.html`.

