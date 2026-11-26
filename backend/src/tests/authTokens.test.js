import assert from "node:assert/strict";
import test from "node:test";
import { createTokenPair, verifyToken } from "../config/auth.js";
import AppError from "../utils/AppError.js";

test("access and refresh JWTs are purpose-bound and signed with separate secrets", () => {
  const originalAccessSecret = process.env.ACCESS_TOKEN_SECRET;
  const originalRefreshSecret = process.env.REFRESH_TOKEN_SECRET;
  process.env.ACCESS_TOKEN_SECRET = "a".repeat(64);
  process.env.REFRESH_TOKEN_SECRET = "b".repeat(64);

  try {
    const tokens = createTokenPair("507f1f77bcf86cd799439011");
    assert.equal(verifyToken(tokens.accessToken, "access").sub, "507f1f77bcf86cd799439011");
    assert.equal(verifyToken(tokens.refreshToken, "refresh").sub, "507f1f77bcf86cd799439011");
    assert.throws(() => verifyToken(tokens.refreshToken, "access"), AppError);
  } finally {
    if (originalAccessSecret === undefined) {
      delete process.env.ACCESS_TOKEN_SECRET;
    } else {
      process.env.ACCESS_TOKEN_SECRET = originalAccessSecret;
    }
    if (originalRefreshSecret === undefined) {
      delete process.env.REFRESH_TOKEN_SECRET;
    } else {
      process.env.REFRESH_TOKEN_SECRET = originalRefreshSecret;
    }
  }
});
