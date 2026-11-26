"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Ticket as TicketIcon,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import NotificationNavigation from "../../features/notifications/NotificationNavigation";
import {
  useGetCurrentUserQuery,
  useLogoutMutation,
} from "../../services/authApi";
import { getApiErrorMessage } from "../../utils/apiError";

const navigation = {
  admin: [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/tickets", label: "Tickets", icon: TicketIcon },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/settings", label: "SLA settings", icon: Settings },
  ],
  agent: [
    { href: "/agent/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/agent/tickets", label: "My tickets", icon: TicketIcon },
  ],
  customer: [
    { href: "/customer/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/customer/tickets/new", label: "Create ticket", icon: PlusCircle },
    { href: "/customer/tickets", label: "My tickets", icon: TicketIcon },
  ],
};

export default function WorkspaceShell({ role, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useGetCurrentUserQuery();
  const [logout, { isLoading }] = useLogoutMutation();
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    const result = await logout();
    if ("error" in result) {
      setLogoutError(
        getApiErrorMessage(result.error, "Unable to sign out. Please try again."),
      );
      return;
    }
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="flex shrink-0 flex-col bg-[#17233c] text-white md:min-h-screen md:w-64">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="text-xl font-bold tracking-tight">
            Support<span className="text-emerald-300">Hub</span>
          </span>
        </div>
        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            {role} workspace
          </p>
        </div>
        <nav aria-label="Workspace" className="flex gap-1 px-3 pb-3 md:flex-col">
          {navigation[role].map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href.endsWith("/tickets") &&
                pathname.startsWith(`${href}/`) &&
                !pathname.startsWith(`${href}/new`));
            return (
              <Link
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                href={href}
                key={href}
              >
                <Icon aria-hidden="true" size={18} />
                {label}
              </Link>
            );
          })}
          <NotificationNavigation
            pathname={pathname}
            role={role}
            userId={user?._id}
          />
        </nav>
        <div className="mt-auto border-t border-white/10 p-4">
          <Link
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
            href="/profile"
          >
            <UserRound aria-hidden="true" size={18} />
            Profile
          </Link>
          <button
            className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-60"
            disabled={isLoading}
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} />
            {isLoading ? "Signing out..." : "Sign out"}
          </button>
          {logoutError ? (
            <p className="px-3 pt-2 text-xs text-rose-200" role="alert">
              {logoutError}
            </p>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm font-medium capitalize text-slate-500">{role} workspace</p>
          <span className="text-sm font-medium text-slate-700">
            {user?.name ?? "SupportHub user"}
          </span>
        </header>
        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
