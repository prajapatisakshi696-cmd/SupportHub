import assert from "node:assert/strict";
import test from "node:test";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/authValidators.js";

test("registration normalizes email and never accepts a caller-selected role", () => {
  const parsed = registerSchema.safeParse({
    name: "  Alex Support  ",
    email: "ALEX@example.com ",
    password: "A-strong-password-2026",
  });

  assert.equal(parsed.success, true);
  assert.equal(parsed.data.name, "Alex Support");
  assert.equal(parsed.data.email, "alex@example.com");
  assert.equal(
    registerSchema.safeParse({
      name: "Alex Support",
      email: "alex@example.com",
      password: "A-strong-password-2026",
      role: "admin",
    }).success,
    false,
  );
});

test("password validation enforces bcrypt's UTF-8 byte limit", () => {
  const withinLimit = "😀".repeat(18);
  const overLimit = "😀".repeat(19);

  assert.equal(
    registerSchema.safeParse({
      name: "Alex Support",
      email: "alex@example.com",
      password: withinLimit,
    }).success,
    true,
  );
  assert.equal(
    registerSchema.safeParse({
      name: "Alex Support",
      email: "alex@example.com",
      password: overLimit,
    }).success,
    false,
  );
});

test("password change rejects reusing the current password", () => {
  const result = changePasswordSchema.safeParse({
    currentPassword: "A-current-password",
    newPassword: "A-current-password",
    confirmPassword: "A-current-password",
  });
  assert.equal(result.success, false);
});

test("reset tokens must be random-token hex strings", () => {
  assert.equal(
    resetPasswordSchema.safeParse({
      email: "alex@example.com",
      token: "not-a-token",
      password: "A-strong-password-2026",
    }).success,
    false,
  );
});

test("login accepts a password without imposing registration policy again", () => {
  assert.equal(
    loginSchema.safeParse({
      email: "alex@example.com",
      password: "legacy-password",
    }).success,
    true,
  );
});
