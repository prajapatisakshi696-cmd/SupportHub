import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Enter a valid ID.");

export const listNotificationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const notificationIdParamsSchema = z
  .object({ notificationId: objectId })
  .strict();
