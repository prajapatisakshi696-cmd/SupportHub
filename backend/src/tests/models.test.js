import assert from "node:assert/strict";
import test from "node:test";
import {
  AuditLog,
  Category,
  CompanySettings,
  Message,
  Notification,
  PasswordResetToken,
  RefreshToken,
  Ticket,
  TicketActivity,
  User,
} from "../models/index.js";

test("user schema normalizes email and rejects unknown roles", async () => {
  const user = new User({
    name: "Support Admin",
    email: "ADMIN@EXAMPLE.COM",
    passwordHash: "bcrypt-hash",
    role: "admin",
  });

  assert.equal(user.email, "admin@example.com");
  await assert.doesNotReject(user.validate());
  user.role = "owner";
  await assert.rejects(user.validate(), /`owner` is not a valid enum value/);
});

test("ticket schema enforces ticket numbers, references, and status history", async () => {
  const ticket = new Ticket({
    ticketNumber: "SUP-10001",
    subject: "Cannot access my account",
    description: "The sign-in page rejects my credentials.",
    category: new User()._id,
    customer: new User()._id,
  });

  await assert.doesNotReject(ticket.validate());
  assert.equal(ticket.status, "open");
  assert.equal(ticket.statusHistory.length, 1);
  assert.equal(ticket.statusHistory[0].status, "open");

  ticket.ticketNumber = "SUP-42";
  await assert.rejects(ticket.validate(), /Path `ticketNumber` is invalid/);
});

test("company settings default to valid per-priority SLA targets", async () => {
  const settings = new CompanySettings({ companyName: "SupportHub" });

  await assert.doesNotReject(settings.validate());
  assert.deepEqual(settings.slaHours.toObject(), {
    low: 72,
    medium: 24,
    high: 8,
    urgent: 2,
  });
});

test("ticket attachments have scoped download metadata and private Cloudinary IDs", async () => {
  const ticket = new Ticket({
    ticketNumber: "SUP-10002",
    subject: "Unable to attach a receipt",
    description: "The upload was rejected.",
    category: new User()._id,
    customer: new User()._id,
    attachments: [
      {
        url: "tickets/ticket-id/attachments/attachment-id",
        publicId: "supporthub/ticket-attachments/private-asset",
        fileName: "receipt.pdf",
        contentType: "application/pdf",
        format: "pdf",
        sizeInBytes: 1200,
      },
    ],
  });

  await assert.doesNotReject(ticket.validate());
  assert.ok(ticket.attachments[0]._id);
  assert.equal(
    Ticket.schema.path("attachments").schema.path("publicId").options.select,
    false,
  );
});

test("messages are customer-visible by default and cannot omit their body", async () => {
  const message = new Message({
    ticket: new Ticket()._id,
    sender: new User()._id,
    body: "I still need help with this issue.",
  });

  await assert.doesNotReject(message.validate());
  assert.equal(message.isInternal, false);
  assert.equal(message.readReceipts.length, 0);

  message.body = "";
  await assert.rejects(message.validate(), /Path `body` is required/);
});

test("notifications validate ticket references and supported notification types", async () => {
  const notification = new Notification({
    recipient: new User()._id,
    type: "ticket_assigned",
    title: "Ticket assigned to you",
    resourceType: "ticket",
    resourceId: new Ticket()._id,
  });

  await assert.doesNotReject(notification.validate());
  notification.type = "sla_breached";
  await assert.doesNotReject(notification.validate());
  notification.type = "internal_note";
  await assert.rejects(notification.validate(), /is not a valid enum value/);
});

test("refresh tokens store hashes and expire through a TTL index", () => {
  assert.equal(RefreshToken.schema.path("tokenHash").options.select, false);

  const expiryIndex = RefreshToken.schema.indexes().find(
    ([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0,
  );
  assert.ok(expiryIndex, "refresh token expiry index should be configured");
});

test("all phase 2 models use timestamps", () => {
  for (const model of [
    AuditLog,
    Category,
    CompanySettings,
    Message,
    Notification,
    PasswordResetToken,
    Ticket,
    TicketActivity,
    User,
  ]) {
    assert.equal(model.schema.options.timestamps, true, `${model.modelName} timestamps`);
  }
});
