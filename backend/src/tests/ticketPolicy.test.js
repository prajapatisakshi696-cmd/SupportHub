import assert from "node:assert/strict";
import test from "node:test";
import {
  assertStatusTransition,
  assertTicketIsAssignedToAgent,
  getTicketAccessFilter,
  getTicketListFilter,
  getTicketStatusDates,
} from "../services/ticketPolicy.js";
import AppError from "../utils/AppError.js";

test("customers are restricted to their own tickets and cannot request a global scope", () => {
  const customer = { _id: "customer-1", role: "customer" };

  assert.deepEqual(getTicketListFilter(customer), { customer: customer._id });
  assert.deepEqual(getTicketAccessFilter(customer), { customer: customer._id });
  assert.throws(() => getTicketListFilter(customer, "all"), AppError);
});

test("agents can see assigned and active unassigned tickets, but not another agent's tickets", () => {
  const agent = { _id: "agent-1", role: "agent" };
  const accessFilter = getTicketAccessFilter(agent);

  assert.deepEqual(accessFilter.$or[0], { assignedAgent: agent._id });
  assert.deepEqual(accessFilter.$or[1], {
    assignedAgent: null,
    status: { $in: ["open", "in_progress"] },
  });
  assert.deepEqual(
    getTicketListFilter(agent, "unassigned"),
    { assignedAgent: null, status: { $in: ["open", "in_progress"] } },
  );
  assert.throws(() => getTicketListFilter(agent, "all"), AppError);
  assert.throws(
    () =>
      assertTicketIsAssignedToAgent(
        { assignedAgent: "agent-2" },
        agent,
      ),
    AppError,
  );
});

test("admins can list all tickets and choose an unassigned queue", () => {
  const admin = { _id: "admin-1", role: "admin" };

  assert.deepEqual(getTicketListFilter(admin, "all"), {});
  assert.deepEqual(
    getTicketListFilter(admin, "unassigned"),
    { assignedAgent: null, status: { $in: ["open", "in_progress"] } },
  );
});

test("customers can reopen only recently resolved tickets", () => {
  const customer = { _id: "customer-1", role: "customer" };
  const now = new Date("2026-01-08T00:00:00.000Z");
  const recentlyResolved = {
    status: "resolved",
    resolvedAt: new Date("2026-01-04T00:00:00.000Z"),
  };
  const oldResolved = {
    status: "resolved",
    resolvedAt: new Date("2025-12-30T00:00:00.000Z"),
  };

  assert.doesNotThrow(() =>
    assertStatusTransition(recentlyResolved, customer, "open", now),
  );
  assert.throws(
    () => assertStatusTransition(oldResolved, customer, "open", now),
    AppError,
  );
  assert.throws(
    () => assertStatusTransition(recentlyResolved, customer, "closed", now),
    AppError,
  );
  assert.throws(
    () => assertStatusTransition({ status: "open" }, customer, "resolved", now),
    AppError,
  );
});

test("staff status changes follow allowed workflow transitions", () => {
  const agent = { _id: "agent-1", role: "agent" };

  assert.doesNotThrow(() =>
    assertStatusTransition({ status: "open" }, agent, "in_progress"),
  );
  assert.throws(
    () => assertStatusTransition({ status: "closed" }, agent, "resolved"),
    AppError,
  );
});

test("closing a resolved ticket preserves resolution time, while reopening resets it", () => {
  const resolvedAt = new Date("2026-11-25T10:00:00.000Z");
  const closedAt = new Date("2026-11-26T10:00:00.000Z");
  const closedDates = getTicketStatusDates(
    { status: "resolved", resolvedAt },
    "closed",
    closedAt,
  );
  assert.equal(closedDates.resolvedAt, resolvedAt);
  assert.equal(closedDates.closedAt, closedAt);

  const reopenedDates = getTicketStatusDates(
    { status: "closed", resolvedAt, closedAt },
    "open",
    new Date("2026-11-26T11:00:00.000Z"),
  );
  assert.equal(reopenedDates.resolvedAt, undefined);
  assert.equal(reopenedDates.closedAt, undefined);
});
