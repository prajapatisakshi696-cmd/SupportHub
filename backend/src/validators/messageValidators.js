import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Enter a valid ID.");

export const ticketMessagesParamsSchema = z
  .object({ ticketId: objectId })
  .strict();

export const listTicketMessagesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const sendMessageSchema = z
  .object({
    ticketId: objectId,
    body: z.string().trim().min(1).max(10000),
    isInternal: z.boolean().default(false),
  })
  .strict();

export const typingSchema = z
  .object({
    ticketId: objectId,
    isTyping: z.boolean(),
    isInternal: z.boolean().default(false),
  })
  .strict();

export const readMessagesSchema = z
  .object({
    ticketId: objectId,
    messageIds: z.array(objectId).min(1).max(100),
  })
  .strict()
  .refine(
    ({ messageIds }) => new Set(messageIds).size === messageIds.length,
    "Message IDs must be unique.",
  );
