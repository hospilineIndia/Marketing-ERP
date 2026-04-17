import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";
import { badRequest, isBlank } from "../../utils/validation.js";

const router = Router();

// Create a note for a lead
router.post("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { lead_id, text } = req.body;

    if (isBlank(lead_id) || isBlank(text)) {
      throw badRequest("Lead ID and text are required.");
    }

    // Security check: Ensure user owns the lead
    const leadCheck = await db.query(
      "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
      [lead_id, req.user.id]
    );

    if (leadCheck.rowCount === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db.query(
      "INSERT INTO notes (lead_id, text) VALUES ($1, $2) RETURNING *",
      [lead_id, text]
    );

    res.status(201).json({
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// Get notes for a lead
router.get("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { lead_id } = req.query;

    if (isBlank(lead_id)) {
      throw badRequest("Lead ID is required.");
    }

    // Security check: Ensure user owns the lead
    const leadCheck = await db.query(
      "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
      [lead_id, req.user.id]
    );

    if (leadCheck.rowCount === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await db.query(
      "SELECT * FROM notes WHERE lead_id = $1 ORDER BY created_at DESC",
      [lead_id]
    );

    res.json({
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
