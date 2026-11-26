import assert from "node:assert/strict";
import test from "node:test";
import { requestPasswordReset } from "../services/authService.js";

test("password reset fails explicitly before account lookup if SMTP is unconfigured", async () => {
  const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
  const originalValues = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    delete process.env[key];
  }

  try {
    await assert.rejects(
      requestPasswordReset("unknown@example.com"),
      (error) =>
        error.statusCode === 503 &&
        error.message === "Password reset email is not configured.",
    );
  } finally {
    for (const [key, value] of originalValues) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
});
