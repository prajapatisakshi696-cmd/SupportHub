"use client";

import Link from "next/link";
import {
  Activity,
  CircleCheck,
  CircleDot,
  Clock3,
  LifeBuoy,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useGetAdminDashboardQuery,
  useGetTicketsQuery,
} from "../../services/ticketApi";
import MetricCard from "./components/MetricCard";
import TicketTable from "./components/TicketTable";
import {
  DashboardError,
  DashboardLoading,
} from "./components/DashboardState";

function formatResolution(hours) {
  return hours == null ? "—" : `${hours}h`;
}

export default function AdminDashboard() {
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useGetAdminDashboardQuery();
  const {
    data: recentTickets,
    isLoading: isLoadingTickets,
    isError: isTicketsError,
    refetch: refetchTickets,
  } = useGetTicketsQuery({
    scope: "all",
    page: 1,
    limit: 6,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  if (isLoading) {
    return <DashboardLoading />;
  }
  if (isError) {
    return <DashboardError onRetry={refetch} />;
  }

  const { metrics, ticketTrend, agentPerformance } = dashboard;
  const cards = [
    { label: "Total tickets", value: metrics.totalTickets, icon: LifeBuoy },
    { label: "Open", value: metrics.openTickets, icon: CircleDot },
    { label: "In progress", value: metrics.inProgressTickets, icon: Activity },
    { label: "Resolved", value: metrics.resolvedTickets, icon: CircleCheck },
    { label: "Closed", value: metrics.closedTickets, icon: CircleCheck },
    { label: "Customers", value: metrics.totalCustomers, icon: UsersRound },
    { label: "Agents", value: metrics.totalAgents, icon: UsersRound },
    {
      label: "Avg. resolution",
      value: formatResolution(metrics.averageResolutionHours),
      icon: Clock3,
      detail: "Resolved tickets",
    },
    { label: "Unassigned queue", value: metrics.unassignedTickets, icon: LifeBuoy },
    {
      label: "SLA compliance",
      value: metrics.slaComplianceRate == null
        ? "—"
        : `${metrics.slaComplianceRate}%`,
      icon: ShieldCheck,
      detail: "Resolved within deadline",
    },
    {
      label: "SLA overdue",
      value: metrics.overdueSlaTickets,
      icon: Clock3,
      detail: "Active tickets",
    },
    {
      label: "Due within one hour",
      value: metrics.dueSoonSlaTickets,
      icon: Clock3,
      detail: "Active tickets",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Support overview
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            A live view of your ticket workload and team.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          href="/admin/tickets"
        >
          Manage tickets
        </Link>
      </div>

      <section aria-label="Support metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">Ticket volume</h2>
            <p className="mt-1 text-sm text-slate-500">Tickets created each day over the last 14 days.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={ticketTrend} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="#e8edf2" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(value) => value.slice(5)}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 10 }}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Bar dataKey="count" fill="#176b5b" name="Tickets" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Agent performance</h2>
              <p className="mt-1 text-sm text-slate-500">Resolved tickets in the last 30 days.</p>
            </div>
          </div>
          {agentPerformance.length ? (
            <div className="divide-y divide-slate-100">
              {agentPerformance.map((agent) => (
                <div className="flex items-center justify-between gap-4 py-3" key={agent.agentId}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{agent.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Avg. resolution {formatResolution(agent.averageResolutionHours)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {agent.resolvedTickets} resolved
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              No agent resolutions recorded in this period.
            </p>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recently updated tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Latest activity across the support queue.</p>
          </div>
          <Link className="text-sm font-semibold text-emerald-800 hover:underline" href="/admin/tickets">
            View all
          </Link>
        </div>
        {isTicketsError ? (
          <DashboardError onRetry={refetchTickets} />
        ) : isLoadingTickets ? (
          <DashboardLoading label="Loading recent tickets..." />
        ) : (
          <TicketTable
            basePath="/admin/tickets"
            showAgent
            showCustomer
            tickets={recentTickets?.tickets}
          />
        )}
      </section>
    </div>
  );
}
