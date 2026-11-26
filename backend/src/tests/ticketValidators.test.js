import assert from "node:assert/strict";
import test from "node:test";
import {
  createTicketSchema,
  listTicketsQuerySchema,
} from "../validators/ticketValidators.js";

test("ticket creation cannot accept caller-supplied ownership or assignment", () => {
  const request = {
    subject: "Unable to update billing details",
    description: "The billing form returns an error when I save.",
    categoryId: "507f1f77bcf86cd799439011",
    customer: "507f1f77bcf86cd799439012",
  };

  assert.equal(createTicketSchema.safeParse(request).success, false);
  assert.equal(
    createTicketSchema.safeParse({
      subject: "Unable to update billing details",
      description: "The billing form returns an error when I save.",
      categoryId: "507f1f77bcf86cd799439011",
    }).success,
    true,
  );
  assert.equal(
    createTicketSchema.safeParse({
      subject: "Unable to update billing details",
      description: "The billing form returns an error when I save.",
      categoryId: "507f1f77bcf86cd799439011",
      attachments: [{ url: "https://example.com/file.pdf" }],
    }).success,
    false,
  );
});

test("ticket list pagination is bounded and filters are allow-listed", () => {
  const parsed = listTicketsQuerySchema.safeParse({
    page: "2",
    limit: "50",
    sortBy: "updatedAt",
    sortOrder: "asc",
    scope: "unassigned",
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.page, 2);
  assert.equal(parsed.data.limit, 50);
  assert.equal(
    listTicketsQuerySchema.safeParse({ limit: "1000" }).success,
    false,
  );
  assert.equal(listTicketsQuerySchema.safeParse({ sortBy: "email" }).success, false);
});
