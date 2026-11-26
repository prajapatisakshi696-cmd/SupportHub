# SupportHub

SupportHub is a customer-support SaaS built as two independent applications in one npm-workspaces repository:

- `frontend/` — Next.js App Router UI.
- `backend/` — Express REST API and Socket.io service.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer

## Local setup

From the repository root:

```powershell
npm install
if (-not (Test-Path backend\.env)) { Copy-Item backend\.env.example backend\.env }
if (-not (Test-Path frontend\.env.local)) { Copy-Item frontend\.env.example frontend\.env.local }
```

Run each app in its own terminal:

```powershell
npm run dev:backend
npm run dev:frontend
```

The frontend is served at `http://localhost:3000`. The API health check is at
`http://localhost:5000/api/v1/health`.

The backend requires MongoDB. The example backend environment file uses a local
MongoDB instance; set `MONGODB_URI` in `backend\.env` to your local or Atlas
connection string. The API waits for a successful database connection before
it starts accepting requests.

Authentication requires distinct `ACCESS_TOKEN_SECRET` and
`REFRESH_TOKEN_SECRET` values in `backend\.env`. Generate each with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The password-reset endpoint also requires SMTP settings in `backend\.env`.

To create a production frontend build, run `npm run build`. Start the built
applications with `npm run start:frontend` and `npm run start:backend`.

## Initial architecture

```text
frontend/
  src/app/       App Router pages and global styles
  src/components/ reusable UI components
  src/features/  feature-oriented UI modules
  src/lib/       shared frontend utilities
  src/hooks/     reusable React hooks
  src/services/  API service integrations
  src/store/     Redux store (introduced in the authentication phase)
  src/layouts/   shared page layouts
  src/utils/     frontend helpers
  public/        static assets
backend/
  src/config/    runtime configuration and database setup
  src/models/    Mongoose models
  src/controllers/
  src/services/
  src/routes/    versioned Express routes
  src/middleware/
  src/validators/
  src/sockets/
  src/jobs/
  src/utils/
  src/tests/
  docs/
```

The frontend talks to the versioned Express API through `NEXT_PUBLIC_API_URL`.
Business logic and authorization belong in the backend, not in Next.js route
handlers. Phase 1 established the runnable application shells. Phase 2 adds
MongoDB connectivity and model definitions; authentication and product features
follow in subsequent phases.

## Database models

The backend defines Mongoose models for users, tickets, messages, categories,
notifications, ticket activity, refresh tokens, password-reset tokens,
audit logs, and company settings. Schema-level checks can be run with `npm test --workspace backend`;
they do not require a running MongoDB server.
See [backend/docs/database-models.md](./backend/docs/database-models.md) for
relationships, constraints, and indexing details.

## Authentication

Phase 3 adds customer registration, login, logout, refresh, password reset,
profile updates, and password changes under `/api/v1/auth`. See
[backend/docs/authentication.md](./backend/docs/authentication.md) for request
shapes and cookie/session behavior. Authentication tests run with
`npm test --workspace backend`.

## Tickets API

Phase 4 adds role-scoped ticket creation, filtering, assignment, claiming, and
status/priority updates under `/api/v1/tickets`. Seed starter categories after
configuring MongoDB by running `npm run seed:categories --workspace backend`.
See [backend/docs/tickets.md](./backend/docs/tickets.md) for the routes and
access rules.

## Analytics and SLA

Phase 9 adds priority-based resolution targets, ticket deadlines, scheduled
SLA warning/breach notifications, and database-backed admin analytics for
7-, 30-, and 90-day periods. Admins can update targets at `/admin/settings`;
analytics are available at `/admin/analytics`. See
[backend/docs/analytics-sla.md](./backend/docs/analytics-sla.md) for calculation
and notification details.

## Security and deployment

Phase 10 documents production deployment to Vercel, Render, MongoDB Atlas, and
Cloudinary, and adds API/socket origin checks for cookie-authenticated browser
requests. Follow [backend/docs/deployment.md](./backend/docs/deployment.md) for
service configuration and [backend/docs/security.md](./backend/docs/security.md)
for security controls and verification commands.

## Admin and agent workspaces

Phase 5 adds role-protected `/admin/dashboard`, `/admin/tickets`,
`/agent/dashboard`, and `/agent/tickets` pages. Dashboard cards, trends, agent
performance, and ticket lists load from the Express API. The admin agent picker
uses the restricted active-agents endpoint. See
[backend/docs/dashboards.md](./backend/docs/dashboards.md) for the summary data
definitions.

## Customer portal

The customer workspace is available at `/customer/dashboard`,
`/customer/tickets`, `/customer/tickets/new`, and each ticket's detail route.
Customers can create tickets, search/filter their own requests, view status
history, download private attachments, and reopen recently resolved tickets.
Set the three `CLOUDINARY_*` variables in `backend/.env` to enable file
attachments; ticket creation without files does not require Cloudinary.

## Real-time ticket conversations

Customer, agent, and admin ticket detail pages include persisted real-time
messaging. Staff can add private internal notes; typing indicators and read
receipts are scoped to authorized ticket rooms. See
[backend/docs/messaging.md](./backend/docs/messaging.md) for Socket.IO events,
access rules, and message history pagination.

## Notifications

Phase 8 adds persisted, role-scoped notifications for ticket creation,
assignment, public replies, and status changes. Each workspace has an unread
badge and a notification history page with mark-read actions. Notification
delivery uses authenticated Socket.IO user rooms; internal notes are not
surfaced to customers. See
[backend/docs/notifications.md](./backend/docs/notifications.md) for routes,
delivery behavior, and access rules.
