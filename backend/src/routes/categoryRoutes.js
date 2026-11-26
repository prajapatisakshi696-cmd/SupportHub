import { Router } from "express";
import { listActiveCategories } from "../controllers/categoryController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);
router.get("/", listActiveCategories);

export default router;
