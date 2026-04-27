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
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken, 
  verifyRefreshToken, 
  compareTokens 
} from "../../utils/tokens.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (isBlank(name) || isBlank(email) || isBlank(password)) {
      throw badRequest("Name, email, and password are required.");
    }

    // Check if user exists
    const existingUser = await db.query("SELECT id FROM users WHERE email = $1", [String(email).trim().toLowerCase()]);
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ error: "Email already in use." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      `
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, 'field')
        RETURNING id, name, email, role, token_version
      `,
      [String(name).trim(), String(email).trim().toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hash and store Refresh Token
    const hashedRefresh = await hashToken(refreshToken);
    await db.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [hashedRefresh, user.id]);

    res.status(201).json({
      data: {
        accessToken,
        refreshToken,
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

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (isBlank(email) || isBlank(password)) {
      throw badRequest("Email and password are required.");
    }

    const result = await db.query(
      `
        SELECT id, name, email, password, role, token_version
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

    // Generate Tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Hash and store Refresh Token
    const hashedRefresh = await hashToken(refreshToken);
    await db.query(
      "UPDATE users SET refresh_token = $1 WHERE id = $2",
      [hashedRefresh, user.id]
    );

    res.json({
      data: {
        accessToken,
        refreshToken,
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

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.query.refreshToken ? req.query : req.body;

    if (!refreshToken) {
      throw badRequest("Refresh token is required.");
    }

    // 1. Verify Token Signature
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      console.error("JWT Verify Error:", err.message);
      return res.status(401).json({ error: "Invalid refresh token signature" });
    }

    // 2. Fetch User and check Version + Hash
    const result = await db.query(
      "SELECT id, email, role, refresh_token, token_version FROM users WHERE id = $1",
      [payload.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (payload.tokenVersion !== user.token_version) {
      return res.status(401).json({ error: "Token version mismatch" });
    }

    // 3. Compare with stored hash
    const isMatch = await compareTokens(refreshToken, user.refresh_token);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid refresh token session" });
    }

    // 4. Issue new Access Token
    const accessToken = generateAccessToken(user);

    res.json({
      data: { accessToken }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    // Invalidate refresh token in DB
    await db.query(
      "UPDATE users SET refresh_token = NULL WHERE id = $1",
      [req.user.id]
    );

    res.json({ message: "Logged out successfully" });
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
