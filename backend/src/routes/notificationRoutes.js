import { Router } from "express";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authenticate.js";
import {
  validateParams,
  validateQuery,
} from "../middleware/validate.js";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "../validators/notificationValidators.js";

const router = Router();

router.use(authenticate);
router.get(
  "/",
  validateQuery(listNotificationsQuerySchema),
  listNotificationsHandler,
);
router.patch("/read-all", markAllNotificationsReadHandler);
router.patch(
  "/:notificationId/read",
  validateParams(notificationIdParamsSchema),
  markNotificationReadHandler,
);

export default router;
