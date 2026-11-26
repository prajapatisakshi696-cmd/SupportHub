"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useGetTicketsQuery } from "../../services/ticketApi";
import { getApiErrorMessage } from "../../utils/apiError";
import TicketTable from "../dashboard/components/TicketTable";
import {
  DashboardError,
  DashboardLoading,
} from "../dashboard/components/DashboardState";

const statuses = [
  ["", "All statuses"],
  ["open", "Open"],
  ["in_progress", "In progress"],
  ["resolved", "Resolved"],
  ["closed", "Closed"],
];

export default function CustomerTicketsPage() {
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTicketsQuery({
    page,
    limit: 20,
    sortBy: "updatedAt",
    sortOrder: "desc",
    ...(status ? { status } : {}),
    ...(search ? { q: search } : {}),
  });

  if (isLoading) {
    return <DashboardLoading label="Loading your tickets..." />;
  }
  if (isError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-6">
        <p className="text-sm text-rose-800">
          {getApiErrorMessage(error, "Could not load your tickets.")}
        </p>
        <button
          className="mt-3 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={refetch}
          type="button"
        >
          Try again
        </button>
      </div>
    );
  }

  const { pagination, tickets } = data;

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-800">
            Customer portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            My support requests
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Search your tickets and follow their latest status.
          </p>
        </div>
        <Link
          className="rounded-lg bg-emerald-800 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-900"
          href="/customer/tickets/new"
        >
          Create a ticket
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">
          {pagination.total} {pagination.total === 1 ? "request" : "requests"}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <form className="flex" onSubmit={submitSearch}>
            <label className="sr-only" htmlFor="customer-ticket-search">
              Search your tickets
            </label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                className="w-full rounded-l-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700 sm:w-56"
                id="customer-ticket-search"
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
                <option key={value || "all"} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {tickets.length ? (
        <TicketTable
          basePath="/customer/tickets"
          showAgent
          tickets={tickets}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold text-slate-900">
            {search || status ? "No matching requests" : "Nothing here yet"}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {search || status
              ? "Try changing the search or status filter."
              : "Create a support request to start a conversation with your team."}
          </p>
          {!search && !status ? (
            <Link
              className="mt-4 inline-flex rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              href="/customer/tickets/new"
            >
              Create a ticket
            </Link>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            type="button"
          >
            Previous
          </button>
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-700 disabled:opacity-40"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
