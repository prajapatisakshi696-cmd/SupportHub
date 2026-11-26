# Notifications

Notifications are persisted for an individual recipient before a real-time
event is emitted. REST routes require authentication and always scope records
to the signed-in user; clients cannot choose a recipient.

## REST API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/notifications?page=1&limit=20` | Return newest notifications, pagination, and the recipient's unread count. `limit` is capped at 100. |
| `PATCH` | `/api/v1/notifications/:notificationId/read` | Mark one owned notification as read. |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all of the current user's unread notifications as read. |

Attempting to mark another user's notification as read returns `404`, without
revealing whether that notification exists.

## Real-time delivery

The authenticated Socket.IO handshake joins a server-assigned
`user:<userId>` room. Clients cannot request arbitrary user rooms. Persisted
notifications are delivered to that room as `notification:new`; the workspace
invalidates its RTK Query cache and refreshes the unread badge and list. If the
client is offline, the notification remains available through the REST API.

Ticket creation notifies active staff and the customer. Assignment notifies
the assigned agent and customer. Public replies notify the other participant;
if a ticket is unassigned, active staff are notified for triage. Status changes
notify the customer, while customer reopen actions notify the assigned agent
or active staff. Internal notes never create customer notifications.

If notification persistence fails after a ticket operation, the ticket
operation remains successful and the API response includes a
`notificationWarning`; the failure is also logged. Message acknowledgements
include the same warning alongside other post-save activity warnings.
