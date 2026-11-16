# Issue #19 automated QA matrix

This matrix uses synthetic identities and disposable PostgreSQL databases only.
No production or shared database may be configured for these tests.

| ID | Scope | Required automated assertion | Status |
|---|---|---|---|
| RBAC-001 | `/api/users` | Anonymous is 401; USER and MANAGER are 403; ADMIN and SUPER_ADMIN succeed only in their own tenant | Regression test added; currently expected to fail because controller authorization is absent |
| RBAC-002 | `/api/tenants` | Only SUPER_ADMIN succeeds; all denied requests leave master records unchanged | Pending Testcontainers/MockMvc execution |
| ISO-001 | JWT routing | Tenant A JWT with tenant B header/code/subdomain is denied | Existing filter coverage; expand with Testcontainers |
| ISO-002 | Data isolation | Overlapping user IDs/emails and token values do not cross tenant datasource boundaries | Pending disposable PostgreSQL environment |
| AUTH-001 | Registration | Validation, duplicate username/email, tenant-local USER assignment, hashed password | Pending MockMvc/service tests |
| AUTH-002 | Verification | Valid/expired/invalid/reused OTP and resend invalidation | Pending integration tests |
| AUTH-003 | Sessions | Login, invalid credentials, disabled/unverified users, refresh expiry/revocation/replay and logout | Unit coverage started; integration pending |
| AUTH-004 | Recovery | Invalid/expired/reused reset token and existing session behavior after reset | Pending regression tests; reset-session policy needs remediation decision |
| AUTH-005 | Google | Valid verified identity, invalid audience/token and provider/email-linking behavior using mocks | Pending mocked service tests |
| FE-001 | Guards | USER/MANAGER direct navigation to user screens is denied; ADMIN/SUPER_ADMIN allowed | Blocked: Angular project has no configured test target |
| FE-002 | Session UX | Expired token, refresh, logout, browser refresh, error/session cleanup and tenant-header propagation | Blocked: Angular project has no configured test target |
| E2E-001 | Browser | Auth workflows and role navigation in a disposable environment | Blocked: Playwright is not installed/configured |

## Evidence rules

Capture only synthetic request/response metadata, expected/actual status, tenant label,
database assertion, commit SHA and sanitized screenshots. Never commit or publish
passwords, OTPs, JWTs, refresh tokens or customer data.
