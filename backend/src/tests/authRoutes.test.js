import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import app from "../app.js";

async function startTestServer() {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

test("registration rejects invalid payloads before database access", async (t) => {
  const server = await startTestServer();
  t.after(server.close);

  const response = await fetch(`${server.url}/api/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "A", email: "not-an-email", password: "short" }),
  });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "Request validation failed.");
});

test("auth routes reject requests from an untrusted browser origin", async (t) => {
  const server = await startTestServer();
  t.after(server.close);

  const response = await fetch(`${server.url}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://untrusted.example",
    },
    body: JSON.stringify({ email: "person@example.com", password: "password" }),
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).message, "Request origin is not allowed.");
});
