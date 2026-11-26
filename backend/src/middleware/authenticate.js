import { ACCESS_COOKIE, verifyToken } from "../config/auth.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";

export async function authenticate(request, _response, next) {
  try {
    const token = request.cookies?.[ACCESS_COOKIE];
    if (!token) {
      throw new AppError(401, "Authentication required.");
    }

    const payload = verifyToken(token, "access");
    const user = await User.findById(payload.sub).select("+passwordChangedAt");

    if (!user || user.status !== "active") {
      throw new AppError(401, "Authentication required.");
    }
    if (
      user.passwordChangedAt &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)
    ) {
      throw new AppError(401, "Session expired. Please sign in again.");
    }

    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles) {
  return (request, _response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      next(new AppError(403, "You do not have permission to perform this action."));
      return;
    }
    next();
  };
}
