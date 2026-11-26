import assert from "node:assert/strict";
import test from "node:test";
import { adminAnalyticsQuerySchema } from "../validators/analyticsValidators.js";

test("admin analytics accepts only supported reporting windows", () => {
  assert.deepEqual(adminAnalyticsQuerySchema.parse({}), { days: 30 });
  assert.deepEqual(adminAnalyticsQuerySchema.parse({ days: "7" }), { days: 7 });
  assert.equal(adminAnalyticsQuerySchema.safeParse({ days: "14" }).success, false);
  assert.equal(adminAnalyticsQuerySchema.safeParse({ days: "91" }).success, false);
});
