import Message from "../models/Message.js";
import Ticket from "../models/Ticket.js";
import TicketActivity from "../models/TicketActivity.js";
import { assertTicketIsAssignedToAgent } from "./ticketPolicy.js";
import { getTicket } from "./ticketService.js";
import {
  assertCanSendMessage,
  getMessageVisibilityFilter,
} from "./messagePolicy.js";
import { notifyTicketMessage } from "./notificationService.js";

const messagePopulate = [
  { path: "sender", select: "name role" },
  { path: "readReceipts.user", select: "name role" },
];

export async function listTicketMessages(ticketId, user, { page, limit }) {
  const ticket = await getTicket(ticketId, user);
  assertTicketIsAssignedToAgent(ticket, user);

  const filter = getMessageVisibilityFilter(ticketId, user);
  const [messages, total] = await Promise.all([
    Message.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(messagePopulate),
    Message.countDocuments(filter),
  ]);

  return {
    messages: messages.reverse(),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function populateMessage(messageId) {
  return Message.findById(messageId).populate(messagePopulate);
}

export async function createTicketMessage({ ticketId, body, isInternal }, user) {
  const ticket = await getTicket(ticketId, user);
  assertCanSendMessage(ticket, user, isInternal);

  const message = await Message.create({
    ticket: ticket._id,
    sender: user._id,
    body,
    isInternal,
  });
  const activityWarnings = [];
  try {
    await Ticket.updateOne(
      { _id: ticket._id },
      { $set: { updatedAt: message.createdAt } },
    );
  } catch (error) {
    console.error("Could not update ticket activity after saving a message:", error);
    activityWarnings.push("The message was saved, but ticket activity was not updated.");
  }
  try {
    await TicketActivity.create({
      ticket: ticket._id,
      actor: user._id,
      action: isInternal ? "internal_note_added" : "message_added",
      details: { messageId: String(message._id) },
    });
  } catch (error) {
    console.error("Could not record ticket message activity:", error);
    activityWarnings.push("The message was saved, but its activity record was not created.");
  }
  try {
    await notifyTicketMessage(ticket, user, isInternal);
  } catch (error) {
    console.error("Could not save ticket message notification:", error);
    activityWarnings.push(
      "The message was saved, but its notification could not be delivered.",
    );
  }

  return {
    message: await populateMessage(message._id),
    warning: activityWarnings.length ? activityWarnings.join(" ") : null,
  };
}

export async function markTicketMessagesRead(
  ticketId,
  messageIds,
  user,
) {
  const ticket = await getTicket(ticketId, user);
  assertTicketIsAssignedToAgent(ticket, user);

  const filter = {
    ...getMessageVisibilityFilter(ticketId, user),
    _id: { $in: messageIds },
    sender: { $ne: user._id },
    "readReceipts.user": { $ne: user._id },
  };
  const unreadMessages = await Message.find(filter).select("_id isInternal").lean();
  if (!unreadMessages.length) {
    return { publicMessageIds: [], internalMessageIds: [], readAt: new Date() };
  }

  const readAt = new Date();
  const unreadIds = unreadMessages.map((message) => message._id);
  await Message.updateMany(
    {
      _id: { $in: unreadIds },
      "readReceipts.user": { $ne: user._id },
    },
    { $push: { readReceipts: { user: user._id, readAt } } },
  );

  return {
    publicMessageIds: unreadMessages
      .filter((message) => !message.isInternal)
      .map((message) => String(message._id)),
    internalMessageIds: unreadMessages
      .filter((message) => message.isInternal)
      .map((message) => String(message._id)),
    readAt,
  };
}
