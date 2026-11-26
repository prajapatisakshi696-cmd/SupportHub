import Category from "../models/Category.js";
import Counter from "../models/Counter.js";
import Ticket from "../models/Ticket.js";
import TicketActivity from "../models/TicketActivity.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import {
  createPrivateAttachmentDownloadUrl,
  removeTicketAttachments,
  uploadTicketAttachments,
} from "./attachmentService.js";
import {
  assertStatusTransition,
  assertTicketIsAssignedToAgent,
  getTicketAccessFilter,
  getTicketListFilter,
  getTicketStatusDates,
} from "./ticketPolicy.js";
import {
  notifyTicketAssigned,
  notifyTicketCreated,
  notifyTicketStatus,
} from "./notificationService.js";
import { getSlaHoursForPriority } from "./settingsService.js";

const ticketPopulate = [
  { path: "category", select: "name slug" },
  { path: "customer", select: "name email" },
  { path: "assignedAgent", select: "name email" },
];
const ticketDetailPopulate = [
  ...ticketPopulate,
  { path: "statusHistory.changedBy", select: "name" },
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findAccessibleTicket(ticketId, user, includeAttachmentSecrets = false) {
  const filter = getTicketAccessFilter(user);
  filter._id = ticketId;
  const query = Ticket.findOne(filter);
  if (includeAttachmentSecrets) {
    query.select("+attachments.publicId");
  }
  const ticket = await query;
  if (!ticket) {
    throw new AppError(404, "Ticket not found.");
  }
  return ticket;
}

async function populateTicket(ticketId, includeStatusActors = false) {
  return Ticket.findById(ticketId).populate(
    includeStatusActors ? ticketDetailPopulate : ticketPopulate,
  );
}

async function createActivity(ticket, actor, action, details = {}) {
  await TicketActivity.create({
    ticket: ticket._id,
    actor: actor?._id,
    action,
    details,
  });
}

async function attemptNotification(notificationAction) {
  try {
    await notificationAction();
    return null;
  } catch (error) {
    console.error("Could not save ticket notification:", error);
    return "The ticket was saved, but a notification could not be delivered.";
  }
}

export async function createTicket(user, input, files = []) {
  const category = await Category.findOne({
    _id: input.categoryId,
    isActive: true,
  });
  if (!category) {
    throw new AppError(400, "Choose an active ticket category.");
  }

  const slaHours = await getSlaHoursForPriority(input.priority);
  const uploadedAttachments = await uploadTicketAttachments(files);
  const ticket = new Ticket({
    subject: input.subject,
    description: input.description,
    category: category._id,
    priority: input.priority,
    customer: user._id,
    slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
  });

  for (const uploaded of uploadedAttachments) {
    const attachment = ticket.attachments.create({
      ...uploaded,
      url: "pending",
    });
    attachment.url = `tickets/${ticket._id}/attachments/${attachment._id}`;
    ticket.attachments.push(attachment);
  }

  try {
    const counter = await Counter.findOneAndUpdate(
      { key: "ticket" },
      { $inc: { sequence: 1 } },
      { upsert: true, new: true, runValidators: true },
    );
    if (!counter) {
      throw new AppError(500, "Could not allocate a ticket number.");
    }
    ticket.ticketNumber = `SUP-${String(10000 + counter.sequence).padStart(5, "0")}`;
    await ticket.save();
  } catch (error) {
    await removeTicketAttachments(uploadedAttachments);
    throw error;
  }

  await createActivity(ticket, user, "ticket_created", {
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
  });

  const notificationWarning = await attemptNotification(() =>
    notifyTicketCreated(ticket),
  );
  return {
    ticket: await populateTicket(ticket._id),
    notificationWarning,
  };
}

export async function listTickets(user, query) {
  const { scope, page, limit, status, priority, categoryId, assignedAgentId, q } =
    query;
  const filter = getTicketListFilter(user, scope);

  if (assignedAgentId && user.role !== "admin") {
    throw new AppError(403, "Only admins can filter tickets by assigned agent.");
  }
  if (assignedAgentId && scope === "unassigned") {
    throw new AppError(400, "The unassigned queue cannot be filtered by an agent.");
  }
  if (status) {
    if (
      scope === "unassigned" &&
      !["open", "in_progress"].includes(status)
    ) {
      throw new AppError(400, "The unassigned queue only includes active tickets.");
    }
    filter.status = status;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (categoryId) {
    filter.category = categoryId;
  }
  if (assignedAgentId && user.role === "admin") {
    filter.assignedAgent = assignedAgentId;
  }
  if (q) {
    const search = new RegExp(escapeRegex(q), "i");
    filter.$and = [
      ...(filter.$and ?? []),
      { $or: [{ subject: search }, { ticketNumber: search }] },
    ];
  }

  const sort = {
    [query.sortBy]: query.sortOrder === "asc" ? 1 : -1,
  };
  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(ticketPopulate),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getTicket(ticketId, user) {
  const ticket = await findAccessibleTicket(ticketId, user);
  return populateTicket(ticket._id, true);
}

export async function getTicketAttachmentDownload(ticketId, attachmentId, user) {
  const ticket = await findAccessibleTicket(ticketId, user, true);
  const attachment = ticket.attachments.id(attachmentId);
  if (!attachment) {
    throw new AppError(404, "Attachment not found.");
  }
  return createPrivateAttachmentDownloadUrl(attachment);
}

export async function assignTicket(ticketId, user, agentId) {
  if (user.role !== "admin") {
    throw new AppError(403, "Only admins can assign tickets.");
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new AppError(404, "Ticket not found.");
  }

  let agent = null;
  if (agentId) {
    agent = await User.findOne({
      _id: agentId,
      role: "agent",
      status: "active",
    });
    if (!agent) {
      throw new AppError(404, "Active agent not found.");
    }
  }

  const previousAgentId = ticket.assignedAgent ? String(ticket.assignedAgent) : null;
  const nextAgentId = agent ? String(agent._id) : null;
  if (previousAgentId === nextAgentId) {
    return { ticket: await populateTicket(ticket._id), notificationWarning: null };
  }

  ticket.assignedAgent = agent?._id ?? null;
  await ticket.save();
  await createActivity(
    ticket,
    user,
    previousAgentId ? "reassigned" : "assigned",
    { previousAgentId, assignedAgentId: nextAgentId },
  );

  const notificationWarning = await attemptNotification(() =>
    notifyTicketAssigned(ticket, agent),
  );
  return {
    ticket: await populateTicket(ticket._id),
    notificationWarning,
  };
}

export async function claimTicket(ticketId, user) {
  if (user.role !== "agent") {
    throw new AppError(403, "Only agents can claim tickets.");
  }

  const ticket = await Ticket.findOneAndUpdate(
    {
      _id: ticketId,
      assignedAgent: null,
      status: { $in: ["open", "in_progress"] },
    },
    { $set: { assignedAgent: user._id } },
    { new: true, runValidators: true },
  );

  if (!ticket) {
    const exists = await Ticket.exists({ _id: ticketId });
    if (!exists) {
      throw new AppError(404, "Ticket not found.");
    }
    throw new AppError(409, "This ticket is no longer available to claim.");
  }

  await createActivity(ticket, user, "assigned", {
    assignedAgentId: String(user._id),
    claimed: true,
  });
  const notificationWarning = await attemptNotification(() =>
    notifyTicketAssigned(ticket, user, { notifyAgent: false }),
  );
  return {
    ticket: await populateTicket(ticket._id),
    notificationWarning,
  };
}

export async function updateTicketStatus(ticketId, user, { status, note }) {
  const ticket = await findAccessibleTicket(ticketId, user);
  if (user.role === "agent") {
    assertTicketIsAssignedToAgent(ticket, user);
  }
  if (ticket.status === status) {
    return { ticket: await populateTicket(ticket._id), notificationWarning: null };
  }

  assertStatusTransition(ticket, user, status);
  const previousStatus = ticket.status;
  const changedAt = new Date();
  const statusDates = getTicketStatusDates(
    {
      status: previousStatus,
      resolvedAt: ticket.resolvedAt,
      closedAt: ticket.closedAt,
    },
    status,
    changedAt,
  );
  ticket.status = status;
  Object.assign(ticket, statusDates);
  if (
    status === "open" &&
    ["resolved", "closed"].includes(previousStatus)
  ) {
    const slaHours = await getSlaHoursForPriority(ticket.priority);
    ticket.slaDeadline = new Date(
      changedAt.getTime() + slaHours * 60 * 60 * 1000,
    );
    ticket.slaWarningSentAt = undefined;
    ticket.slaBreachSentAt = undefined;
  }
  ticket.statusHistory.push({
    status,
    changedBy: user._id,
    changedAt,
    note,
  });
  await ticket.save();

  const action =
    status === "closed"
      ? "closed"
      : status === "open" && ["resolved", "closed"].includes(previousStatus)
        ? "reopened"
        : "status_changed";
  await createActivity(ticket, user, action, {
    previousStatus,
    status,
    note,
  });

  const notificationWarning = await attemptNotification(() =>
    notifyTicketStatus(ticket, previousStatus, status, user),
  );
  return {
    ticket: await populateTicket(ticket._id),
    notificationWarning,
  };
}

export async function updateTicketPriority(ticketId, user, priority) {
  if (!["admin", "agent"].includes(user.role)) {
    throw new AppError(403, "Only support staff can update ticket priority.");
  }

  const ticket = await findAccessibleTicket(ticketId, user);
  assertTicketIsAssignedToAgent(ticket, user);
  if (ticket.priority === priority) {
    return populateTicket(ticket._id);
  }

  const previousPriority = ticket.priority;
  const slaHours = await getSlaHoursForPriority(priority);
  ticket.priority = priority;
  if (!["resolved", "closed"].includes(ticket.status)) {
    ticket.slaDeadline = new Date(
      ticket.createdAt.getTime() + slaHours * 60 * 60 * 1000,
    );
    ticket.slaWarningSentAt = undefined;
    ticket.slaBreachSentAt = undefined;
  }
  await ticket.save();
  await createActivity(ticket, user, "priority_changed", {
    previousPriority,
    priority,
  });

  return populateTicket(ticket._id);
}
