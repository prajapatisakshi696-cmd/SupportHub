import { z } from "zod";

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Enter a valid ID.");
const status = z.enum(["open", "in_progress", "resolved", "closed"]);
const priority = z.enum(["low", "medium", "high", "urgent"]);

export const ticketIdParamsSchema = z
  .object({ ticketId: objectId })
  .strict();

export const ticketAttachmentParamsSchema = z
  .object({ ticketId: objectId, attachmentId: objectId })
  .strict();

export const listTicketsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    scope: z.enum(["all", "mine", "unassigned"]).optional(),
    status: status.optional(),
    priority: priority.optional(),
    categoryId: objectId.optional(),
    assignedAgentId: objectId.optional(),
    q: z.string().trim().min(1).max(100).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "status", "priority", "ticketNumber"])
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const createTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(200),
    description: z.string().trim().min(1).max(20000),
    categoryId: objectId,
    priority: priority.default("medium"),
  })
  .strict();

export const updateTicketStatusSchema = z
  .object({
    status,
    note: z.string().trim().max(1000).optional(),
  })
  .strict();

export const updateTicketPrioritySchema = z
  .object({
    priority,
  })
  .strict();

export const assignTicketSchema = z
  .object({
    agentId: objectId.nullable(),
  })
  .strict();
