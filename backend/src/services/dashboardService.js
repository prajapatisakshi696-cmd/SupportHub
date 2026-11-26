import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

function utcDayStart(daysAgo) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date;
}

async function buildTrend(dateField, match, days = 14) {
  const start = utcDayStart(days - 1);
  const results = await Ticket.aggregate([
    {
      $match: {
        ...match,
        [dateField]: { $gte: start },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: `$${dateField}`,
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const countsByDay = new Map(results.map((entry) => [entry._id, entry.count]));

  return Array.from({ length: days }, (_value, index) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + index);
    const day = date.toISOString().slice(0, 10);
    return { date: day, count: countsByDay.get(day) ?? 0 };
  });
}

function getResolutionHours(milliseconds) {
  return milliseconds == null
    ? null
    : Number((milliseconds / (60 * 60 * 1000)).toFixed(1));
}

export async function getAdminDashboard() {
  const thirtyDaysAgo = utcDayStart(29);
  const now = new Date();
  const slaWarningEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const [
    totalTickets,
    statusGroups,
    totalCustomers,
    totalAgents,
    unassignedTickets,
    resolutionSummary,
    ticketTrend,
    agentGroups,
    overdueSlaTickets,
    dueSoonSlaTickets,
    slaResolutionSummary,
  ] = await Promise.all([
    Ticket.countDocuments(),
    Ticket.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.countDocuments({ role: "customer", status: "active" }),
    User.countDocuments({ role: "agent", status: "active" }),
    Ticket.countDocuments({
      assignedAgent: null,
      status: { $in: ["open", "in_progress"] },
    }),
    Ticket.aggregate([
      {
        $match: {
          status: { $in: ["resolved", "closed"] },
          resolvedAt: { $type: "date" },
        },
      },
      {
        $group: {
          _id: null,
          averageMilliseconds: {
            $avg: { $subtract: ["$resolvedAt", "$createdAt"] },
          },
        },
      },
    ]),
    buildTrend("createdAt", {}),
    Ticket.aggregate([
      {
        $match: {
          assignedAgent: { $type: "objectId" },
          status: "resolved",
          resolvedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: "$assignedAgent",
          resolvedTickets: { $sum: 1 },
          averageMilliseconds: {
            $avg: { $subtract: ["$resolvedAt", "$createdAt"] },
          },
        },
      },
      { $sort: { resolvedTickets: -1 } },
      { $limit: 5 },
    ]),
    Ticket.countDocuments({
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $lt: now },
    }),
    Ticket.countDocuments({
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $gt: now, $lte: slaWarningEnd },
    }),
    Ticket.aggregate([
      {
        $match: {
          status: { $in: ["resolved", "closed"] },
          resolvedAt: { $type: "date" },
          slaDeadline: { $type: "date" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          met: {
            $sum: {
              $cond: [{ $lte: ["$resolvedAt", "$slaDeadline"] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const statusCounts = Object.fromEntries(
    statusGroups.map(({ _id, count }) => [_id, count]),
  );
  const agentIds = agentGroups.map(({ _id }) => _id);
  const agents = await User.find({ _id: { $in: agentIds } })
    .select("name")
    .lean();
  const agentNames = new Map(agents.map((agent) => [String(agent._id), agent.name]));

  return {
    metrics: {
      totalTickets,
      openTickets: statusCounts.open ?? 0,
      inProgressTickets: statusCounts.in_progress ?? 0,
      resolvedTickets: statusCounts.resolved ?? 0,
      closedTickets: statusCounts.closed ?? 0,
      totalCustomers,
      totalAgents,
      unassignedTickets,
      averageResolutionHours: getResolutionHours(
        resolutionSummary[0]?.averageMilliseconds,
      ),
      slaComplianceRate: slaResolutionSummary[0]
        ? Number(
            (
              (slaResolutionSummary[0].met /
                slaResolutionSummary[0].total) *
              100
            ).toFixed(1),
          )
        : null,
      overdueSlaTickets,
      dueSoonSlaTickets,
    },
    ticketTrend,
    agentPerformance: agentGroups.map((agent) => ({
      agentId: String(agent._id),
      name: agentNames.get(String(agent._id)) ?? "Former agent",
      resolvedTickets: agent.resolvedTickets,
      averageResolutionHours: getResolutionHours(agent.averageMilliseconds),
    })),
  };
}

export async function getAgentDashboard(userId) {
  const now = new Date();
  const slaWarningEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const [
    statusGroups,
    recentlyResolved,
    averageResolution,
    unassignedTickets,
    resolvedTrend,
    overdueSlaTickets,
    dueSoonSlaTickets,
  ] = await Promise.all([
    Ticket.aggregate([
      { $match: { assignedAgent: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Ticket.countDocuments({
      assignedAgent: userId,
      status: "resolved",
      resolvedAt: { $gte: utcDayStart(29) },
    }),
    Ticket.aggregate([
      {
        $match: {
          assignedAgent: userId,
          status: "resolved",
          resolvedAt: { $gte: utcDayStart(29) },
        },
      },
      {
        $group: {
          _id: null,
          averageMilliseconds: {
            $avg: { $subtract: ["$resolvedAt", "$createdAt"] },
          },
        },
      },
    ]),
    Ticket.countDocuments({
      assignedAgent: null,
      status: { $in: ["open", "in_progress"] },
    }),
    buildTrend("resolvedAt", {
      assignedAgent: userId,
      status: "resolved",
    }),
    Ticket.countDocuments({
      assignedAgent: userId,
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $lt: now },
    }),
    Ticket.countDocuments({
      assignedAgent: userId,
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $gt: now, $lte: slaWarningEnd },
    }),
  ]);
  const statusCounts = Object.fromEntries(
    statusGroups.map(({ _id, count }) => [_id, count]),
  );

  return {
    metrics: {
      assignedTickets: Object.values(statusCounts).reduce(
        (total, count) => total + count,
        0,
      ),
      openTickets: statusCounts.open ?? 0,
      inProgressTickets: statusCounts.in_progress ?? 0,
      resolvedLast30Days: recentlyResolved,
      unassignedTickets,
      averageResolutionHours: getResolutionHours(
        averageResolution[0]?.averageMilliseconds,
      ),
      overdueSlaTickets,
      dueSoonSlaTickets,
    },
    resolvedTrend,
  };
}

export async function getAdminAnalytics(days) {
  const start = utcDayStart(days - 1);
  const now = new Date();
  const warningEnd = new Date(now.getTime() + 60 * 60 * 1000);
  const periodFilter = { createdAt: { $gte: start } };
  const [
    totalCreatedTickets,
    totalResolvedTickets,
    ticketTrend,
    statusGroups,
    priorityGroups,
    resolutionSummary,
    slaResolutionSummary,
    overdueSlaTickets,
    dueSoonSlaTickets,
    agentGroups,
  ] = await Promise.all([
    Ticket.countDocuments(periodFilter),
    Ticket.countDocuments({
      status: { $in: ["resolved", "closed"] },
      resolvedAt: { $gte: start },
    }),
    buildTrend("createdAt", {}, days),
    Ticket.aggregate([
      { $match: periodFilter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Ticket.aggregate([
      { $match: periodFilter },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Ticket.aggregate([
      {
        $match: {
          status: { $in: ["resolved", "closed"] },
          resolvedAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: null,
          averageMilliseconds: {
            $avg: { $subtract: ["$resolvedAt", "$createdAt"] },
          },
        },
      },
    ]),
    Ticket.aggregate([
      {
        $match: {
          status: { $in: ["resolved", "closed"] },
          resolvedAt: { $gte: start },
          slaDeadline: { $type: "date" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          met: {
            $sum: {
              $cond: [{ $lte: ["$resolvedAt", "$slaDeadline"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Ticket.countDocuments({
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $lt: now },
    }),
    Ticket.countDocuments({
      status: { $in: ["open", "in_progress"] },
      slaDeadline: { $gt: now, $lte: warningEnd },
    }),
    Ticket.aggregate([
      {
        $match: {
          assignedAgent: { $type: "objectId" },
          status: { $in: ["resolved", "closed"] },
          resolvedAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: "$assignedAgent",
          resolvedTickets: { $sum: 1 },
          averageMilliseconds: {
            $avg: { $subtract: ["$resolvedAt", "$createdAt"] },
          },
        },
      },
      { $sort: { resolvedTickets: -1 } },
      { $limit: 10 },
    ]),
  ]);
  const agentIds = agentGroups.map(({ _id }) => _id);
  const agents = await User.find({ _id: { $in: agentIds } })
    .select("name")
    .lean();
  const agentNames = new Map(agents.map((agent) => [String(agent._id), agent.name]));
  const compliance = slaResolutionSummary[0];

  return {
    periodDays: days,
    metrics: {
      totalCreatedTickets,
      totalResolvedTickets,
      averageResolutionHours: getResolutionHours(
        resolutionSummary[0]?.averageMilliseconds,
      ),
      slaComplianceRate: compliance
        ? Number(((compliance.met / compliance.total) * 100).toFixed(1))
        : null,
      overdueSlaTickets,
      dueSoonSlaTickets,
    },
    ticketTrend,
    statusBreakdown: statusGroups.map(({ _id, count }) => ({
      status: _id,
      count,
    })),
    priorityBreakdown: priorityGroups.map(({ _id, count }) => ({
      priority: _id,
      count,
    })),
    agentPerformance: agentGroups.map((agent) => ({
      agentId: String(agent._id),
      name: agentNames.get(String(agent._id)) ?? "Former agent",
      resolvedTickets: agent.resolvedTickets,
      averageResolutionHours: getResolutionHours(agent.averageMilliseconds),
    })),
  };
}

export async function getCustomerDashboard(userId) {
  const [statusGroups, recentTickets] = await Promise.all([
    Ticket.aggregate([
      { $match: { customer: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Ticket.find({ customer: userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("ticketNumber subject status priority updatedAt"),
  ]);
  const statusCounts = Object.fromEntries(
    statusGroups.map(({ _id, count }) => [_id, count]),
  );
  const totalTickets = Object.values(statusCounts).reduce(
    (total, count) => total + count,
    0,
  );

  return {
    metrics: {
      totalTickets,
      activeTickets: (statusCounts.open ?? 0) + (statusCounts.in_progress ?? 0),
      resolvedTickets: statusCounts.resolved ?? 0,
      closedTickets: statusCounts.closed ?? 0,
    },
    recentTickets,
  };
}
