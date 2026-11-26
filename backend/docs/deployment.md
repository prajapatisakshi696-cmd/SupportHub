# Production deployment

SupportHub uses separate Vercel (frontend), Render (Express API), MongoDB Atlas,
and Cloudinary services. Keep the frontend and API as separate deployments;
the Express API remains the business-logic and authorization layer.

## 1. Prepare MongoDB Atlas

1. Create a production cluster and a database user with access only to the
   SupportHub database.
2. Restrict Atlas network access to the Render service's outbound IP ranges
   where practical. Avoid leaving `0.0.0.0/0` enabled.
3. Copy the application connection string and URL-encode special characters
   in the database username or password.
4. Run the category seed once after configuring the production API:

   ```powershell
   npm run seed:categories --workspace backend
   ```

## 2. Deploy the API to Render

Create a Web Service from the repository with the repository root as the
service root. Configure:

- Build command: `npm ci`
- Start command: `npm run start:backend`
- Health check path: `/api/v1/health`
- Runtime: Node.js 20.19 or newer

Set these Render environment variables:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `FRONTEND_URL` | Exact deployed frontend origin, for example `https://supporthub.vercel.app` |
| `ACCESS_TOKEN_SECRET` | Unique random secret of at least 64 characters |
| `REFRESH_TOKEN_SECRET` | A different unique random secret of at least 64 characters |
| `COOKIE_SAME_SITE` | `none` for separate Vercel/Render sites |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Production mail provider credentials |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials, required for uploads |

Render supplies `PORT`. Do not add a second server or port for Socket.IO; it
shares the Express HTTP server. The API checks that the database and auth
configuration are valid before starting.

Generate token secrets with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

For Vercel and Render on different sites, cookies must use
`COOKIE_SAME_SITE=none`; production mode makes them `Secure` and they remain
`HttpOnly`. Use HTTPS for both deployments. Set `FRONTEND_URL` to the stable
frontend origin exactly; browser API and Socket.IO requests from other origins
are rejected.

## 3. Deploy the frontend to Vercel

Import the same repository as a Vercel project and select `frontend` as the
Root Directory. Use the existing Next.js build command (`npm run build`) and
set:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<render-service>.onrender.com/api/v1` |

The project is an npm-workspaces monorepo; keep the root `package-lock.json`
available to Vercel and use its detected npm install command. Set the Render
`FRONTEND_URL` to the final Vercel production domain (or your stable custom
domain). Preview deployments need a matching backend origin to use
cookie-authenticated APIs and sockets.

## 4. Verify the deployment

1. Open `https://<render-service>.onrender.com/api/v1/health`.
2. Register a customer, create a ticket, and verify the customer and staff
   workspaces remain role-specific.
3. Provision admin and agent accounts through a trusted, out-of-band process;
   public registration intentionally cannot select a privileged role.
4. Confirm a customer cannot open `/admin/*` or call admin APIs.
5. Test ticket replies, notifications, SLA alerts, file uploads, and password
   reset email after configuring their respective services.

Use the local examples in `backend/.env.example` and `frontend/.env.example`
only as templates. Do not copy production credentials into source control.
