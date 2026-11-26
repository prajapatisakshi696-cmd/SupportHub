# Tickets API

All ticket endpoints are prefixed with `/api/v1`. Requests require an active
session. Ticket creation and updates are validated by Zod; the API does not
accept customer, status-history, or assignment fields from ticket creators.

## Endpoints

| Method | Path | Access |
| --- | --- | --- |
| `GET` | `/categories` | Any authenticated user; active categories only. |
| `POST` | `/tickets` | Customer; creates a ticket owned by the session user. |
| `GET` | `/tickets` | Customer's own tickets, agent queue, or admin listing. |
| `GET` | `/tickets/:ticketId` | Owner, assigned agent, agent for active unassigned ticket, or admin. |
| `GET` | `/tickets/:ticketId/attachments/:attachmentId` | Ticket owner, assigned agent, eligible agent, or admin; redirects to a short-lived private download URL. |
| `POST` | `/tickets/:ticketId/claim` | Agent; atomically claims an open or in-progress unassigned ticket. |
| `POST` | `/tickets/:ticketId/assign` | Admin; assign, reassign, or unassign an active agent. |
| `PATCH` | `/tickets/:ticketId/status` | Owner may reopen eligible resolved tickets; staff may update workflow status. |
| `PATCH` | `/tickets/:ticketId/priority` | Assigned agent or admin. |

Create a ticket as JSON (without files) or as `multipart/form-data` (with files)
using these fields:

```json
{
  "subject": "Unable to update billing details",
  "description": "The billing form returns an error when I save.",
  "categoryId": "MongoDB category ObjectId",
  "priority": "medium"
}
```

The authenticated customer is always set as the owner by the backend. Ticket
numbers are allocated sequentially as `SUP-10001`, `SUP-10002`, and so on.
Each new ticket snapshots a deadline from its priority's configured SLA target.
See [analytics and SLA](./analytics-sla.md) for target configuration and
reopen/reprioritization behavior.
Ticket creation accepts up to five JPEG, PNG, WebP, or PDF attachments, with a
5 MB maximum per file. File content signatures are checked server-side.
Attachments are stored as private Cloudinary assets; the API verifies ticket
access before returning a 60-second download redirect. Configure
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in
the backend environment to enable uploads.
`GET /tickets` supports `page`, `limit` (maximum 100), `scope`, `status`,
`priority`, `categoryId`, `assignedAgentId` (admin only), `q`, `sortBy`, and
`sortOrder`. Responses contain `tickets` and pagination totals.

Agents can list their assigned tickets by default or use `scope=unassigned` for
the active queue. They cannot request `scope=all` or read tickets assigned to
another agent. Customer list/detail queries are scoped to the authenticated
customer. A customer can reopen a resolved ticket for seven days after
resolution; closed tickets are not customer-reopenable.

`GET /api/v1/dashboard/customer` returns status counts and the five most
recently updated tickets for the authenticated customer only.

Every creation, assignment, status change, and priority change writes a
`TicketActivity` record. Status changes also append the ticket's embedded
`statusHistory`. Ticket conversation messages and internal notes are added in
the real-time messaging phase.

Run `npm run seed:categories --workspace backend` once the MongoDB URI is
configured. The seed command inserts starter categories without overwriting
existing category changes.
