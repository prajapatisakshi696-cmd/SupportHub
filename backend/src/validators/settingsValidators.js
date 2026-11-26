import { z } from "zod";

const slaHoursSchema = z
  .object({
    low: z.coerce.number().int().min(1).max(8760),
    medium: z.coerce.number().int().min(1).max(8760),
    high: z.coerce.number().int().min(1).max(8760),
    urgent: z.coerce.number().int().min(1).max(8760),
  })
  .strict();

export const updateSlaSettingsSchema = z
  .object({ slaHours: slaHoursSchema })
  .strict();
