import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changeUserPassword,
  forgotPassword,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  registerUser,
  resetUserPassword,
  updateCurrentUser,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authenticate.js";
import validate from "../middleware/validate.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../validators/authValidators.js";

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

router.use(authLimiter);
router.post("/register", credentialLimiter, validate(registerSchema), registerUser);
router.post("/login", credentialLimiter, validate(loginSchema), loginUser);
router.post("/logout", logoutUser);
router.post("/refresh", refreshUserSession);
router.post(
  "/forgot-password",
  credentialLimiter,
  validate(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  credentialLimiter,
  validate(resetPasswordSchema),
  resetUserPassword,
);
router.get("/me", authenticate, getCurrentUser);
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  updateCurrentUser,
);
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  changeUserPassword,
);

export default router;
