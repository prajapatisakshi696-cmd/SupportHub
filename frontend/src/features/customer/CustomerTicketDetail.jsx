"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import { useGetTicketQuery, useUpdateTicketStatusMutation } from "../../services/ticketApi";
import { getApiUrl } from "../../utils/apiUrl";
import { getApiErrorMessage } from "../../utils/apiError";
import { DashboardLoading } from "../dashboard/components/DashboardState";
import TicketConversation from "../messaging/TicketConversation";

const REOPEN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

function formatStatus(status) {
  return status.replace("_", " ");
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(sizeInBytes) {
  return sizeInBytes >= 1024 * 1024
    ? `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(sizeInBytes / 1024))} KB`;
}

function TicketMeta({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium capitalize text-slate-800">
        {children}
      </dd>
    </div>
  );
}

export default function CustomerTicketDetail({ ticketId }) {
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTicketQuery({ ticketId });
  const [updateStatus, { isLoading: isReopening }] = useUpdateTicketStatusMutation();
  const [reopenNote, setReopenNote] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  if (isLoading) {
    return <DashboardLoading label="Loading your request..." />;
  }
  if (isError || !ticket) {
    return (
      <div className="rounded-xl border border-rose-200 bg-white p-6">
        <p className="text-sm text-rose-800">
          {getApiErrorMessage(error, "Could not load this request.")}
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

  const reopenDeadline = ticket.resolvedAt
    ? new Date(ticket.resolvedAt).getTime() + REOPEN_WINDOW_MS
    : 0;
  const canReopen =
    ticket.status === "resolved" &&
    Number.isFinite(reopenDeadline) &&
    Date.now() <= reopenDeadline;

  async function handleReopen(event) {
    event.preventDefault();
    setActionError("");
    setNotice("");
    const result = await updateStatus({
      ticketId,
      status: "open",
      note: reopenNote.trim() || undefined,
    });
    if ("error" in result) {
      setActionError(
        getApiErrorMessage(result.error, "This request could not be reopened."),
      );
      return;
    }
    setReopenNote("");
    setNotice("Your request has been reopened.");
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
        href="/customer/tickets"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to my requests
      </Link>

      <section className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-start">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-slate-500">
            {ticket.ticketNumber}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {ticket.subject}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Submitted {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium capitalize text-slate-700">
          {formatStatus(ticket.status)}
        </span>
      </section>

      {actionError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
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
            <h2 className="font-semibold text-slate-900">What you told us</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>
          </section>

          <TicketConversation
            role="customer"
            ticketId={ticketId}
            ticketStatus={ticket.status}
          />

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold text-slate-900">Attachments</h2>
              <span className="text-xs text-slate-500">
                {ticket.attachments?.length ?? 0} files
              </span>
            </div>
            {ticket.attachments?.length ? (
              <ul className="mt-4 divide-y divide-slate-100">
                {ticket.attachments.map((attachment) => (
                  <li
                    className="flex items-center justify-between gap-3 py-3"
                    key={attachment._id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {attachment.fileName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {attachment.contentType} · {formatFileSize(attachment.sizeInBytes)}
                      </p>
                    </div>
                    <a
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      href={getApiUrl(attachment.url)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <Download aria-hidden="true" size={14} />
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No files were attached to this request.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Status history</h2>
            {ticket.statusHistory?.length ? (
              <ol className="mt-5 space-y-5">
                {ticket.statusHistory.map((entry, index) => (
                  <li
                    className="flex gap-3"
                    key={`${entry.status}-${entry.changedAt}-${index}`}
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-700" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-slate-800">
                        {formatStatus(entry.status)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(entry.changedAt)}
                        {entry.changedBy?.name ? ` · ${entry.changedBy.name}` : ""}
                      </p>
                      {entry.note ? (
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {entry.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                No status updates yet.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">Request information</h2>
            <dl className="mt-5 grid grid-cols-2 gap-5">
              <TicketMeta label="Status">{formatStatus(ticket.status)}</TicketMeta>
              <TicketMeta label="Priority">{ticket.priority}</TicketMeta>
              <TicketMeta label="Category">
                {ticket.category?.name ?? "Uncategorized"}
              </TicketMeta>
              <TicketMeta label="Assigned to">
                {ticket.assignedAgent?.name ?? "Waiting for assignment"}
              </TicketMeta>
            </dl>
            {ticket.slaDeadline ? (
              <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                Target response: {formatDateTime(ticket.slaDeadline)}
              </p>
            ) : null}
          </section>

          {canReopen ? (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="flex items-start gap-3">
                <RotateCcw aria-hidden="true" className="mt-0.5 text-emerald-800" size={18} />
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Still need help?
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Reopen this resolved request within seven days of resolution.
                  </p>
                </div>
              </div>
              <form className="mt-4 space-y-3" onSubmit={handleReopen}>
                <label className="block text-sm font-medium text-slate-700" htmlFor="reopen-note">
                  Add context <span className="font-normal text-slate-500">(optional)</span>
                </label>
                <textarea
                  className="min-h-20 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-700"
                  id="reopen-note"
                  maxLength={1000}
                  onChange={(event) => setReopenNote(event.target.value)}
                  placeholder="What still needs attention?"
                  value={reopenNote}
                />
                <button
                  className="w-full rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
                  disabled={isReopening}
                  type="submit"
                >
                  {isReopening ? "Reopening..." : "Reopen request"}
                </button>
              </form>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
