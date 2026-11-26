import CompanySettings from "../models/CompanySettings.js";

export const DEFAULT_SLA_HOURS = Object.freeze({
  low: 72,
  medium: 24,
  high: 8,
  urgent: 2,
});

function serializeSlaSettings(settings) {
  return {
    companyName: settings?.companyName ?? "SupportHub",
    timezone: settings?.timezone ?? "UTC",
    slaHours: {
      ...DEFAULT_SLA_HOURS,
      ...(settings?.slaHours?.toObject?.() ?? settings?.slaHours ?? {}),
    },
    updatedAt: settings?.updatedAt ?? null,
  };
}

export async function getSlaSettings() {
  const settings = await CompanySettings.findOne({ key: "default" }).lean();
  return serializeSlaSettings(settings);
}

export async function updateSlaSettings(slaHours, userId) {
  const settings = await CompanySettings.findOneAndUpdate(
    { key: "default" },
    {
      $set: { slaHours, updatedBy: userId },
      $setOnInsert: { companyName: "SupportHub", timezone: "UTC" },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  return serializeSlaSettings(settings);
}

export async function getSlaHoursForPriority(priority) {
  const settings = await CompanySettings.findOne({ key: "default" })
    .select("slaHours")
    .lean();
  return settings?.slaHours?.[priority] ?? DEFAULT_SLA_HOURS[priority];
}
