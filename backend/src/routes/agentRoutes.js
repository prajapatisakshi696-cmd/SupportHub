import { Router } from "express";
import { listActiveAgentsHandler } from "../controllers/agentController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate, authorize("admin"));
router.get("/", listActiveAgentsHandler);

export default router;
