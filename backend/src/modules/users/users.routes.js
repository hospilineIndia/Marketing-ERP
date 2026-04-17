import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "../../config/db.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { badRequest, isBlank } from "../../utils/validation.js";

const router = Router();

router.post("/", async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if ([name, email, password, role].some(isBlank)) {
      throw badRequest("Name, email, password, and role are required.");
    }

    if (!["admin", "field"].includes(role)) {
      throw badRequest("Role must be either admin or field.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
      `,
      [String(name).trim(), normalizedEmail, passwordHash, role],
    );

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "A user with this email already exists.",
      });
    }

    return next(error);
  }
});

router.get("/", requireAuth, requireRole("admin"), async (_req, res, next) => {
  try {
    const result = await db.query(
      `
        SELECT id, name, email, role, created_at
        FROM users
        ORDER BY id ASC
      `,
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
