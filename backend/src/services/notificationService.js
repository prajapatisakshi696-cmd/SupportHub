import Notification from "../models/Notification.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

let socketServer = null;

function notificationRoom(userId) {
  return `user:${userId}`;
}

function userIdOf(value) {
  return value?._id ?? value;
}

export function setNotificationSocketServer(io) {
  socketServer = io;
}

export async function createNotifications(recipientIds, input) {
  const uniqueRecipientIds = Array.from(
    new Set(
      recipientIds
        .filter(Boolean)
        .map((recipientId) => String(userIdOf(recipientId))),
    ),
  );
  if (!uniqueRecipientIds.length) {
    return [];
  }

  const notifications = await Notification.insertMany(
    uniqueRecipientIds.map((recipient) => ({ ...input, recipient })),
  );
  for (const notification of notifications) {
    const payload = notification.toObject();
    delete payload.recipient;
    socketServer
      ?.to(notificationRoom(notification.recipient))
      .emit("notification:new", payload);
  }
  return notifications;
}

async function activeStaffIds(roles = ["admin", "agent"]) {
  return User.find({ role: { $in: roles }, status: "active" })
    .distinct("_id");
}

function ticketNotification(ticket, type, title, body) {
  return {
    type,
    title,
    body,
    resourceType: "ticket",
    resourceId: ticket._id,
  };
}

export async function notifyTicketCreated(ticket) {
  const staffIds = await activeStaffIds();
  return createNotifications(
    [...staffIds, ticket.customer],
    ticketNotification(
      ticket,
      "ticket_created",
      "New support ticket",
      `${ticket.ticketNumber}: ${ticket.subject}`,
    ),
  );
}

export async function notifyTicketAssigned(
  ticket,
  agent,
  { notifyAgent = true } = {},
) {
  if (!agent) {
    return [];
  }
  const notifications = [];
  if (notifyAgent) {
    notifications.push(
      ...(await createNotifications(
        [agent],
        ticketNotification(
          ticket,
          "ticket_assigned",
          "Ticket assigned to you",
          `${ticket.ticketNumber}: ${ticket.subject}`,
        ),
      )),
    );
  }
  notifications.push(
    ...(await createNotifications(
      [ticket.customer],
      ticketNotification(
        ticket,
        "ticket_assigned",
        "Your ticket was assigned",
        `${ticket.ticketNumber} is assigned to ${agent.name ?? "a support agent"}.`,
      ),
    )),
  );
  return notifications;
}

export async function notifyTicketStatus(ticket, previousStatus, status, actor) {
  if (actor.role === "customer") {
    const recipients = ticket.assignedAgent
      ? [ticket.assignedAgent]
      : await activeStaffIds();
    return createNotifications(
      recipients,
      ticketNotification(
        ticket,
        "status_changed",
        "Ticket reopened",
        `${ticket.ticketNumber} was reopened by the customer.`,
      ),
    );
  }

  const reopened = status === "open" &&
    ["resolved", "closed"].includes(previousStatus);
  const type = status === "resolved" ? "ticket_resolved" : "status_changed";
  const title = status === "resolved"
    ? "Ticket resolved"
    : reopened
      ? "Ticket reopened"
      : "Ticket status updated";
  return createNotifications(
    [ticket.customer],
    ticketNotification(
      ticket,
      type,
      title,
      `${ticket.ticketNumber} is now ${status.replace("_", " ")}.`,
    ),
  );
}

export async function notifyTicketMessage(ticket, user, isInternal) {
  if (isInternal) {
    return [];
  }
  const recipients = user.role === "customer"
    ? ticket.assignedAgent
      ? [ticket.assignedAgent]
      : await activeStaffIds()
    : [ticket.customer];
  return createNotifications(
    recipients.filter(
      (recipient) => String(userIdOf(recipient)) !== String(user._id),
    ),
    ticketNotification(
      ticket,
      "new_message",
      "New ticket reply",
      `${ticket.ticketNumber}: ${user.name} sent a reply.`,
    ),
  );
}

export async function notifySlaAlert(ticket, breached) {
  const admins = await activeStaffIds(["admin"]);
  const recipients = [
    ...admins,
    ...(ticket.assignedAgent ? [ticket.assignedAgent] : []),
  ];
  return createNotifications(
    recipients,
    ticketNotification(
      ticket,
      breached ? "sla_breached" : "sla_warning",
      breached ? "Ticket SLA breached" : "Ticket SLA due soon",
      breached
        ? `${ticket.ticketNumber} is past its SLA deadline.`
        : `${ticket.ticketNumber} is due within one hour.`,
    ),
  );
}

export async function listNotifications(user, { page, limit }) {
  const filter = { recipient: user._id };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .select("-recipient")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: { $exists: false } }),
  ]);
  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function markNotificationRead(notificationId, user) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: user._id },
    { $set: { readAt: new Date() } },
    { new: true },
  ).select("-recipient");
  if (!notification) {
    throw new AppError(404, "Notification not found.");
  }
  return notification;
}

export async function markAllNotificationsRead(user) {
  const result = await Notification.updateMany(
    { recipient: user._id, readAt: { $exists: false } },
    { $set: { readAt: new Date() } },
  );
  return { updatedCount: result.modifiedCount };
}
