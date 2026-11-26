import assert from "node:assert/strict";
import test from "node:test";
import authenticateSocket from "../sockets/authenticateSocket.js";

test("Socket.IO connections require the HttpOnly access cookie", async () => {
  const socket = {
    handshake: { headers: {} },
    request: { headers: {} },
    data: {},
  };
  const error = await new Promise((resolve) => {
    authenticateSocket(socket, resolve);
  });

  assert.equal(error.message, "Authentication required.");
  assert.equal(error.data.code, "UNAUTHORIZED");
});

test("Socket.IO rejects a browser origin that is not the configured frontend", async () => {
  const socket = {
    handshake: { headers: { origin: "https://attacker.example" } },
    request: { headers: {} },
    data: {},
  };
  const error = await new Promise((resolve) => {
    authenticateSocket(socket, resolve);
  });

  assert.equal(error.message, "Request origin is not allowed.");
  assert.equal(error.data.code, "FORBIDDEN");
});
