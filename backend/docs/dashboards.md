# Admin and agent dashboards

Dashboard responses are computed from MongoDB ticket and user data. These
endpoints require the corresponding active authenticated role.

## Endpoints

- `GET /api/v1/dashboard/admin` — admin ticket counts by status, active
  customer/agent counts, active unassigned workload, 14-day ticket-created
  series, average resolution hours, and the five agents with the most
  resolutions in the previous 30 days.
- `GET /api/v1/dashboard/agent` — the authenticated agent's assigned ticket
  counts, resolutions and average resolution time for the previous 30 days,
  active unassigned queue count, and 14-day resolution series.
- `GET /api/v1/dashboard/customer` — ticket counts and five most recently
  updated tickets belonging to the authenticated customer.
- `GET /api/v1/agents` — admin-only list of active agents for ticket
  assignment.

Average resolution hours use `resolvedAt - createdAt` for tickets with a
resolution timestamp. The dashboards return `null` when there are no resolved
tickets to average. Ticket series return real daily counts, including zero-count
days, so charts do not need fabricated sample data.

The admin UI is at `/admin/dashboard` and `/admin/tickets`. The agent UI is at
`/agent/dashboard` and `/agent/tickets`. Both route groups check the session
role in the frontend and their APIs enforce the same role on the backend.
