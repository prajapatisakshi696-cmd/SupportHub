import Ticket from "../models/Ticket.js";
import { notifySlaAlert } from "../services/notificationService.js";

const ACTIVE_STATUSES = ["open", "in_progress"];
const WARNING_WINDOW_MS = 60 * 60 * 1000;
const BATCH_SIZE = 100;
const INTERVAL_MS = 5 * 60 * 1000;

async function notifyCandidates({ filter, marker, breached, now }) {
  const tickets = await Ticket.find(filter)
    .sort({ slaDeadline: 1 })
    .limit(BATCH_SIZE)
    .select("_id ticketNumber assignedAgent slaDeadline")
    .lean();

  for (const ticket of tickets) {
    const claimed = await Ticket.findOneAndUpdate(
      {
        _id: ticket._id,
        status: { $in: ACTIVE_STATUSES },
        slaDeadline: ticket.slaDeadline,
        [marker]: { $exists: false },
      },
      { $set: { [marker]: now } },
      { new: false },
    )
      .select("_id")
      .lean();
    if (!claimed) {
      continue;
    }

    try {
      await notifySlaAlert(ticket, breached);
    } catch (error) {
      await Ticket.updateOne(
        { _id: ticket._id, [marker]: now },
        { $unset: { [marker]: 1 } },
      );
      console.error("Could not deliver SLA notification:", error);
    }
  }
}

export async function runSlaMonitor(now = new Date()) {
  await notifyCandidates({
    filter: {
      status: { $in: ACTIVE_STATUSES },
      slaDeadline: { $lt: now },
      slaBreachSentAt: { $exists: false },
    },
    marker: "slaBreachSentAt",
    breached: true,
    now,
  });
  await notifyCandidates({
    filter: {
      status: { $in: ACTIVE_STATUSES },
      slaDeadline: {
        $gte: now,
        $lte: new Date(now.getTime() + WARNING_WINDOW_MS),
      },
      slaWarningSentAt: { $exists: false },
    },
    marker: "slaWarningSentAt",
    breached: false,
    now,
  });
}

export function startSlaMonitor() {
  let running = false;
  const runSafely = async () => {
    if (running) {
      return;
    }
    running = true;
    try {
      await runSlaMonitor();
    } catch (error) {
      console.error("SLA monitor run failed:", error);
    } finally {
      running = false;
    }
  };

  void runSafely();
  const interval = setInterval(runSafely, INTERVAL_MS);
  interval.unref?.();
  return () => clearInterval(interval);
}
