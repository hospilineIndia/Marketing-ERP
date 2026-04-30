import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";
import { cleanText } from "../../utils/cleaners.js";

const router = Router();

router.post("/", requireAuth, requireKnownUser, async (req, res, next) => {
  const client = await db.connect();

  try {
    const { lead_id, activity_type, notes, call_outcome, duration_seconds, follow_up_required, latitude, longitude, planned_location_text, planned_latitude, planned_longitude } = req.body;

    const safeNumber = (val) => {
      if (val === undefined || val === null || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    if (!lead_id || !activity_type) {
      return res.status(400).json({ error: "lead_id and activity_type are required." });
    }

    if (!['field', 'call'].includes(activity_type)) {
      return res.status(400).json({ error: "Invalid activity_type. Must be 'field' or 'call'." });
    }

    if (duration_seconds !== undefined && duration_seconds !== null && isNaN(Number(duration_seconds))) {
      return res.status(400).json({ error: "Invalid duration_seconds" });
    }

    await client.query('BEGIN');

    const leadCheck = await client.query(
      "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
      [lead_id, req.user.id]
    );

    if (leadCheck.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: "Forbidden: Lead does not exist or access denied." });
    }

    const insertActivityQuery = `
      INSERT INTO activities (
        lead_id, activity_type, notes, call_outcome, duration_seconds,
        follow_up_required, created_by, latitude, longitude,
        planned_location_text, planned_latitude, planned_longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    
    const activityValues = [
      lead_id,
      activity_type,
      cleanText(notes),
      cleanText(call_outcome),
      duration_seconds !== undefined && duration_seconds !== null ? Number(duration_seconds) : null,
      Boolean(follow_up_required),
      req.user.id,
      activity_type === 'field' ? safeNumber(latitude) : null,
      activity_type === 'field' ? safeNumber(longitude) : null,
      cleanText(planned_location_text),
      safeNumber(planned_latitude),
      safeNumber(planned_longitude)
    ];

    const activityResult = await client.query(insertActivityQuery, activityValues);

    const updateLeadQuery = `
      UPDATE leads
      SET last_activity_at = NOW(),
          last_activity_type = $1
      WHERE id = $2;
    `;
    
    await client.query(updateLeadQuery, [activity_type, lead_id]);

    await client.query('COMMIT');

    res.status(201).json({
      data: activityResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
