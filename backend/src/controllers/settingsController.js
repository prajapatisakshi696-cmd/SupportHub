import {
  getSlaSettings,
  updateSlaSettings,
} from "../services/settingsService.js";

export async function getSlaSettingsHandler(_request, response) {
  const settings = await getSlaSettings();
  response.status(200).json({ settings });
}

export async function updateSlaSettingsHandler(request, response) {
  const settings = await updateSlaSettings(
    request.validatedBody.slaHours,
    request.user._id,
  );
  response.status(200).json({ settings });
}
