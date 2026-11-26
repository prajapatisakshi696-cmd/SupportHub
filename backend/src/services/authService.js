import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import RefreshToken from "../models/RefreshToken.js";
import PasswordResetToken from "../models/PasswordResetToken.js";
import AppError from "../utils/AppError.js";
import {
  createTokenPair,
  REFRESH_TOKEN_TTL_MS,
  verifyToken,
} from "../config/auth.js";
import {
  getPasswordResetEmailConfig,
  sendPasswordResetEmail,
} from "./emailService.js";

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(randomBytes(32).toString("hex"), 12);

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function serializeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    createdAt: user.createdAt,
  };
}

async function issueSession(userId) {
  const tokens = createTokenPair(userId);
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(tokens.refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return tokens;
}

export async function register({ name, email, password }) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "customer",
  });
  const tokens = await issueSession(user._id);
  return { user, tokens };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  const passwordMatches = await bcrypt.compare(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches || user.status !== "active") {
    throw new AppError(401, "Email or password is incorrect.");
  }

  user.lastSeenAt = new Date();
  await user.save();
  const tokens = await issueSession(user._id);
  return { user, tokens };
}

export async function refreshSession(rawToken) {
  if (!rawToken) {
    throw new AppError(401, "Authentication required.");
  }
  const payload = verifyToken(rawToken, "refresh");
  const tokenHash = hashToken(rawToken);
  const existingToken = await RefreshToken.findOneAndUpdate(
    {
      tokenHash,
      user: payload.sub,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    { $set: { revokedAt: new Date(), lastUsedAt: new Date() } },
    { new: false },
  );

  if (!existingToken) {
    throw new AppError(401, "Session expired. Please sign in again.");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.status !== "active") {
    throw new AppError(401, "Authentication required.");
  }

  const tokens = await issueSession(user._id);
  return { user, tokens };
}

export async function logout(rawToken) {
  if (!rawToken) {
    return;
  }

  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function requestPasswordReset(email) {
  getPasswordResetEmailConfig();
  const user = await User.findOne({ email, status: "active" });
  if (!user) {
    return;
  }

  const token = randomBytes(32).toString("hex");
  await PasswordResetToken.findOneAndUpdate(
    { user: user._id },
    {
      $set: {
        user: user._id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  try {
    await sendPasswordResetEmail(user, token);
  } catch (error) {
    await PasswordResetToken.deleteOne({
      user: user._id,
      tokenHash: hashToken(token),
    });
    throw error;
  }
}

export async function resetPassword({ email, token, password }) {
  const user = await User.findOne({ email, status: "active" });
  if (!user) {
    throw new AppError(400, "The password reset link is invalid or expired.");
  }

  const resetRecord = await PasswordResetToken.findOneAndDelete({
    user: user._id,
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!resetRecord) {
    throw new AppError(400, "The password reset link is invalid or expired.");
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  await user.save();
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new AppError(404, "User not found.");
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(400, "Current password is incorrect.");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordChangedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
  await user.save();
  await RefreshToken.updateMany(
    { user: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function updateProfile(userId, { name }) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { name } },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new AppError(404, "User not found.");
  }
  return user;
}
