import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService.js";

export async function listNotificationsHandler(request, response) {
  const result = await listNotifications(
    request.user,
    request.validatedQuery,
  );
  response.status(200).json(result);
}

export async function markNotificationReadHandler(request, response) {
  const notification = await markNotificationRead(
    request.validatedParams.notificationId,
    request.user,
  );
  response.status(200).json({ notification });
}

export async function markAllNotificationsReadHandler(request, response) {
  const result = await markAllNotificationsRead(request.user);
  response.status(200).json(result);
}
