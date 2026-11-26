import AppError from "../utils/AppError.js";

const CUSTOMER_REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const STATUS_TRANSITIONS = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved", "closed"],
  resolved: ["open", "closed"],
  closed: ["open"],
};

export function getTicketListFilter(user, scope) {
  if (user.role === "admin") {
    if (scope === "mine") {
      return { assignedAgent: user._id };
    }
    if (scope === "unassigned") {
      return {
        assignedAgent: null,
        status: { $in: ["open", "in_progress"] },
      };
    }
    return {};
  }

  if (user.role === "agent") {
    if (scope === "all") {
      throw new AppError(403, "Agents may only view their tickets or the unassigned queue.");
    }
    return scope === "unassigned"
      ? {
          assignedAgent: null,
          status: { $in: ["open", "in_progress"] },
        }
      : { assignedAgent: user._id };
  }

  if (user.role === "customer") {
    if (scope) {
      throw new AppError(403, "Customers may only view their own tickets.");
    }
    return { customer: user._id };
  }

  throw new AppError(403, "You do not have permission to view tickets.");
}

export function getTicketAccessFilter(user) {
  if (user.role === "admin") {
    return {};
  }
  if (user.role === "agent") {
    return {
      $or: [
        { assignedAgent: user._id },
        {
          assignedAgent: null,
          status: { $in: ["open", "in_progress"] },
        },
      ],
    };
  }
  if (user.role === "customer") {
    return { customer: user._id };
  }
  throw new AppError(403, "You do not have permission to view tickets.");
}

export function assertTicketIsAssignedToAgent(ticket, user) {
  const assignedAgentId = ticket.assignedAgent?._id ?? ticket.assignedAgent;
  if (user.role === "agent" && String(assignedAgentId) !== String(user._id)) {
    throw new AppError(403, "Claim this ticket before updating it.");
  }
}

export function assertStatusTransition(ticket, user, nextStatus, now = new Date()) {
  if (user.role === "customer") {
    const reopenDeadline = ticket.resolvedAt
      ? ticket.resolvedAt.getTime() + CUSTOMER_REOPEN_WINDOW_MS
      : 0;
    if (
      ticket.status !== "resolved" ||
      nextStatus !== "open" ||
      now.getTime() > reopenDeadline
    ) {
      throw new AppError(403, "This ticket is not eligible to be reopened.");
    }
    return;
  }

  if (!["admin", "agent"].includes(user.role)) {
    throw new AppError(403, "You do not have permission to update ticket status.");
  }
  if (!STATUS_TRANSITIONS[ticket.status]?.includes(nextStatus)) {
    throw new AppError(
      400,
      `A ticket cannot move from ${ticket.status} to ${nextStatus}.`,
    );
  }
}

export function getTicketStatusDates(ticket, nextStatus, changedAt) {
  const reopened = nextStatus === "open" &&
    ["resolved", "closed"].includes(ticket.status);
  return {
    resolvedAt: nextStatus === "resolved"
      ? changedAt
      : reopened
        ? undefined
        : ticket.resolvedAt,
    closedAt: nextStatus === "closed"
      ? changedAt
      : ticket.status === "closed"
        ? undefined
        : ticket.closedAt,
  };
}
