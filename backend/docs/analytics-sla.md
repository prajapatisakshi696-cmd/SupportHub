# Analytics and service-level agreements

## SLA targets

Admins can read and update the priority targets:

- `GET /api/v1/settings/sla`
- `PATCH /api/v1/settings/sla`

The update body is `{ "slaHours": { "low": 72, "medium": 24, "high": 8, "urgent": 2 } }`.
Each value must be an integer from 1 through 8,760. Defaults are used when no
settings document exists.

Ticket creation snapshots the configured priority target into `slaDeadline`.
Changing a target affects new tickets. Reprioritizing an active ticket
recalculates its deadline from its original creation time. Reopening an
eligible resolved or closed ticket starts a new target window. Resolved and
closed tickets retain their deadline for historical SLA reporting.

The API starts a five-minute SLA monitor after the server begins listening. It
notifies the assigned agent and active admins one hour before an active ticket
is due, then once after it becomes overdue. Atomic marker updates prevent
duplicate alerts across multiple API instances. If notification persistence
fails, the marker is cleared for retry and the failure is logged.

## Analytics

`GET /api/v1/analytics/admin?days=30` is admin-only. Supported reporting
windows are 7, 30, and 90 days. The response includes ticket creation trends,
status and priority breakdowns, average resolution time, SLA compliance,
overdue and due-soon ticket counts, and agent resolution performance. SLA
compliance counts resolved tickets with a deadline and resolution timestamp,
and considers a ticket compliant when it was resolved by its deadline.

The admin overview and agent dashboard also show live counts of active tickets
that are overdue or due within one hour.
