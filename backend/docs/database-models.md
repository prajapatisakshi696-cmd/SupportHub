# Database models

All models use Mongoose timestamps unless noted otherwise. References use
MongoDB ObjectIds; controller and service layers will enforce access control
when the API is added.

## Collections

- **User** stores a normalized unique email, role, account status, profile
  details, and a password hash. The hash and password-change timestamp are
  excluded from normal query results.
- **Ticket** references a customer, category, and optional assigned agent. It
  stores a unique `SUP-` ticket number, priority, status, attachment metadata,
  SLA deadline, and embedded status history.
- **Message** references its ticket and sender. `isInternal` defaults to
  `false`; message visibility must still be filtered by the API for customers.
- **Category** stores a unique slug, active state, creator, and display order.
- **Notification** references its recipient and a ticket or message resource,
  with `readAt` tracking unread state.
- **TicketActivity** provides a chronological event record for assignment,
  status, priority, and conversation events.
- **RefreshToken** stores a unique token hash rather than a raw token and uses a
  TTL index for expired-token cleanup.
- **PasswordResetToken** stores one short-lived token hash per user and removes
  expired reset records with a TTL index.
- **AuditLog** records actor, action, target, request metadata, and timestamp;
  its version key is disabled.
- **CompanySettings** stores one default workspace settings document with
  configurable SLA hours by priority.
- **Counter** atomically allocates sequential ticket numbers.

## Indexing

Unique indexes protect user email, category slug, ticket number, refresh-token
hash, and the settings key. Compound indexes support customer ticket history,
agent queues, ticket filters, message/activity timelines, category ordering,
notification inboxes, and audit-log lookups.

Schema validation checks required fields, enums, string lengths, and common
formats. Cross-document permissions and multi-document workflows are
intentionally enforced in service logic rather than assumed from schema
references.
