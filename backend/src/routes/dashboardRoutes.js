import { Router } from "express";
import {
  getAdminDashboardHandler,
  getAgentDashboardHandler,
  getCustomerDashboardHandler,
} from "../controllers/dashboardController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);
router.get("/admin", authorize("admin"), getAdminDashboardHandler);
router.get("/agent", authorize("agent"), getAgentDashboardHandler);
router.get("/customer", authorize("customer"), getCustomerDashboardHandler);

export default router;
