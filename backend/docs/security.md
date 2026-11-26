# Security and verification notes

- Express uses Helmet, a 1 MB JSON body limit, Zod request validation, and
  bounded multipart uploads with server-side file signature checks.
- API requests with a browser `Origin` must match `FRONTEND_URL`; requests
  without an `Origin` header remain available for server-to-server clients.
  Socket.IO checks the same origin in addition to authenticating the access
  cookie.
- Access and refresh cookies are HttpOnly. Production cookies are Secure;
  cross-site Vercel/Render deployments require `COOKIE_SAME_SITE=none`.
- JWT access and refresh tokens use separate secrets and token purposes.
  Password changes invalidate older sessions. Backend routes enforce role and
  ticket ownership independently of frontend guards.
- Login, registration, password-reset, and other auth routes use rate limits.
  Do not expose a public role-selection option; registration always creates a
  customer account.
- Upload limits and ticket access are checked by the API before generating
  private Cloudinary download links.

Run the backend tests and production frontend build from the repository root:

```powershell
npm test --workspace backend
npm run build --workspace frontend
```

The automated suite covers validation, auth/role guards, ticket policies,
message privacy, Socket.IO handshake origin/authentication, notifications,
SLA settings, and upload signatures. A live MongoDB/Atlas deployment check is
still required for database-backed analytics, SLA scheduling, email, and
Cloudinary behavior.
