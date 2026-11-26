import mongoose from "mongoose";
import AppError from "../utils/AppError.js";

export function notFoundHandler(request, _response, next) {
  next(new AppError(404, `Route not found: ${request.method} ${request.path}`));
}

export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (error?.code === 11000) {
    response.status(409).json({ message: "A record with that value already exists." });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    response.status(400).json({ message: "The supplied data is invalid." });
    return;
  }

  console.error("Unhandled API error:", error);
  response.status(500).json({ message: "An unexpected server error occurred." });
}
