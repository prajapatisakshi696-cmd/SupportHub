# Authentication API

All routes are prefixed with `/api/v1/auth`. JSON validation errors return
`400`; invalid credentials or expired sessions return `401`; an origin outside
`FRONTEND_URL` is rejected with `403`.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/register` | Create a customer account and start a session. |
| `POST` | `/login` | Verify credentials and start a session. |
| `POST` | `/logout` | Revoke the refresh token and clear auth cookies. |
| `POST` | `/refresh` | Rotate the refresh token and issue a new access token. |
| `GET` | `/me` | Return the authenticated user's safe profile. |
| `PATCH` | `/me` | Update the authenticated user's display name. |
| `POST` | `/change-password` | Change password and revoke active refresh sessions. |
| `POST` | `/forgot-password` | Email a one-time reset link when SMTP is configured. |
| `POST` | `/reset-password` | Consume a reset link and update the password. |

Registration accepts `{ "name", "email", "password" }`. Role is assigned by the
backend and cannot be selected by the client. Login and forgot-password accept
`{ "email", "password" }` and `{ "email" }` respectively. Reset-password accepts
`{ "email", "token", "password" }`. Passwords must contain at least 12
characters and at most 72 UTF-8 bytes for bcrypt compatibility.

## Session handling

The API issues a 15-minute access JWT and a seven-day refresh JWT in separate
HttpOnly cookies. Refresh tokens are stored as SHA-256 hashes and rotated
atomically. Password reset and password change revoke refresh sessions;
password-change timestamps invalidate access tokens issued before the change.
Roles used for authorization are loaded from MongoDB, not accepted from request
data or trusted from a JWT role claim.

Cookies use `SameSite=Lax` for local development. For separate production
frontend/API sites, use HTTPS and set `COOKIE_SAME_SITE=none`. CORS credentials
and an origin check are enabled for the configured `FRONTEND_URL`. API clients
without an `Origin` header are still allowed.

Set two independent, high-entropy secrets in `backend/.env`. Password-reset
email delivery requires `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and
`SMTP_FROM`; reset tokens are never returned by the API.
