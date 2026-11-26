import { Server } from "socket.io";
import AppError from "../utils/AppError.js";
import {
  createTicketMessage,
  markTicketMessagesRead,
} from "../services/messageService.js";
import { getTicket } from "../services/ticketService.js";
import { assertCanCreateInternalMessage } from "../services/messagePolicy.js";
import {
  readMessagesSchema,
  sendMessageSchema,
  ticketMessagesParamsSchema,
  typingSchema,
} from "../validators/messageValidators.js";
import authenticateSocket from "./authenticateSocket.js";
import { setNotificationSocketServer } from "../services/notificationService.js";

function ticketRoom(ticketId) {
  return `ticket:${ticketId}`;
}

function staffRoom(ticketId) {
  return `ticket:${ticketId}:staff`;
}

function parsePayload(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError(400, "The socket event payload is invalid.");
  }
  return result.data;
}

function eventError(error) {
  if (!(error instanceof AppError)) {
    console.error("Socket.IO ticket event failed:", error);
  }
  return {
    ok: false,
    message:
      error instanceof AppError
        ? error.message
        : "The ticket event could not be completed.",
  };
}

function acknowledge(socket, callback, response) {
  if (typeof callback === "function") {
    callback(response);
    return;
  }
  if (!response.ok) {
    socket.emit("socket:error", { message: response.message });
  }
}

function handleEvent(socket, callback, action) {
  Promise.resolve()
    .then(action)
    .then((result) => acknowledge(socket, callback, { ok: true, ...result }))
    .catch((error) => acknowledge(socket, callback, eventError(error)));
}

function isStaff(user) {
  return user.role === "admin" || user.role === "agent";
}

export default function initializeSocketServer(httpServer) {
  const origin = new URL(
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ).origin;
  const io = new Server(httpServer, {
    cors: { origin, credentials: true },
  });
  setNotificationSocketServer(io);

  io.use(authenticateSocket);
  io.on("connection", (socket) => {
    const user = socket.data.user;
    socket.data.ticketIds = new Set();
    socket.join(`user:${user._id}`);

    socket.on("ticket:join", (payload, callback) => {
      handleEvent(socket, callback, async () => {
        const { ticketId } = parsePayload(ticketMessagesParamsSchema, payload);
        const ticket = await getTicket(ticketId, user);
        if (
          user.role === "agent" &&
          String(ticket.assignedAgent?._id) !== String(user._id)
        ) {
          throw new AppError(
            403,
            "Claim this ticket before joining its conversation.",
          );
        }

        await socket.join(ticketRoom(ticketId));
        if (isStaff(user)) {
          await socket.join(staffRoom(ticketId));
        }
        socket.data.ticketIds.add(ticketId);
        return {};
      });
    });

    socket.on("ticket:leave", (payload, callback) => {
      handleEvent(socket, callback, async () => {
        const { ticketId } = parsePayload(ticketMessagesParamsSchema, payload);
        await socket.leave(ticketRoom(ticketId));
        await socket.leave(staffRoom(ticketId));
        socket.data.ticketIds.delete(ticketId);
        return {};
      });
    });

    socket.on("ticket:message:send", (payload, callback) => {
      handleEvent(socket, callback, async () => {
        const messageInput = parsePayload(sendMessageSchema, payload);
        if (!socket.data.ticketIds.has(messageInput.ticketId)) {
          throw new AppError(403, "Join the ticket before sending a message.");
        }
        if (messageInput.isInternal) {
          assertCanCreateInternalMessage(user);
        }

        const result = await createTicketMessage(messageInput, user);
        const room = messageInput.isInternal
          ? staffRoom(messageInput.ticketId)
          : ticketRoom(messageInput.ticketId);
        socket.to(room).emit("message:new", result.message);
        return result;
      });
    });

    socket.on("ticket:typing", (payload, callback) => {
      handleEvent(socket, callback, async () => {
        const typing = parsePayload(typingSchema, payload);
        if (!socket.data.ticketIds.has(typing.ticketId)) {
          throw new AppError(403, "Join the ticket before sending typing updates.");
        }
        if (typing.isInternal) {
          assertCanCreateInternalMessage(user);
        }

        const room = typing.isInternal
          ? staffRoom(typing.ticketId)
          : ticketRoom(typing.ticketId);
        socket.to(room).emit("ticket:typing", {
          ticketId: typing.ticketId,
          isInternal: typing.isInternal,
          isTyping: typing.isTyping,
          user: {
            id: String(user._id),
            name: user.name,
            role: user.role,
          },
        });
        return {};
      });
    });

    socket.on("ticket:read", (payload, callback) => {
      handleEvent(socket, callback, async () => {
        const readInput = parsePayload(readMessagesSchema, payload);
        if (!socket.data.ticketIds.has(readInput.ticketId)) {
          throw new AppError(403, "Join the ticket before updating read receipts.");
        }

        const result = await markTicketMessagesRead(
          readInput.ticketId,
          readInput.messageIds,
          user,
        );
        const receipt = {
          ticketId: readInput.ticketId,
          messageIds: [],
          readAt: result.readAt,
          user: {
            id: String(user._id),
            name: user.name,
            role: user.role,
          },
        };
        if (result.publicMessageIds.length) {
          socket.to(ticketRoom(readInput.ticketId)).emit("messages:read", {
            ...receipt,
            messageIds: result.publicMessageIds,
          });
        }
        if (result.internalMessageIds.length) {
          socket.to(staffRoom(readInput.ticketId)).emit("messages:read", {
            ...receipt,
            messageIds: result.internalMessageIds,
          });
        }
        return result;
      });
    });
  });

  return io;
}
