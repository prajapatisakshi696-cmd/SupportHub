"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  useClaimTicketMutation,
  useGetTicketsQuery,
} from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import TicketTable from "./components/TicketTable";
import {
  DashboardError,
  DashboardLoading,
} from "./components/DashboardState";

const statuses = [
  ["", "All statuses"],
  ["open", "Open"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];

export default function TicketListPage({ role }) {
  const isAdmin = role === "admin";
  const [scope, setScope] = useState(isAdmin ? "all" : "mine");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [claimingId, setClaimingId] = useState("");
  const [actionError, setActionError] = useState("");
  const basePath = isAdmin ? "/admin/tickets" : "/agent/tickets";
  const params = {
    scope,
    page,
    limit: 20,
    sortBy: "updatedAt",
    sortOrder: "desc",
    ...(status ? { status } : {}),
    ...(search ? { q: search } : {}),
  };
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetTicketsQuery(params);
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

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  if (isLoading) {
    return <DashboardLoading label="Loading tickets..." />;
  }
  if (isError) {
    return <DashboardError onRetry={refetch} />;
  }

  const pagination = data.pagination;
  const isQueue = !isAdmin && scope === "unassigned";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            {isAdmin ? "Admin workspace" : "Agent workspace"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {isAdmin ? "Ticket management" : "Your tickets"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isAdmin
              ? "Search, review, and assign support requests."
              : "Review assigned work or find an active ticket to claim."}
          </p>
        </div>
        {isAdmin ? (
          <Link
            className="text-sm font-semibold text-emerald-800 hover:underline"
            href="/admin/dashboard"
          >
            Back to overview
          </Link>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        {!isAdmin ? (
          <div aria-label="Ticket queue" className="flex rounded-lg bg-slate-100 p-1" role="group">
            {[
              ["mine", "My tickets"],
              ["unassigned", "Unassigned queue"],
            ].map(([value, label]) => (
              <button
                aria-pressed={scope === value}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  scope === value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                key={value}
                onClick={() => {
                  setScope(value);
                  setPage(1);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm font-medium text-slate-700">All support tickets</p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <form className="flex" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="ticket-search">Search tickets</label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                className="w-full rounded-l-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700 sm:w-56"
                id="ticket-search"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Number or subject"
                value={searchInput}
              />
            </div>
            <button
              className="rounded-r-lg bg-slate-800 px-3 text-sm font-semibold text-white hover:bg-slate-900"
              type="submit"
            >
              Search
            </button>
          </form>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">
            <SlidersHorizontal aria-hidden="true" size={15} />
            <span className="sr-only">Filter by status</span>
            <select
              className="bg-transparent outline-none"
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              value={status}
            >
              {statuses.map(([value, label]) => (
                <option key={value || "all"} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-white p-3 text-sm text-rose-800" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          {pagination.total} {pagination.total === 1 ? "ticket" : "tickets"}
          {isQueue ? " available to claim" : ""}
        </p>
        <p>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</p>
      </div>

      <TicketTable
        basePath={basePath}
        claimingId={claimingId}
        onClaim={handleClaim}
        showAgent={isAdmin}
        showClaim={isQueue}
        showCustomer={isAdmin}
        tickets={data.tickets}
      />

      <div className="flex justify-end gap-2">
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((value) => value - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
          disabled={page >= pagination.totalPages}
          onClick={() => setPage((value) => value + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </div>
  );
}
