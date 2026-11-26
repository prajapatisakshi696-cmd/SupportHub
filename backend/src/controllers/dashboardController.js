import {
  getAdminDashboard,
  getAgentDashboard,
  getCustomerDashboard,
} from "../services/dashboardService.js";

export async function getAdminDashboardHandler(_request, response) {
  const dashboard = await getAdminDashboard();
  response.status(200).json(dashboard);
}

export async function getAgentDashboardHandler(request, response) {
  const dashboard = await getAgentDashboard(request.user._id);
  response.status(200).json(dashboard);
}

export async function getCustomerDashboardHandler(request, response) {
  const dashboard = await getCustomerDashboard(request.user._id);
  response.status(200).json(dashboard);
}
