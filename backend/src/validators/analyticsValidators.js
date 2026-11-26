import { z } from "zod";

export const adminAnalyticsQuerySchema = z
  .object({
    days: z.coerce
      .number()
      .int()
      .refine((value) => [7, 30, 90].includes(value), {
        message: "Choose an analytics range of 7, 30, or 90 days.",
      })
      .default(30),
  })
  .strict();
