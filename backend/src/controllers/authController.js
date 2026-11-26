import {
  clearAuthCookies,
  REFRESH_COOKIE,
  setAuthCookies,
} from "../config/auth.js";
import {
  changePassword,
  login,
  logout,
  refreshSession,
  register,
  requestPasswordReset,
  resetPassword,
  serializeUser,
  updateProfile,
} from "../services/authService.js";
import AppError from "../utils/AppError.js";

export async function registerUser(request, response) {
  const result = await register(request.validatedBody);
  setAuthCookies(response, result.tokens);
  response.status(201).json({ user: serializeUser(result.user) });
}

export async function loginUser(request, response) {
  const result = await login(request.validatedBody);
  setAuthCookies(response, result.tokens);
  response.status(200).json({ user: serializeUser(result.user) });
}

export async function logoutUser(request, response) {
  await logout(request.cookies?.[REFRESH_COOKIE]);
  clearAuthCookies(response);
  response.status(200).json({ message: "You have been signed out." });
}

export async function refreshUserSession(request, response) {
  try {
    const result = await refreshSession(request.cookies?.[REFRESH_COOKIE]);
    setAuthCookies(response, result.tokens);
    response.status(200).json({ user: serializeUser(result.user) });
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      clearAuthCookies(response);
    }
    throw error;
  }
}

export function getCurrentUser(request, response) {
  response.status(200).json({ user: serializeUser(request.user) });
}

export async function forgotPassword(request, response) {
  await requestPasswordReset(request.validatedBody.email);
  response.status(200).json({
    message: "If an active account exists, a password reset link will be sent.",
  });
}

export async function resetUserPassword(request, response) {
  await resetPassword(request.validatedBody);
  clearAuthCookies(response);
  response.status(200).json({ message: "Password reset. Please sign in again." });
}

export async function changeUserPassword(request, response) {
  await changePassword(request.user._id, request.validatedBody);
  clearAuthCookies(response);
  response.status(200).json({ message: "Password changed. Please sign in again." });
}

export async function updateCurrentUser(request, response) {
  const user = await updateProfile(request.user._id, request.validatedBody);
  response.status(200).json({ user: serializeUser(user) });
}
