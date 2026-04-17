import { Router } from "express";
import { db } from "../../config/db.js";
import {
  requireAuth,
  requireKnownUser,
} from "../../middlewares/auth.middleware.js";
import { badRequest, isBlank } from "../../utils/validation.js";

const router = Router();

router.get("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const result = await db.query(
      `
        SELECT id, name, phone, company, latitude, longitude, created_by, created_at, updated_at
        FROM leads
        WHERE created_by = $1
        ORDER BY created_at DESC, id DESC
      `,
      [req.user.id],
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { name, phone, company, latitude, longitude } = req.body;

    if ([name, phone].some(isBlank)) {
      throw badRequest("Name and phone are required.");
    }

    const parsedLatitude =
      latitude === undefined || latitude === null || latitude === ""
        ? null
        : Number(latitude);
    const parsedLongitude =
      longitude === undefined || longitude === null || longitude === ""
        ? null
        : Number(longitude);

    if (parsedLatitude !== null && Number.isNaN(parsedLatitude)) {
      throw badRequest("Latitude must be a valid number.");
    }

    if (parsedLongitude !== null && Number.isNaN(parsedLongitude)) {
      throw badRequest("Longitude must be a valid number.");
    }

    let result;
    try {
      result = await db.query(
        `
          INSERT INTO leads (name, phone, company, latitude, longitude, created_by, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING id, name, phone, company, latitude, longitude, created_by, created_at, updated_at
        `,
        [
          String(name).trim(),
          String(phone).trim(),
          isBlank(company) ? null : String(company).trim(),
          parsedLatitude,
          parsedLongitude,
          req.user.id,
        ],
      );
    } catch (dbError) {
      return res.status(400).json({
        error: "Invalid input",
      });
    }

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

export default router;
