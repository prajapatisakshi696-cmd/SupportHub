import { Router } from "express";
import { getAdminAnalyticsHandler } from "../controllers/analyticsController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { adminAnalyticsQuerySchema } from "../validators/analyticsValidators.js";

const router = Router();

router.use(authenticate, authorize("admin"));
router.get(
  "/admin",
  validateQuery(adminAnalyticsQuerySchema),
  getAdminAnalyticsHandler,
);

export default router;
