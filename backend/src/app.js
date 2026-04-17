import cors from "cors";
import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import leadsRoutes from "./modules/leads/leads.routes.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection, initializeDatabase } from "./config/db.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";

const app = express();

initializeDatabase().catch((error) => {
  console.error("CRITICAL: Database initialization failed. The server may not function correctly.");
  console.error("Error details:", error.message);
});

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(authenticate);

app.get("/api/health", async (_req, res) => {
  const dbStatus = await checkDatabaseConnection();
  const isOk = dbStatus.ok === true;

  res.status(isOk ? 200 : 503).json({
    status: isOk ? "ok" : "error",
    db: isOk ? "connected" : "disconnected",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/leads", leadsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
