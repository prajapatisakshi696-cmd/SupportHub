"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { io } from "socket.io-client";
import { Bell } from "lucide-react";
import { notificationApi, useGetNotificationsQuery } from "../../services/notificationApi";
import { socketOrigin } from "../../utils/socketOrigin";

export default function NotificationNavigation({ role, userId, pathname }) {
  const dispatch = useDispatch();
  const { data } = useGetNotificationsQuery({ page: 1, limit: 1 }, {
    skip: !userId,
  });
  const [liveUnavailable, setLiveUnavailable] = useState(false);
  const href = `/${role}/notifications`;
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    const socket = io(socketOrigin, { withCredentials: true });
    socket.on("connect", () => setLiveUnavailable(false));
    socket.on("connect_error", () => setLiveUnavailable(true));
    socket.on("notification:new", () => {
      dispatch(
        notificationApi.util.invalidateTags([
          { type: "Notification", id: "LIST" },
        ]),
      );
    });

    return () => socket.disconnect();
  }, [dispatch, userId]);

  return (
    <>
      <Link
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
          pathname === href
            ? "bg-white/10 text-white"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
        href={href}
      >
        <span className="flex items-center gap-3">
          <Bell aria-hidden="true" size={18} />
          Notifications
        </span>
        {unreadCount ? (
          <span className="rounded-full bg-emerald-300 px-2 py-0.5 text-xs font-bold text-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Link>
      {liveUnavailable ? (
        <p className="px-3 pt-2 text-xs text-amber-200" role="status">
          Live notifications unavailable
        </p>
      ) : null}
    </>
  );
}
