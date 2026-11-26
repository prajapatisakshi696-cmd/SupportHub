"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGetCurrentUserQuery } from "../../services/authApi";
import {
  useAssignTicketMutation,
  useClaimTicketMutation,
  useGetActiveAgentsQuery,
  useGetTicketQuery,
  useUpdateTicketPriorityMutation,
  useUpdateTicketStatusMutation,
} from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  DashboardError,
  DashboardLoading,
} from "./components/DashboardState";
import TicketConversation from "../messaging/TicketConversation";

const nextStatuses = {
  open: ["in_progress", "resolved", "closed"],
  in_progress: ["open", "resolved", "closed"],
  resolved: ["open", "closed"],
  closed: ["open"],
};

function formatLabel(value) {
  return value.replace("_", " ");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSlaState(ticket) {
  if (!ticket.slaDeadline) {
    return "Not set";
  }
  if (!["open", "in_progress"].includes(ticket.status)) {
    return "Deadline";
  }
  const remaining = new Date(ticket.slaDeadline).getTime() - Date.now();
  if (remaining < 0) {
    return "Overdue";
  }
  return remaining <= 60 * 60 * 1000 ? "Due within one hour" : "On track";
}

function TicketMeta({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium capitalize text-slate-800">{children}</dd>
    </div>
  );
}

export default function TicketDetailPage({ ticketId, role }) {
  const isAdmin = role === "admin";
  const { data: user } = useGetCurrentUserQuery();
  const {
    data: ticket,
    isLoading,
    isError,
    refetch,
  } = useGetTicketQuery({ ticketId });
  const {
    data: agents,
    isLoading: isLoadingAgents,
    isError: isAgentsError,
    refetch: refetchAgents,
  } = useGetActiveAgentsQuery(undefined, { skip: !isAdmin });
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateTicketStatusMutation();
  const [updatePriority, { isLoading: isUpdatingPriority }] = useUpdateTicketPriorityMutation();
  const [assignTicket, { isLoading: isAssigning }] = useAssignTicketMutation();
  const [claimTicket, { isLoading: isClaiming }] = useClaimTicketMutation();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status);
      setSelectedPriority(ticket.priority);
      setSelectedAgent(ticket.assignedAgent?._id ?? "");
    }
  }, [ticket]);

  function showResult(result, message) {
    if ("error" in result) {
      setActionError(getApiErrorMessage(result.error, "The ticket could not be updated."));
      return false;
    }
    setNotice(message);
    setActionError("");
    return true;
  }

  async function handleStatusSubmit(event) {
    event.preventDefault();
    const result = await updateStatus({
      ticketId,
      status: selectedStatus,
      note: statusNote,
    });
    if (showResult(result, "Ticket status updated.")) {
      setStatusNote("");
    }
  }

  async function handlePrioritySubmit(event) {
    event.preventDefault();
    const result = await updatePriority({ ticketId, priority: selectedPriority });
    showResult(result, "Ticket priority updated.");
  }

  async function handleAssignmentSubmit(event) {
    event.preventDefault();
    const result = await assignTicket({
      ticketId,
      agentId: selectedAgent || null,
    });
    showResult(result, "Ticket assignment updated.");
  }

  async function handleClaim() {
    const result = await claimTicket({ ticketId });
    showResult(result, "Ticket assigned to you.");
  }

  if (isLoading) {
    return <DashboardLoading label="Loading ticket..." />;
  }
  if (isError || !ticket) {
    return <DashboardError onRetry={refetch} />;
  }

  const statusOptions = nextStatuses[ticket.status] ?? [];
  const canClaim =
    role === "agent" &&
    !ticket.assignedAgent &&
    ["open", "in_progress"].includes(ticket.status);
  const detailBasePath = isAdmin ? "/admin/tickets" : "/agent/tickets";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        className="text-sm font-semibold text-emerald-800 hover:underline"
        href={detailBasePath}
      >
        Back to tickets
      </Link>

      <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-slate-500">
            {ticket.ticketNumber}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {ticket.subject}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Created {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        {canClaim ? (
          <button
            className="shrink-0 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
            disabled={isClaiming}
            onClick={handleClaim}
            type="button"
          >
            {isClaiming ? "Claiming..." : "Claim ticket"}
          </button>
        ) : null}
      </div>

      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800" role="alert">
          {actionError}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Request details</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>
          </section>

          {role !== "agent" ||
          String(ticket.assignedAgent?._id) === String(user?._id) ? (
            <TicketConversation
              role={role}
              ticketId={ticketId}
              ticketStatus={ticket.status}
            />
          ) : (
            <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
              Claim this ticket before opening its conversation.
            </p>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Status history</h2>
            {ticket.statusHistory?.length ? (
              <ol className="mt-5 space-y-4">
                {ticket.statusHistory.map((entry, index) => (
                  <li className="flex gap-3" key={`${entry.status}-${entry.changedAt}-${index}`}>
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-700" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-slate-800">
                        {formatLabel(entry.status)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(entry.changedAt)}
                        {entry.changedBy?.name ? ` · ${entry.changedBy.name}` : ""}
                      </p>
                      {entry.note ? (
                        <p className="mt-1 text-sm text-slate-600">{entry.note}</p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No status changes yet.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Ticket information</h2>
            <dl className="mt-5 grid grid-cols-2 gap-5">
              <TicketMeta label="Status">{formatLabel(ticket.status)}</TicketMeta>
              <TicketMeta label="Priority">{ticket.priority}</TicketMeta>
              <TicketMeta label="Category">{ticket.category?.name ?? "Uncategorized"}</TicketMeta>
              <TicketMeta label="Assigned to">{ticket.assignedAgent?.name ?? "Unassigned"}</TicketMeta>
              <TicketMeta label="SLA deadline">
                {ticket.slaDeadline ? formatDateTime(ticket.slaDeadline) : "Not set"}
              </TicketMeta>
            </dl>
            <p className="mt-4 text-xs font-medium text-slate-600">
              SLA: {getSlaState(ticket)}
            </p>
            {ticket.customer ? (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Customer</p>
                <p className="mt-1.5 text-sm font-medium text-slate-800">{ticket.customer.name}</p>
                <p className="mt-1 text-sm text-slate-500">{ticket.customer.email}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Update ticket</h2>
            <form className="mt-4 space-y-4" onSubmit={handleStatusSubmit}>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="next-status">
                  Status
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize"
                  id="next-status"
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  value={selectedStatus}
                >
                  <option value={ticket.status}>{formatLabel(ticket.status)}</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{formatLabel(status)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="status-note">
                  Status change note
                </label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  id="status-note"
                  maxLength={1000}
                  onChange={(event) => setStatusNote(event.target.value)}
                  placeholder="This note is visible on the ticket."
                  value={statusNote}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Status notes are visible to the customer.
                </p>
              </div>
              <button
                className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
                disabled={isUpdatingStatus || selectedStatus === ticket.status}
                type="submit"
              >
                {isUpdatingStatus ? "Saving..." : "Save status"}
              </button>
            </form>

            <form className="mt-5 border-t border-slate-100 pt-5" onSubmit={handlePrioritySubmit}>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="ticket-priority">
                Priority
              </label>
              <div className="flex gap-2">
                <select
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize"
                  id="ticket-priority"
                  onChange={(event) => setSelectedPriority(event.target.value)}
                  value={selectedPriority}
                >
                  {["low", "medium", "high", "urgent"].map((priority) => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  disabled={isUpdatingPriority || selectedPriority === ticket.priority}
                  type="submit"
                >
                  Save
                </button>
              </div>
            </form>
          </section>

          {isAdmin ? (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">Assignment</h2>
              {isAgentsError ? (
                <div className="mt-3">
                  <p className="text-sm text-rose-700">Could not load active agents.</p>
                  <button
                    className="mt-2 text-sm font-semibold text-emerald-800 hover:underline"
                    onClick={refetchAgents}
                    type="button"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <form className="mt-4 space-y-3" onSubmit={handleAssignmentSubmit}>
                  <label className="sr-only" htmlFor="assigned-agent">Assign ticket to agent</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                    disabled={isLoadingAgents}
                    id="assigned-agent"
                    onChange={(event) => setSelectedAgent(event.target.value)}
                    value={selectedAgent}
                  >
                    <option value="">Unassigned</option>
                    {(agents ?? []).map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name} · {agent.email}
                      </option>
                    ))}
                  </select>
                  <button
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={isAssigning || isLoadingAgents || isAgentsError}
                    type="submit"
                  >
                    {isAssigning ? "Saving..." : "Save assignment"}
                  </button>
                </form>
              )}
            </section>
          ) : null}
        </aside>
      </div>
      <p className="text-xs text-slate-500">
        Signed in as {user?.name ?? "agent"}.
      </p>
    </div>
  );
}
