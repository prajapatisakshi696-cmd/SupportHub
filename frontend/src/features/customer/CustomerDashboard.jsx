"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { useGetCurrentUserQuery } from "../../services/authApi";
import { useGetCustomerDashboardQuery } from "../../services/ticketApi";
import MetricCard from "../dashboard/components/MetricCard";
import {
  DashboardError,
  DashboardLoading,
} from "../dashboard/components/DashboardState";

function formatStatus(status) {
  return status.replace("_", " ");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

const statusStyles = {
  open: "bg-sky-50 text-sky-700",
  in_progress: "bg-amber-50 text-amber-800",
  resolved: "bg-emerald-50 text-emerald-800",
  closed: "bg-slate-100 text-slate-600",
};

export default function CustomerDashboard() {
  const { data: user } = useGetCurrentUserQuery();
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useGetCustomerDashboardQuery();

  if (isLoading) {
    return <DashboardLoading label="Loading your support overview..." />;
  }
  if (isError) {
    return <DashboardError onRetry={refetch} />;
  }

  const cards = [
    { label: "All requests", value: dashboard.metrics.totalTickets, icon: LifeBuoy },
    { label: "Needs attention", value: dashboard.metrics.activeTickets, icon: CircleDot },
    { label: "Resolved", value: dashboard.metrics.resolvedTickets, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Customer portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {user?.name ? `Hello, ${user.name.split(" ")[0]}` : "Your support"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Check the progress of your requests or start a new one.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          href="/customer/tickets/new"
        >
          <Plus aria-hidden="true" size={17} />
          Create a ticket
        </Link>
      </div>

      <section
        aria-label="Your ticket summary"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Recently updated
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest activity on your support requests.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 hover:underline"
            href="/customer/tickets"
          >
            View all <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>

        {dashboard.recentTickets.length ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <ul className="divide-y divide-slate-100">
              {dashboard.recentTickets.map((ticket) => (
                <li key={ticket._id}>
                  <Link
                    className="flex flex-col justify-between gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                    href={`/customer/tickets/${ticket._id}`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold tracking-wide text-slate-500">
                        {ticket.ticketNumber}
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                        {ticket.subject}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Updated {formatDate(ticket.updatedAt)}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        statusStyles[ticket.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {formatStatus(ticket.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <LifeBuoy aria-hidden="true" className="mx-auto text-slate-400" size={28} />
            <h3 className="mt-3 font-semibold text-slate-900">
              No support requests yet
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Create a ticket and your support team will take it from there.
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
              href="/customer/tickets/new"
            >
              Create your first ticket <ArrowRight aria-hidden="true" size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
