import assert from "node:assert/strict";
import test from "node:test";
import {
  listNotificationsQuerySchema,
  notificationIdParamsSchema,
} from "../validators/notificationValidators.js";

test("notification history defaults to a bounded first page", () => {
  assert.deepEqual(listNotificationsQuerySchema.parse({}), {
    page: 1,
    limit: 20,
  });
  assert.equal(
    listNotificationsQuerySchema.safeParse({ page: "0" }).success,
    false,
  );
  assert.equal(
    listNotificationsQuerySchema.safeParse({ limit: "101" }).success,
    false,
  );
});

test("notification read routes validate MongoDB notification IDs", () => {
  assert.equal(
    notificationIdParamsSchema.safeParse({
      notificationId: "507f1f77bcf86cd799439011",
    }).success,
    true,
  );
  assert.equal(
    notificationIdParamsSchema.safeParse({ notificationId: "invalid" }).success,
    false,
  );
});
