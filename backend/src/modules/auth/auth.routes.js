import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../config/db.js";
import { env } from "../../config/env.js";
import {
  requireAuth,
  requireKnownUser,
} from "../../middlewares/auth.middleware.js";
import { badRequest, isBlank } from "../../utils/validation.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (isBlank(email) || isBlank(password)) {
      throw badRequest("Email and password are required.");
    }

    const result = await db.query(
      `
        SELECT id, name, email, password, role
        FROM users
        WHERE email = $1
      `,
      [String(email).trim().toLowerCase()],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn },
    );

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const result = await db.query(
      `
        SELECT id, name, email, role, created_at
        FROM users
        WHERE id = $1
      `,
      [req.user.id],
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    res.json({
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
