import AppError from "../utils/AppError.js";
import { assertTicketIsAssignedToAgent } from "./ticketPolicy.js";

export function getMessageVisibilityFilter(ticketId, user) {
  if (user.role === "customer") {
    return { ticket: ticketId, isInternal: false };
  }
  if (user.role === "agent" || user.role === "admin") {
    return { ticket: ticketId };
  }
  throw new AppError(403, "You do not have permission to view messages.");
}

export function assertCanCreateInternalMessage(user) {
  if (user.role !== "agent" && user.role !== "admin") {
    throw new AppError(403, "Only support staff can add internal notes.");
  }
}

export function assertCanSendMessage(ticket, user, isInternal) {
  if (isInternal) {
    assertCanCreateInternalMessage(user);
  }
  assertTicketIsAssignedToAgent(ticket, user);
  if (ticket.status === "closed") {
    throw new AppError(409, "Reopen the ticket before sending a message.");
  }
  if (
    user.role === "customer" &&
    !["open", "in_progress"].includes(ticket.status)
  ) {
    throw new AppError(
      409,
      "Reopen the resolved ticket before sending a reply.",
    );
  }
}
