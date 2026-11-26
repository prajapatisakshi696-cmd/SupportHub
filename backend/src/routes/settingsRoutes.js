import { Router } from "express";
import {
  getSlaSettingsHandler,
  updateSlaSettingsHandler,
} from "../controllers/settingsController.js";
import { authenticate, authorize } from "../middleware/authenticate.js";
import validate from "../middleware/validate.js";
import { updateSlaSettingsSchema } from "../validators/settingsValidators.js";

const router = Router();

router.use(authenticate, authorize("admin"));
router.get("/sla", getSlaSettingsHandler);
router.patch("/sla", validate(updateSlaSettingsSchema), updateSlaSettingsHandler);

export default router;
