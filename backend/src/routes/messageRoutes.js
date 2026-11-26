import { Router } from "express";
import { listTicketMessagesHandler } from "../controllers/messageController.js";
import { authenticate } from "../middleware/authenticate.js";
import validate, {
  validateParams,
  validateQuery,
} from "../middleware/validate.js";
import {
  listTicketMessagesQuerySchema,
  ticketMessagesParamsSchema,
} from "../validators/messageValidators.js";

const router = Router();

router.use(authenticate);
router.get(
  "/:ticketId",
  validateParams(ticketMessagesParamsSchema),
  validateQuery(listTicketMessagesQuerySchema),
  listTicketMessagesHandler,
);

export default router;
