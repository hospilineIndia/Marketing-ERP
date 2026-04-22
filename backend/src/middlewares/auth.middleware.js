import { verifyAccessToken } from "../utils/tokens.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    req.user = verifyAccessToken(token);
  } catch (_error) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  return next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  return next();
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({
      error: "You do not have permission to access this resource.",
    });
  }

  return next();
};

export const requireKnownUser = (req, res, next) => {
  if (!req.user?.id) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  return next();
};
