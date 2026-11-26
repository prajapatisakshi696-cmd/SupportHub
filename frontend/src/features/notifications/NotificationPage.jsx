"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "../../services/notificationApi";
import { getApiErrorMessage } from "../../utils/apiError";

const pageSize = 20;

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ticketHref(role, notification) {
  if (notification.resourceType !== "ticket" || !notification.resourceId) {
    return `/${role}/tickets`;
  }
  return `/${role}/tickets/${notification.resourceId}`;
}

export default function NotificationPage({ role }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState("");
  const { data, isLoading, isError, error, refetch } = useGetNotificationsQuery({
    page,
    limit: pageSize,
  });
  const [markRead, { isLoading: isMarkingRead }] =
    useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAllRead }] =
    useMarkAllNotificationsReadMutation();
  const notifications = data?.notifications ?? [];
  const pagination = data?.pagination;

  async function openNotification(notification) {
    setActionError("");
    if (!notification.readAt) {
      const result = await markRead({ notificationId: notification._id });
      if ("error" in result) {
        setActionError(
          getApiErrorMessage(result.error, "Could not mark notification as read."),
        );
        return;
      }
    }
    router.push(ticketHref(role, notification));
  }

  async function handleMarkAllRead() {
    setActionError("");
    const result = await markAllRead();
    if ("error" in result) {
      setActionError(
        getApiErrorMessage(result.error, "Could not mark notifications as read."),
      );
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600" role="status">
        Loading notifications...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-8 text-center">
        <p className="text-sm text-rose-800">
          {getApiErrorMessage(error, "Could not load notifications.")}
        </p>
        <button
          className="mt-3 text-sm font-semibold text-emerald-800 hover:underline"
          onClick={refetch}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            {role} workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Ticket updates and replies that need your attention.
          </p>
        </div>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!data?.unreadCount || isMarkingAllRead}
          onClick={handleMarkAllRead}
          type="button"
        >
          <CheckCheck aria-hidden="true" size={16} />
          {isMarkingAllRead ? "Marking..." : "Mark all as read"}
        </button>
      </header>

      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800" role="alert">
          {actionError}
        </p>
      ) : null}

      <section
        aria-label="Your notifications"
        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      >
        {notifications.length ? (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => (
              <li key={notification._id}>
                <button
                  className={`flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-slate-50 ${
                    notification.readAt ? "" : "bg-emerald-50/50"
                  }`}
                  disabled={isMarkingRead}
                  onClick={() => openNotification(notification)}
                  type="button"
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      notification.readAt
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    <Bell aria-hidden="true" size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {notification.title}
                      </span>
                      {!notification.readAt ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
                          New
                        </span>
                      ) : null}
                    </span>
                    {notification.body ? (
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {notification.body}
                      </span>
                    ) : null}
                    <time
                      className="mt-2 block text-xs text-slate-500"
                      dateTime={notification.createdAt}
                    >
                      {formatDate(notification.createdAt)}
                    </time>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="mt-2 shrink-0 text-slate-400"
                    size={18}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-16 text-center">
            <Bell aria-hidden="true" className="mx-auto text-slate-300" size={28} />
            <h2 className="mt-3 font-semibold text-slate-900">You are all caught up</h2>
            <p className="mt-1 text-sm text-slate-500">
              New ticket activity will appear here.
            </p>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="text-slate-500">
          {pagination?.total ?? 0} notifications &middot; Page {pagination?.page ?? 1} of{" "}
          {Math.max(pagination?.totalPages ?? 0, 1)}
        </p>
        <div className="flex gap-2">
          <button
            aria-label="Previous page"
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" size={17} />
          </button>
          <button
            aria-label="Next page"
            className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 disabled:opacity-40"
            disabled={page >= (pagination?.totalPages ?? 0)}
            onClick={() => setPage((value) => value + 1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
