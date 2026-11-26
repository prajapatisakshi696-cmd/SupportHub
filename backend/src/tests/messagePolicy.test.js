import assert from "node:assert/strict";
import test from "node:test";
import {
  assertCanCreateInternalMessage,
  assertCanSendMessage,
  getMessageVisibilityFilter,
} from "../services/messagePolicy.js";
import AppError from "../utils/AppError.js";

test("customers can only query customer-visible messages", () => {
  const customer = { _id: "customer-1", role: "customer" };
  const agent = { _id: "agent-1", role: "agent" };

  assert.deepEqual(getMessageVisibilityFilter("ticket-1", customer), {
    ticket: "ticket-1",
    isInternal: false,
  });
  assert.deepEqual(getMessageVisibilityFilter("ticket-1", agent), {
    ticket: "ticket-1",
  });
});

test("internal notes and ticket replies are restricted by role and assignment", () => {
  const customer = { _id: "customer-1", role: "customer" };
  const agent = { _id: "agent-1", role: "agent" };
  const assignedTicket = {
    status: "open",
    assignedAgent: { _id: "agent-1" },
  };

  assert.throws(() => assertCanCreateInternalMessage(customer), AppError);
  assert.throws(
    () => assertCanSendMessage(assignedTicket, customer, true),
    AppError,
  );
  assert.doesNotThrow(() =>
    assertCanSendMessage(assignedTicket, agent, true),
  );
  assert.throws(
    () =>
      assertCanSendMessage(
        { status: "open", assignedAgent: { _id: "agent-2" } },
        agent,
        false,
      ),
    AppError,
  );
});

test("customers must reopen resolved requests before replying", () => {
  const customer = { _id: "customer-1", role: "customer" };

  assert.throws(
    () =>
      assertCanSendMessage(
        { status: "resolved", assignedAgent: null },
        customer,
        false,
      ),
    AppError,
  );
  assert.throws(
    () =>
      assertCanSendMessage(
        { status: "closed", assignedAgent: null },
        customer,
        false,
      ),
    AppError,
  );
});
