"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { Send, Wifi, WifiOff } from "lucide-react";
import { useGetCurrentUserQuery } from "../../services/authApi";
import { ticketApi, useGetTicketMessagesQuery } from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import { socketOrigin } from "../../utils/socketOrigin";

const pageSize = 50;

function formatTime(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function mergeMessages(current, incoming) {
  const messages = new Map(current.map((message) => [message._id, message]));
  for (const message of incoming) {
    messages.set(message._id, { ...messages.get(message._id), ...message });
  }
  return Array.from(messages.values()).sort(
    (left, right) => new Date(left.createdAt) - new Date(right.createdAt),
  );
}

function hasReceiptFromOtherSide(message, user, role) {
  return (message.readReceipts ?? []).some((receipt) => {
    const reader = receipt.user;
    if (String(reader?._id ?? reader) === String(user?._id)) {
      return false;
    }
    if (role === "customer") {
      return reader?.role === "agent" || reader?.role === "admin";
    }
    return message.isInternal
      ? reader?.role === "agent" || reader?.role === "admin"
      : reader?.role === "customer";
  });
}

export default function TicketConversation({
  ticketId,
  role,
  ticketStatus,
}) {
  const dispatch = useDispatch();
  const { data: user } = useGetCurrentUserQuery();
  const [page, setPage] = useState(1);
  const { currentData, isLoading, isError, error, refetch } =
    useGetTicketMessagesQuery({ ticketId, page, limit: pageSize });
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [actionError, setActionError] = useState("");
  const [activityWarning, setActivityWarning] = useState("");
  const [typingUser, setTypingUser] = useState(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const typingSentRef = useRef(false);

  useEffect(() => {
    setPage(1);
    setMessages([]);
    setIsJoined(false);
    setDraft("");
    setActionError("");
    setActivityWarning("");
  }, [ticketId]);

  useEffect(() => {
    if (currentData?.messages) {
      setMessages((existing) => mergeMessages(existing, currentData.messages));
    }
  }, [currentData]);

  useEffect(() => {
    const socket = io(socketOrigin, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError("");
      typingSentRef.current = false;
      socket.emit("ticket:join", { ticketId }, (response) => {
        if (!response?.ok) {
          setIsJoined(false);
          setConnectionError(
            response?.message ?? "Could not join this ticket conversation.",
          );
          return;
        }
        setIsJoined(true);
      });
    });
    socket.on("disconnect", () => {
      setIsConnected(false);
      setIsJoined(false);
      typingSentRef.current = false;
    });
    socket.on("connect_error", (socketError) => {
      setIsConnected(false);
      setIsJoined(false);
      setConnectionError(
        socketError?.message === "Authentication required."
          ? "Your session expired. Sign in again to continue."
          : "Live messaging is unavailable. Check your connection and try again.",
      );
    });
    socket.on("message:new", (message) => {
      if (String(message.ticket) !== String(ticketId)) {
        return;
      }
      setMessages((existing) => mergeMessages(existing, [message]));
      dispatch(
        ticketApi.util.invalidateTags([
          { type: "Message", id: `TICKET-${ticketId}` },
        ]),
      );
    });
    socket.on("ticket:typing", (update) => {
      if (String(update.ticketId) !== String(ticketId)) {
        return;
      }
      if (!update.isTyping) {
        setTypingUser(null);
        return;
      }
      setTypingUser(update);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2500);
    });
    socket.on("messages:read", (receipt) => {
      const readIds = new Set(receipt.messageIds);
      setMessages((existing) =>
        existing.map((message) => {
          if (!readIds.has(message._id)) {
            return message;
          }
          const alreadyRead = (message.readReceipts ?? []).some(
            (item) => String(item.user?._id ?? item.user) === receipt.user.id,
          );
          return alreadyRead
            ? message
            : {
                ...message,
                readReceipts: [
                  ...(message.readReceipts ?? []),
                  {
                    user: {
                      _id: receipt.user.id,
                      name: receipt.user.name,
                      role: receipt.user.role,
                    },
                    readAt: receipt.readAt,
                  },
                ],
              };
        }),
      );
    });
    socket.on("socket:error", (socketError) => {
      setActionError(socketError.message);
    });

    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (socket.connected) {
        socket.emit("ticket:leave", { ticketId });
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [dispatch, ticketId]);

  useEffect(() => {
    if (!isJoined || !user?._id || !messages.length) {
      return;
    }
    const unreadIds = messages
      .filter((message) => {
        if (String(message.sender?._id) === String(user._id)) {
          return false;
        }
        return !(message.readReceipts ?? []).some(
          (receipt) => String(receipt.user?._id ?? receipt.user) === String(user._id),
        );
      })
      .map((message) => message._id);
    if (!unreadIds.length) {
      return;
    }
    socketRef.current?.emit(
      "ticket:read",
      { ticketId, messageIds: unreadIds.slice(0, 100) },
      (response) => {
        if (!response?.ok) {
          setActionError(
            response?.message ?? "Could not update message read receipts.",
          );
          return;
        }
        const readIds = new Set([
          ...(response.publicMessageIds ?? []),
          ...(response.internalMessageIds ?? []),
        ]);
        if (readIds.size) {
          setMessages((existing) =>
            existing.map((message) => {
              if (!readIds.has(message._id)) {
                return message;
              }
              const alreadyRead = (message.readReceipts ?? []).some(
                (receipt) =>
                  String(receipt.user?._id ?? receipt.user) === String(user._id),
              );
              return alreadyRead
                ? message
                : {
                    ...message,
                    readReceipts: [
                      ...(message.readReceipts ?? []),
                      {
                        user: {
                          _id: user._id,
                          name: user.name,
                          role: user.role,
                        },
                        readAt: response.readAt,
                      },
                    ],
                  };
            }),
          );
        }
      },
    );
  }, [isJoined, messages, ticketId, user?._id]);

  useEffect(
    () => () => clearTimeout(typingTimeoutRef.current),
    [],
  );

  const canSendMessages =
    ticketStatus !== "closed" &&
    (role !== "customer" || ["open", "in_progress"].includes(ticketStatus));

  function setTyping(isTyping) {
    if (!isJoined) {
      return;
    }
    if (typingSentRef.current === isTyping) {
      return;
    }
    typingSentRef.current = isTyping;
    socketRef.current?.emit("ticket:typing", {
      ticketId,
      isTyping,
      isInternal: role !== "customer" && isInternal,
    });
  }

  function handleDraftChange(event) {
    const value = event.target.value;
    setDraft(value);
    if (value.trim()) {
      setTyping(true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 900);
    } else {
      clearTimeout(typingTimeoutRef.current);
      setTyping(false);
    }
  }

  function handleSend(event) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !isJoined || isSending || !canSendMessages) {
      return;
    }
    setIsSending(true);
    setActionError("");
    setActivityWarning("");
    socketRef.current?.emit(
      "ticket:message:send",
      { ticketId, body, isInternal: role !== "customer" && isInternal },
      (response) => {
        setIsSending(false);
        if (!response?.ok) {
          setActionError(
            response?.message ?? "Your message could not be sent.",
          );
          return;
        }
        setMessages((existing) =>
          mergeMessages(existing, [response.message]),
        );
        setActivityWarning(response.warning ?? "");
        setDraft("");
        setTyping(false);
        dispatch(
          ticketApi.util.invalidateTags([
            { type: "Message", id: `TICKET-${ticketId}` },
          ]),
        );
      },
    );
  }

  const canLoadOlder =
    currentData?.pagination?.page < currentData?.pagination?.totalPages;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-semibold text-slate-900">Conversation</h2>
          <p className="mt-1 text-xs text-slate-500">
            Messages are saved to this ticket.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isConnected && isJoined
              ? "bg-emerald-50 text-emerald-800"
              : "bg-slate-100 text-slate-600"
          }`}
          role="status"
        >
          {isConnected && isJoined ? (
            <Wifi aria-hidden="true" size={13} />
          ) : (
            <WifiOff aria-hidden="true" size={13} />
          )}
          {isConnected && isJoined ? "Live" : "Connecting"}
        </span>
      </div>

      <div
        aria-live="polite"
        className="max-h-[28rem] min-h-48 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-5"
      >
        {canLoadOlder ? (
          <div className="text-center">
            <button
              className="text-xs font-semibold text-emerald-800 hover:underline"
              onClick={() => setPage((value) => value + 1)}
              type="button"
            >
              Load older messages
            </button>
          </div>
        ) : null}
        {isLoading && !messages.length ? (
          <p className="py-12 text-center text-sm text-slate-500" role="status">
            Loading conversation...
          </p>
        ) : isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-rose-700">
              {getApiErrorMessage(error, "Could not load messages.")}
            </p>
            <button
              className="mt-2 text-sm font-semibold text-emerald-800 hover:underline"
              onClick={refetch}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : messages.length ? (
          messages.map((message) => {
            const isOwnMessage =
              String(message.sender?._id) === String(user?._id);
            return (
              <article
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                key={message._id}
              >
                <div className="max-w-[88%] sm:max-w-[75%]">
                  <div
                    className={`mb-1 flex items-center gap-2 text-[11px] text-slate-500 ${
                      isOwnMessage ? "justify-end" : ""
                    }`}
                  >
                    <span>{isOwnMessage ? "You" : message.sender?.name ?? "Support"}</span>
                    <span aria-hidden="true">·</span>
                    <time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                    {message.isInternal ? (
                      <span className="font-semibold text-amber-800">Internal</span>
                    ) : null}
                  </div>
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.isInternal
                        ? "border border-amber-200 bg-amber-50 text-amber-950"
                        : isOwnMessage
                          ? "rounded-br-md bg-emerald-800 text-white"
                          : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.body}</p>
                  </div>
                  {isOwnMessage && hasReceiptFromOtherSide(message, user, role) ? (
                    <p className="mt-1 text-right text-[11px] text-slate-500">
                      Seen
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">
            No messages yet. Send a reply to start the conversation.
          </p>
        )}
        {typingUser ? (
          <p className="text-xs italic text-slate-500">
            {typingUser.user.name}{" "}
            {typingUser.isInternal ? "is writing an internal note..." : "is typing..."}
          </p>
        ) : null}
      </div>

      {connectionError ? (
        <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900" role="alert">
          {connectionError}
        </p>
      ) : null}
      {actionError ? (
        <p className="border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-800" role="alert">
          {actionError}
        </p>
      ) : null}
      {activityWarning ? (
        <p className="border-t border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900" role="status">
          {activityWarning}
        </p>
      ) : null}

      {canSendMessages ? (
        <form className="space-y-3 border-t border-slate-200 p-4 sm:p-5" onSubmit={handleSend}>
          {role !== "customer" ? (
            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                checked={isInternal}
                className="h-4 w-4 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                onChange={(event) => {
                  clearTimeout(typingTimeoutRef.current);
                  setTyping(false);
                  setIsInternal(event.target.checked);
                }}
                type="checkbox"
              />
              Add internal note <span className="text-xs font-normal text-slate-500">(staff only)</span>
            </label>
          ) : null}
          <label className="sr-only" htmlFor={`message-${ticketId}`}>
            Write a message
          </label>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 disabled:bg-slate-50"
            disabled={!isJoined}
            id={`message-${ticketId}`}
            maxLength={10000}
            onChange={handleDraftChange}
            placeholder={
              isInternal ? "Write a note for the support team..." : "Write a reply..."
            }
            value={draft}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              {role === "customer"
                ? "Only you and the support team can see this conversation."
                : isInternal
                  ? "Internal notes are visible to support staff only."
                  : "Replies are visible to the customer."}
            </p>
            <button
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!isJoined || !draft.trim() || isSending}
              type="submit"
            >
              <Send aria-hidden="true" size={15} />
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      ) : (
        <p className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
          {ticketStatus === "closed" && role === "customer"
            ? "This ticket is closed. Create a new ticket if you still need help."
            : ticketStatus === "closed"
              ? "Reopen this ticket before sending another message."
            : "Reopen this resolved ticket before sending a reply."}
        </p>
      )}
    </section>
  );
}
