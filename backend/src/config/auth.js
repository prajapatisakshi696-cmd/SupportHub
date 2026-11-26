import jwt from "jsonwebtoken";
import AppError from "../utils/AppError.js";

export const ACCESS_COOKIE = "supporthub_access";
export const REFRESH_COOKIE = "supporthub_refresh";
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(name) {
  const secret = process.env[name];
  if (!secret || secret.length < 64) {
    throw new Error(`${name} must be set to at least 64 characters.`);
  }
  return secret;
}

function getSameSite() {
  return (process.env.COOKIE_SAME_SITE ?? "lax").toLowerCase();
}

export function validateAuthConfig() {
  const accessSecret = getSecret("ACCESS_TOKEN_SECRET");
  const refreshSecret = getSecret("REFRESH_TOKEN_SECRET");
  if (accessSecret === refreshSecret) {
    throw new Error("ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different.");
  }

  const sameSite = getSameSite();
  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw new Error("COOKIE_SAME_SITE must be lax, strict, or none.");
  }
  if (sameSite === "none" && process.env.NODE_ENV !== "production") {
    throw new Error("COOKIE_SAME_SITE=none requires NODE_ENV=production.");
  }
  try {
    const frontendUrl = new URL(
      process.env.FRONTEND_URL ?? "http://localhost:3000",
    );
    if (!["http:", "https:"].includes(frontendUrl.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error("FRONTEND_URL must be a valid HTTP or HTTPS URL.");
  }
}

export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: getSameSite(),
    path: "/",
  };
}

export function createTokenPair(userId) {
  const subject = String(userId);
  const accessToken = jwt.sign(
    { tokenType: "access" },
    getSecret("ACCESS_TOKEN_SECRET"),
    { algorithm: "HS256", subject, expiresIn: ACCESS_TOKEN_TTL_SECONDS },
  );
  const refreshToken = jwt.sign(
    { tokenType: "refresh" },
    getSecret("REFRESH_TOKEN_SECRET"),
    { algorithm: "HS256", subject, expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
}

export function verifyToken(token, tokenType) {
  try {
    const secret =
      tokenType === "access"
        ? getSecret("ACCESS_TOKEN_SECRET")
        : getSecret("REFRESH_TOKEN_SECRET");
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (payload.tokenType !== tokenType || typeof payload.sub !== "string") {
      throw new AppError(401, "Authentication required.");
    }

    return payload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "Authentication required.");
    }
    throw error;
  }
}

export function setAuthCookies(response, tokens) {
  const options = getCookieOptions();
  response.cookie(ACCESS_COOKIE, tokens.accessToken, {
    ...options,
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
  });
  response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...options,
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearAuthCookies(response) {
  const options = getCookieOptions();
  response.clearCookie(ACCESS_COOKIE, options);
  response.clearCookie(REFRESH_COOKIE, options);
}
