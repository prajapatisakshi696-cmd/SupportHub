import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import authRoutes from "./routes/authRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import trustedOrigin from "./middleware/trustedOrigin.js";

const app = express();
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
const frontendOrigin = new URL(
  process.env.FRONTEND_URL ?? "http://localhost:3000",
).origin;

app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1", trustedOrigin);

app.get("/api/v1/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "supporthub-api",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/agents", agentRoutes);
app.use("/api/v1/messages", messageRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
