"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, Clock3, LifeBuoy, ShieldCheck } from "lucide-react";
import { useGetAdminAnalyticsQuery } from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import MetricCard from "../dashboard/components/MetricCard";
import {
  DashboardError,
  DashboardLoading,
} from "../dashboard/components/DashboardState";

const priorityColors = {
  low: "#94a3b8",
  medium: "#0f766e",
  high: "#d97706",
  urgent: "#e11d48",
};

function formatResolution(hours) {
  return hours == null ? "—" : `${hours}h`;
}

function formatLabel(value) {
  return value.replace("_", " ");
}

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, error, refetch } =
    useGetAdminAnalyticsQuery({ days });

  if (isLoading) {
    return <DashboardLoading label="Loading analytics..." />;
  }
  if (isError) {
    return (
      <DashboardError
        message={getApiErrorMessage(error, "Could not load analytics.")}
        onRetry={refetch}
      />
    );
  }

  const cards = [
    {
      label: "Tickets created",
      value: data.metrics.totalCreatedTickets,
      icon: LifeBuoy,
      detail: `Last ${days} days`,
    },
    {
      label: "Tickets resolved",
      value: data.metrics.totalResolvedTickets,
      icon: Activity,
      detail: `Last ${days} days`,
    },
    {
      label: "Average resolution",
      value: formatResolution(data.metrics.averageResolutionHours),
      icon: Clock3,
      detail: "Resolved in selected period",
    },
    {
      label: "SLA compliance",
      value:
        data.metrics.slaComplianceRate == null
          ? "—"
          : `${data.metrics.slaComplianceRate}%`,
      icon: ShieldCheck,
      detail: "Resolved within deadline",
    },
    {
      label: "SLA breached",
      value: data.metrics.overdueSlaTickets,
      icon: Clock3,
      detail: "Active tickets overdue",
    },
    {
      label: "Due within one hour",
      value: data.metrics.dueSoonSlaTickets,
      icon: Clock3,
      detail: "Active tickets",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Admin workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Workload, resolution, and SLA performance from ticket data.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          <span>Period</span>
          <select
            className="bg-transparent font-semibold outline-none"
            onChange={(event) => setDays(Number(event.target.value))}
            value={days}
          >
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </label>
      </header>

      <section
        aria-label="Analytics metrics"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Ticket volume</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tickets created each day in the selected period.
          </p>
          <div className="mt-5 h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={data.ticketTrend}
                margin={{ top: 8, right: 12, bottom: 0, left: -20 }}
              >
                <CartesianGrid
                  stroke="#e8edf2"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickFormatter={(value) => value.slice(5)}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 10,
                  }}
                  labelFormatter={(value) => `Date: ${value}`}
                />
                <Bar
                  dataKey="count"
                  fill="#176b5b"
                  name="Tickets"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Priority mix</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tickets created in the selected period.
          </p>
          {data.priorityBreakdown.length ? (
            <div className="h-72">
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie
                    data={data.priorityBreakdown}
                    dataKey="count"
                    nameKey="priority"
                    outerRadius={90}
                  >
                    {data.priorityBreakdown.map((entry) => (
                      <Cell
                        fill={priorityColors[entry.priority] ?? "#64748b"}
                        key={entry.priority}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, formatLabel(name)]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              No tickets created in this period.
            </p>
          )}
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            {data.priorityBreakdown.map((entry) => (
              <li className="inline-flex items-center gap-1.5" key={entry.priority}>
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: priorityColors[entry.priority] }}
                />
                <span className="capitalize text-slate-600">
                  {entry.priority} ({entry.count})
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Current ticket status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Status of tickets created in this period.
          </p>
          {data.statusBreakdown.length ? (
            <ul className="mt-5 space-y-4">
              {data.statusBreakdown.map((entry) => {
                const percent = data.metrics.totalCreatedTickets
                  ? (entry.count / data.metrics.totalCreatedTickets) * 100
                  : 0;
                return (
                  <li key={entry.status}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-slate-700">
                        {formatLabel(entry.status)}
                      </span>
                      <span className="font-semibold text-slate-900">
                        {entry.count}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-emerald-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              No tickets created in this period.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Agent performance</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tickets resolved in the selected period.
          </p>
          {data.agentPerformance.length ? (
            <ul className="mt-4 divide-y divide-slate-100">
              {data.agentPerformance.map((agent) => (
                <li
                  className="flex items-center justify-between gap-4 py-3"
                  key={agent.agentId}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {agent.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Average resolution {formatResolution(agent.averageResolutionHours)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {agent.resolvedTickets} resolved
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">
              No resolutions recorded in this period.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
