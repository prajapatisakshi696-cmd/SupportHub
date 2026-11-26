import assert from "node:assert/strict";
import test from "node:test";
import {
  listTicketMessagesQuerySchema,
  readMessagesSchema,
  sendMessageSchema,
} from "../validators/messageValidators.js";

const ticketId = "507f1f77bcf86cd799439011";
const messageId = "507f1f77bcf86cd799439012";

test("message inputs default to public messages and bound message history pages", () => {
  const parsed = sendMessageSchema.safeParse({
    ticketId,
    body: "  I need help with this request. ",
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.body, "I need help with this request.");
  assert.equal(parsed.data.isInternal, false);
  assert.equal(
    listTicketMessagesQuerySchema.safeParse({ page: "2", limit: "50" }).success,
    true,
  );
  assert.equal(
    listTicketMessagesQuerySchema.safeParse({ limit: "101" }).success,
    false,
  );
});

test("read receipts require unique valid message IDs", () => {
  assert.equal(
    readMessagesSchema.safeParse({ ticketId, messageIds: [messageId] }).success,
    true,
  );
  assert.equal(
    readMessagesSchema.safeParse({
      ticketId,
      messageIds: [messageId, messageId],
    }).success,
    false,
  );
});
