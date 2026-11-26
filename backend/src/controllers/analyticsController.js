import { getAdminAnalytics } from "../services/dashboardService.js";

export async function getAdminAnalyticsHandler(request, response) {
  const analytics = await getAdminAnalytics(request.validatedQuery.days);
  response.status(200).json(analytics);
}
