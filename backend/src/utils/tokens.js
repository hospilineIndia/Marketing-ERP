import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

/**
 * Generates a short-lived Access Token.
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

/**
 * Generates a long-lived Refresh Token.
 */
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      tokenVersion: user.token_version,
    },
    env.refreshSecret,
    { expiresIn: env.refreshExpiresIn }
  );
};

/**
 * Verifies an Access Token.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

/**
 * Verifies a Refresh Token.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.refreshSecret);
};

/**
 * Hashes a token for secure storage.
 */
export const hashToken = async (token) => {
  return bcrypt.hash(token, 10);
};

/**
 * Compares a raw token with a hashed one.
 */
export const compareTokens = async (raw, hashed) => {
  if (!hashed) return false;
  return bcrypt.compare(raw, hashed);
};
