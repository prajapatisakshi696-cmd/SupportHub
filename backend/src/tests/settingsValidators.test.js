import assert from "node:assert/strict";
import test from "node:test";
import { updateSlaSettingsSchema } from "../validators/settingsValidators.js";

test("SLA settings require valid per-priority hour targets", () => {
  const valid = {
    slaHours: { low: "72", medium: "24", high: "8", urgent: "2" },
  };
  assert.deepEqual(updateSlaSettingsSchema.parse(valid), {
    slaHours: { low: 72, medium: 24, high: 8, urgent: 2 },
  });
  assert.equal(
    updateSlaSettingsSchema.safeParse({
      slaHours: { low: 0, medium: 24, high: 8, urgent: 2 },
    }).success,
    false,
  );
  assert.equal(
    updateSlaSettingsSchema.safeParse({
      slaHours: { low: 72, medium: 24, high: 8, urgent: 2, custom: 1 },
    }).success,
    false,
  );
});
