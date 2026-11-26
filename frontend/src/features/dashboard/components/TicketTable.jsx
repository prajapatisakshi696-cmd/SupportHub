import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const statusStyles = {
  open: "bg-sky-50 text-sky-700",
  in_progress: "bg-amber-50 text-amber-800",
  resolved: "bg-emerald-50 text-emerald-800",
  closed: "bg-slate-100 text-slate-600",
};

const priorityStyles = {
  low: "text-slate-500",
  medium: "text-sky-700",
  high: "text-amber-800",
  urgent: "text-rose-700",
};

function formatStatus(status) {
  return status.replace("_", " ");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function TicketTable({
  tickets,
  basePath,
  showCustomer = false,
  showAgent = false,
  showClaim = false,
  onClaim,
  claimingId,
}) {
  if (!tickets?.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-5 py-10 text-center">
        <p className="text-sm font-medium text-slate-700">No tickets to show</p>
        <p className="mt-1 text-sm text-slate-500">
          New tickets will appear here when they match this view.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Ticket</th>
            {showCustomer ? <th className="px-4 py-3 font-semibold">Customer</th> : null}
            {showAgent ? <th className="px-4 py-3 font-semibold">Assigned agent</th> : null}
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Updated</th>
            {showClaim ? <th className="px-4 py-3 font-semibold">Action</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tickets.map((ticket) => (
            <tr className="hover:bg-slate-50/70" key={ticket._id}>
              <td className="px-4 py-3.5">
                <Link
                  className="group inline-flex items-center gap-1 font-medium text-slate-900 hover:text-emerald-800"
                  href={`${basePath}/${ticket._id}`}
                >
                  <span className="text-xs font-semibold text-slate-500">
                    {ticket.ticketNumber}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="opacity-0 transition group-hover:opacity-100"
                    size={14}
                  />
                </Link>
                <p className="mt-1 max-w-xs truncate text-slate-700">{ticket.subject}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {ticket.category?.name ?? "Uncategorized"}
                </p>
              </td>
              {showCustomer ? (
                <td className="px-4 py-3.5 text-slate-600">
                  <span className="block font-medium text-slate-800">
                    {ticket.customer?.name ?? "Unknown"}
                  </span>
                  <span className="mt-1 block text-xs">{ticket.customer?.email}</span>
                </td>
              ) : null}
              {showAgent ? (
                <td className="px-4 py-3.5 text-slate-600">
                  {ticket.assignedAgent?.name ?? "Unassigned"}
                </td>
              ) : null}
              <td className="px-4 py-3.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                    statusStyles[ticket.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {formatStatus(ticket.status)}
                </span>
              </td>
              <td
                className={`px-4 py-3.5 font-medium capitalize ${
                  priorityStyles[ticket.priority] ?? "text-slate-600"
                }`}
              >
                {ticket.priority}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-slate-500">
                {formatDate(ticket.updatedAt)}
              </td>
              {showClaim ? (
                <td className="px-4 py-3.5">
                  {!ticket.assignedAgent ? (
                    <button
                      className="rounded-md border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
                      disabled={claimingId === ticket._id}
                      onClick={() => onClaim(ticket._id)}
                      type="button"
                    >
                      {claimingId === ticket._id ? "Claiming..." : "Claim"}
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
