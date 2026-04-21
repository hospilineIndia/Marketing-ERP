import { Router } from "express";
import { db } from "../../config/db.js";
import {
  requireAuth,
  requireKnownUser,
} from "../../middlewares/auth.middleware.js";
import { badRequest, isBlank } from "../../utils/validation.js";
import { cleanName, cleanPhone, cleanEmail, cleanGST } from "../../utils/cleaners.js";

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

router.patch("/:id", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // 1. Ownership Check
    const leadCheck = await db.query(
      "SELECT id, name, phone, email, gst, company FROM leads WHERE id = $1 AND created_by = $2",
      [id, req.user.id],
    );

    if (leadCheck.rowCount === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const currentLead = leadCheck.rows[0];

    // 2. Data Cleaning & Non-destructive Selection
    const updates = {};
    const cleaners = {
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      gst: cleanGST,
    };

    // Only process fields that are present in the request body
    for (const field of ["name", "phone", "email", "gst", "company"]) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        if (field === "company") {
          const val = body.company?.toString().trim();
          if (val) updates.company = val;
          continue;
        }

        const cleaner = cleaners[field];
        if (cleaner) {
          const cleaned = cleaner(body[field]);
          // Rule: If invalid (cleaned to null) but was provided, IGNORE (non-destructive)
          if (cleaned !== null) {
            updates[field] = cleaned;
          }
        }
      }
    }

    // 3. Duplicate Safety (Excluding self)
    if (updates.phone) {
      const phoneCheck = await db.query(
        "SELECT id FROM leads WHERE phone = $1 AND created_by = $2 AND id != $3",
        [updates.phone, req.user.id, id],
      );
      if (phoneCheck.rowCount > 0) {
        return res.status(409).json({ error: "Duplicate lead exists" });
      }
    }

    if (updates.email) {
      const emailCheck = await db.query(
        "SELECT id FROM leads WHERE email = $1 AND created_by = $2 AND id != $3",
        [updates.email, req.user.id, id],
      );
      if (emailCheck.rowCount > 0) {
        return res.status(409).json({ error: "Duplicate lead exists" });
      }
    }

    // 4. Dynamic Atomic Update
    const setClause = [];
    const values = [];
    let i = 1;

    for (const [field, val] of Object.entries(updates)) {
      setClause.push(`${field} = $${i}`);
      values.push(val);
      i++;
    }

    // If no valid fields to update, return current state
    if (setClause.length === 0) {
      return res.json({ data: { lead: currentLead } });
    }

    values.push(id, req.user.id);
    const updateQuery = `
      UPDATE leads
      SET ${setClause.join(", ")}, updated_at = NOW()
      WHERE id = $${i} AND created_by = $${i + 1}
      RETURNING *;
    `;

    const result = await db.query(updateQuery, values);

    res.json({
      data: {
        lead: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
