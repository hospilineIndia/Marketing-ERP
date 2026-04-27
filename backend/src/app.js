import cors from "cors";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import leadsRoutes from "./modules/leads/leads.routes.js";
import cardsRoutes from "./modules/cards/cards.routes.js";
import notesRoutes from "./modules/notes/notes.routes.js";
import activitiesRoutes from "./modules/activities/activities.routes.js";
import { env } from "./config/env.js";
import { checkDatabaseConnection, initializeDatabase } from "./config/db.js";
import { authenticate } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { extractTextFromImage } from "./utils/ocr.js";
import { parseVisitingCardText } from "./utils/ai.js";

const app = express();

initializeDatabase().catch((error) => {
  console.error("CRITICAL: Database initialization failed. The server may not function correctly.");
  console.error("Error details:", error.message);
});

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Global Cache Control: Disable all caching ---
app.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});
app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));
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
app.use("/api/cards", cardsRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/activities", activitiesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
