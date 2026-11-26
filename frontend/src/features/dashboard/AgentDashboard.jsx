"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  CircleCheck,
  Clock3,
  LifeBuoy,
  ListFilter,
} from "lucide-react";
import {
  useClaimTicketMutation,
  useGetAgentDashboardQuery,
  useGetTicketsQuery,
} from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import MetricCard from "./components/MetricCard";
import TicketTable from "./components/TicketTable";
import {
  DashboardError,
  DashboardLoading,
} from "./components/DashboardState";

export default function AgentDashboard() {
  const [claimingId, setClaimingId] = useState("");
  const [actionError, setActionError] = useState("");
  const {
    data: dashboard,
    isLoading,
    isError,
    refetch,
  } = useGetAgentDashboardQuery();
  const {
    data: assignedTickets,
    isLoading: isLoadingAssigned,
    isError: isAssignedError,
    refetch: refetchAssigned,
  } = useGetTicketsQuery({
    scope: "mine",
    page: 1,
    limit: 5,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const {
    data: queueTickets,
    isLoading: isLoadingQueue,
    isError: isQueueError,
    refetch: refetchQueue,
  } = useGetTicketsQuery({
    scope: "unassigned",
    page: 1,
    limit: 5,
    sortBy: "createdAt",
    sortOrder: "asc",
  });
  const [claimTicket] = useClaimTicketMutation();

  async function handleClaim(ticketId) {
    setActionError("");
    setClaimingId(ticketId);
    const result = await claimTicket({ ticketId });
    setClaimingId("");
    if ("error" in result) {
      setActionError(getApiErrorMessage(result.error, "Unable to claim this ticket."));
    }
  }

  if (isLoading) {
    return <DashboardLoading />;
  }
  if (isError) {
    return <DashboardError onRetry={refetch} />;
  }

  const cards = [
    { label: "Assigned tickets", value: dashboard.metrics.assignedTickets, icon: LifeBuoy },
    { label: "Open", value: dashboard.metrics.openTickets, icon: ListFilter },
    { label: "In progress", value: dashboard.metrics.inProgressTickets, icon: Activity },
    { label: "Unassigned queue", value: dashboard.metrics.unassignedTickets, icon: LifeBuoy },
    {
      label: "Resolved last 30 days",
      value: dashboard.metrics.resolvedLast30Days,
      icon: CircleCheck,
      detail: dashboard.metrics.averageResolutionHours == null
        ? "Average resolution time —"
        : `Average resolution ${dashboard.metrics.averageResolutionHours}h`,
    },
    {
      label: "SLA overdue",
      value: dashboard.metrics.overdueSlaTickets,
      icon: Clock3,
      detail: "Active assigned tickets",
    },
    {
      label: "Due within one hour",
      value: dashboard.metrics.dueSoonSlaTickets,
      icon: Clock3,
      detail: "Active assigned tickets",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Agent workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Your support queue
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Keep your assigned work moving and pick up available tickets.
          </p>
        </div>
        <Link
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          href="/agent/tickets"
        >
          Open ticket queue
        </Link>
      </div>

      <section aria-label="Agent metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800" role="alert">
          {actionError}
        </p>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">My assigned tickets</h2>
            <p className="mt-1 text-sm text-slate-500">Work assigned to your account.</p>
          </div>
          <Link className="text-sm font-semibold text-emerald-800 hover:underline" href="/agent/tickets">
            View all
          </Link>
        </div>
        {isAssignedError ? (
          <DashboardError onRetry={refetchAssigned} />
        ) : isLoadingAssigned ? (
          <DashboardLoading label="Loading your tickets..." />
        ) : (
          <TicketTable basePath="/agent/tickets" tickets={assignedTickets?.tickets} />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Unassigned queue</h2>
          <p className="mt-1 text-sm text-slate-500">Claim an active ticket to take ownership.</p>
        </div>
        {isQueueError ? (
          <DashboardError onRetry={refetchQueue} />
        ) : isLoadingQueue ? (
          <DashboardLoading label="Loading unassigned tickets..." />
        ) : (
          <TicketTable
            basePath="/agent/tickets"
            claimingId={claimingId}
            onClaim={handleClaim}
            showClaim
            tickets={queueTickets?.tickets}
          />
        )}
      </section>
    </div>
  );
}
