import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "../app.js";

test("ticket, messaging, notification, analytics, settings, dashboard, and category endpoints require an authenticated session", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(
    () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );
  const baseUrl = `http://127.0.0.1:${server.address().port}/api/v1`;

  const ticketResponse = await fetch(`${baseUrl}/tickets`);
  const categoryResponse = await fetch(`${baseUrl}/categories`);
  const adminDashboardResponse = await fetch(`${baseUrl}/dashboard/admin`);
  const agentDashboardResponse = await fetch(`${baseUrl}/dashboard/agent`);
  const customerDashboardResponse = await fetch(`${baseUrl}/dashboard/customer`);
  const agentsResponse = await fetch(`${baseUrl}/agents`);
  const attachmentResponse = await fetch(
    `${baseUrl}/tickets/507f1f77bcf86cd799439011/attachments/507f1f77bcf86cd799439012`,
  );
  const messagesResponse = await fetch(
    `${baseUrl}/messages/507f1f77bcf86cd799439011`,
  );
  const notificationsResponse = await fetch(`${baseUrl}/notifications`);
  const notificationReadResponse = await fetch(
    `${baseUrl}/notifications/507f1f77bcf86cd799439011/read`,
    { method: "PATCH" },
  );
  const notificationReadAllResponse = await fetch(
    `${baseUrl}/notifications/read-all`,
    { method: "PATCH" },
  );
  const analyticsResponse = await fetch(`${baseUrl}/analytics/admin`);
  const settingsResponse = await fetch(`${baseUrl}/settings/sla`);
  const settingsUpdateResponse = await fetch(`${baseUrl}/settings/sla`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slaHours: { low: 72, medium: 24, high: 8, urgent: 2 },
    }),
  });
  const untrustedOriginResponse = await fetch(`${baseUrl}/notifications/read-all`, {
    method: "PATCH",
    headers: { Origin: "https://attacker.example" },
  });

  assert.equal(ticketResponse.status, 401);
  assert.equal(categoryResponse.status, 401);
  assert.equal(adminDashboardResponse.status, 401);
  assert.equal(agentDashboardResponse.status, 401);
  assert.equal(customerDashboardResponse.status, 401);
  assert.equal(agentsResponse.status, 401);
  assert.equal(attachmentResponse.status, 401);
  assert.equal(messagesResponse.status, 401);
  assert.equal(notificationsResponse.status, 401);
  assert.equal(notificationReadResponse.status, 401);
  assert.equal(notificationReadAllResponse.status, 401);
  assert.equal(analyticsResponse.status, 401);
  assert.equal(settingsResponse.status, 401);
  assert.equal(settingsUpdateResponse.status, 401);
  assert.equal(untrustedOriginResponse.status, 403);
  await Promise.all(
    [
      ticketResponse,
      categoryResponse,
      adminDashboardResponse,
      agentDashboardResponse,
      customerDashboardResponse,
      agentsResponse,
      attachmentResponse,
      messagesResponse,
      notificationsResponse,
      notificationReadResponse,
      notificationReadAllResponse,
      analyticsResponse,
      settingsResponse,
      settingsUpdateResponse,
      untrustedOriginResponse,
    ].map((response) => response.arrayBuffer()),
  );
});
