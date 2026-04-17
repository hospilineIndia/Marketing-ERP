import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/marketing_erp",
  jwtSecret: process.env.JWT_SECRET || "replace-with-a-secure-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  redisHost: process.env.REDIS_HOST || "127.0.0.1",
  redisPort: Number(process.env.REDIS_PORT || 6379),
  uploadDir: process.env.UPLOAD_DIR || "uploads",
};
