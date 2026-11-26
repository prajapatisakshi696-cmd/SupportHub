import cookieParser from "cookie-parser";
import { ACCESS_COOKIE, verifyToken } from "../config/auth.js";
import User from "../models/User.js";

const parseCookies = cookieParser();

function authenticationError(message = "Authentication required.") {
  const error = new Error(message);
  error.data = { code: "UNAUTHORIZED" };
  return error;
}

function originError() {
  const error = new Error("Request origin is not allowed.");
  error.data = { code: "FORBIDDEN" };
  return error;
}

async function authenticateRequest(socket) {
  const token = socket.request.cookies?.[ACCESS_COOKIE];
  if (!token) {
    throw authenticationError();
  }

  const payload = verifyToken(token, "access");
  const user = await User.findById(payload.sub).select("+passwordChangedAt");
  if (
    !user ||
    user.status !== "active" ||
    (user.passwordChangedAt &&
      payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000))
  ) {
    throw authenticationError();
  }

  socket.data.user = user;
  return payload;
}

export default function authenticateSocket(socket, next) {
  const origin = socket.handshake.headers.origin;
  const allowedOrigin = new URL(
    process.env.FRONTEND_URL ?? "http://localhost:3000",
  ).origin;
  if (origin && origin !== allowedOrigin) {
    next(originError());
    return;
  }

  parseCookies(socket.request, {}, (parseError) => {
    if (parseError) {
      next(authenticationError());
      return;
    }

    authenticateRequest(socket)
      .then((payload) => {
        const delay = Math.max(0, payload.exp * 1000 - Date.now());
        const expirationTimer = setTimeout(
          () => socket.disconnect(true),
          delay,
        );
        expirationTimer.unref?.();
        socket.once("disconnect", () => clearTimeout(expirationTimer));
        next();
      })
      .catch((error) => {
        if (error?.data?.code !== "UNAUTHORIZED") {
          console.error("Could not authenticate Socket.IO session:", error);
          next(authenticationError("Could not verify the current session."));
          return;
        }
        next(error);
      });
  });
}
