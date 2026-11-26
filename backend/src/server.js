import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { validateAuthConfig } from "./config/auth.js";
import { connectDatabase } from "./config/database.js";
import initializeSocketServer from "./sockets/index.js";
import { startSlaMonitor } from "./jobs/slaMonitor.js";

const port = Number(process.env.PORT ?? 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

async function startServer() {
  validateAuthConfig();
  await connectDatabase();

  const server = createServer(app);
  initializeSocketServer(server);
  server.listen(port, () => {
    console.log(`SupportHub API listening on http://localhost:${port}`);
    const stopSlaMonitor = startSlaMonitor();
    server.once("close", stopSlaMonitor);
  });

  server.on("error", (error) => {
    console.error("SupportHub API failed to start:", error.message);
    process.exitCode = 1;
  });
}

startServer().catch((error) => {
  console.error("SupportHub API startup failed:", error.message);
  process.exit(1);
});
