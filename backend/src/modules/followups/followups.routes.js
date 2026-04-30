import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";
import { cleanText } from "../../utils/cleaners.js";

const router = Router();

// --- POST /followups — Create a follow-up ---
router.post("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { lead_id, activity_id, title, notes, due_date, priority } = req.body;

    if (!lead_id) {
      return res.status(400).json({ error: "lead_id is required." });
    }
    if (!due_date) {
      return res.status(400).json({ error: "due_date is required." });
    }

    // Ownership check
    const leadCheck = await db.query(
      "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
      [lead_id, req.user.id]
    );
    if (leadCheck.rowCount === 0) {
      return res.status(403).json({ error: "Lead not found or access denied." });
    }

    const validPriorities = ['low', 'medium', 'high'];
    const cleanedPriority = validPriorities.includes(priority) ? priority : 'medium';

    const result = await db.query(
      `INSERT INTO follow_ups (lead_id, activity_id, title, notes, due_date, priority, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        lead_id,
        activity_id || null,
        cleanText(title),
        cleanText(notes),
        due_date,
        cleanedPriority,
        req.user.id,
        req.user.id,
      ]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// --- GET /followups — List follow-ups for logged-in user ---
router.get("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { status, filter } = req.query;

    const conditions = ["f.assigned_to = $1"];
    const values = [req.user.id];
    let i = 2;

    if (status) {
      conditions.push(`f.status = $${i}`);
      values.push(status);
      i++;
    }

    if (filter === "today") {
      conditions.push(`f.due_date::date = CURRENT_DATE`);
    } else if (filter === "upcoming") {
      conditions.push(`f.due_date > NOW()`);
    }

    const query = `
      SELECT
        f.*,
        l.name  AS lead_name,
        l.phone AS lead_phone,
        l.company AS lead_company
      FROM follow_ups f
      JOIN leads l ON l.id = f.lead_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY f.due_date ASC
    `;

    const result = await db.query(query, values);
    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// --- GET /followups/lead/:lead_id — Follow-ups for a specific lead ---
router.get("/lead/:lead_id", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { lead_id } = req.params;

    // Ownership check
    const leadCheck = await db.query(
      "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
      [lead_id, req.user.id]
    );
    if (leadCheck.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found or access denied." });
    }

    const result = await db.query(
      `SELECT * FROM follow_ups WHERE lead_id = $1 ORDER BY due_date ASC`,
      [lead_id]
    );

    res.json({ data: result.rows });
  } catch (error) {
    next(error);
  }
});

// --- PATCH /followups/:id — Update status or mark completed ---
router.patch("/:id", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, title, notes, due_date, priority } = req.body;

    // Ownership check
    const check = await db.query(
      "SELECT id FROM follow_ups WHERE id = $1 AND assigned_to = $2",
      [id, req.user.id]
    );
    if (check.rowCount === 0) {
      return res.status(403).json({ error: "Follow-up not found or access denied." });
    }

    const validStatuses = ['pending', 'completed', 'cancelled'];
    const validPriorities = ['low', 'medium', 'high'];

    const updates = {};
    if (status && validStatuses.includes(status)) {
      updates.status = status;
      if (status === 'completed') updates.completed_at = 'NOW()';
    }
    if (title !== undefined) updates.title = cleanText(title);
    if (notes !== undefined) updates.notes = cleanText(notes);
    if (due_date !== undefined) updates.due_date = due_date;
    if (priority && validPriorities.includes(priority)) updates.priority = priority;

    if (Object.keys(updates).length === 0) {
      const current = await db.query("SELECT * FROM follow_ups WHERE id = $1", [id]);
      return res.json({ data: current.rows[0] });
    }

    const setClause = [];
    const values = [];
    let i = 1;

    for (const [field, val] of Object.entries(updates)) {
      if (val === 'NOW()') {
        setClause.push(`${field} = NOW()`);
      } else {
        setClause.push(`${field} = $${i}`);
        values.push(val);
        i++;
      }
    }

    setClause.push(`updated_at = NOW()`);
    values.push(id, req.user.id);

    const result = await db.query(
      `UPDATE follow_ups
       SET ${setClause.join(", ")}
       WHERE id = $${i} AND assigned_to = $${i + 1}
       RETURNING *`,
      values
    );

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

export default router;
