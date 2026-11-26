import AppError from "../utils/AppError.js";

export default function trustedOrigin(request, _response, next) {
  const origin = request.get("origin");
  if (!origin) {
    next();
    return;
  }

  const frontendOrigin = new URL(
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ).origin;
  if (origin !== frontendOrigin) {
    next(new AppError(403, "Request origin is not allowed."));
    return;
  }

  next();
}
