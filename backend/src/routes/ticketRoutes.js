import { Router } from "express";
import {
  assignTicketHandler,
  claimTicketHandler,
  createTicketHandler,
  getTicketHandler,
  getTicketAttachmentDownloadHandler,
  listTicketsHandler,
  updateTicketPriorityHandler,
  updateTicketStatusHandler,
} from "../controllers/ticketController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import parseTicketAttachments from "../middleware/parseTicketAttachments.js";
import validate, {
  validateParams,
  validateQuery,
} from "../middleware/validate.js";
import {
  assignTicketSchema,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketAttachmentParamsSchema,
  ticketIdParamsSchema,
  updateTicketPrioritySchema,
  updateTicketStatusSchema,
} from "../validators/ticketValidators.js";

const router = Router();

router.use(authenticate);
router.get("/", validateQuery(listTicketsQuerySchema), listTicketsHandler);
router.post(
  "/",
  authorize("customer"),
  parseTicketAttachments,
  validate(createTicketSchema),
  createTicketHandler,
);
router.post(
  "/:ticketId/assign",
  authorize("admin"),
  validateParams(ticketIdParamsSchema),
  validate(assignTicketSchema),
  assignTicketHandler,
);
router.post(
  "/:ticketId/claim",
  authorize("agent"),
  validateParams(ticketIdParamsSchema),
  claimTicketHandler,
);
router.patch(
  "/:ticketId/status",
  validateParams(ticketIdParamsSchema),
  validate(updateTicketStatusSchema),
  updateTicketStatusHandler,
);
router.patch(
  "/:ticketId/priority",
  authorize("admin", "agent"),
  validateParams(ticketIdParamsSchema),
  validate(updateTicketPrioritySchema),
  updateTicketPriorityHandler,
);
router.get(
  "/:ticketId/attachments/:attachmentId",
  validateParams(ticketAttachmentParamsSchema),
  getTicketAttachmentDownloadHandler,
);
router.get(
  "/:ticketId",
  validateParams(ticketIdParamsSchema),
  getTicketHandler,
);

export default router;
