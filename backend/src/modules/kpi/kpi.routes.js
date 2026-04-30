import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";

const router = Router();

const toNum = (val, decimals = 1) => {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : parseFloat(n.toFixed(decimals));
};

// --- GET /kpi — Current user metrics ---
router.get("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [activityRes, followUpRes, durationRes, completionTimeRes] = await Promise.all([
      // Today's activity counts
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE activity_type = 'call')  AS calls,
           COUNT(*) FILTER (WHERE activity_type = 'field') AS field_visits,
           COUNT(*)                                         AS total
         FROM activities
         WHERE created_by = $1
           AND created_at >= CURRENT_DATE`,
        [userId]
      ),

      // All-time follow-up stats
      db.query(
        `SELECT
           COUNT(*)                                                               AS total,
           COUNT(*) FILTER (WHERE status = 'completed')                          AS completed,
           COUNT(*) FILTER (WHERE status = 'pending' AND due_date < NOW())       AS missed
         FROM follow_ups
         WHERE assigned_to = $1`,
        [userId]
      ),

      // Average call duration (all-time)
      db.query(
        `SELECT AVG(duration_seconds) AS avg_call_duration
         FROM activities
         WHERE created_by = $1
           AND activity_type = 'call'
           AND duration_seconds IS NOT NULL`,
        [userId]
      ),

      // Average follow-up completion time in hours
      db.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) AS avg_hours
         FROM follow_ups
         WHERE assigned_to = $1
           AND status = 'completed'
           AND completed_at IS NOT NULL`,
        [userId]
      ),
    ]);

    const a  = activityRes.rows[0];
    const fu = followUpRes.rows[0];

    const total     = parseInt(fu.total,     10) || 0;
    const completed = parseInt(fu.completed, 10) || 0;
    const completion_rate = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;

    res.json({
      data: {
        calls:             parseInt(a.calls,        10) || 0,
        field_visits:      parseInt(a.field_visits, 10) || 0,
        total_activities:  parseInt(a.total,        10) || 0,

        followups_created:   total,
        followups_completed: completed,
        followups_missed:    parseInt(fu.missed, 10) || 0,

        completion_rate,

        avg_call_duration:      toNum(durationRes.rows[0].avg_call_duration, 0),
        avg_followup_time_hours: toNum(completionTimeRes.rows[0].avg_hours, 1),
      },
    });
  } catch (error) {
    next(error);
  }
});

// --- GET /kpi/admin — Team-wide metrics (admin only) ---
router.get("/admin", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    const result = await db.query(
      `SELECT
         u.id,
         u.name,
         COUNT(a.id) FILTER (WHERE a.activity_type = 'call')  AS calls,
         COUNT(a.id) FILTER (WHERE a.activity_type = 'field') AS field_visits,
         COUNT(a.id)                                           AS total_activities,
         COUNT(f.id) FILTER (WHERE f.status = 'completed')    AS followups_completed,
         COUNT(f.id)                                           AS followups_total
       FROM users u
       LEFT JOIN activities  a ON a.created_by  = u.id
       LEFT JOIN follow_ups  f ON f.assigned_to = u.id
       GROUP BY u.id, u.name
       ORDER BY u.name ASC`
    );

    const rows = result.rows.map((r) => {
      const total     = parseInt(r.followups_total,     10) || 0;
      const completed = parseInt(r.followups_completed, 10) || 0;
      return {
        id:               r.id,
        name:             r.name,
        calls:            parseInt(r.calls,            10) || 0,
        field_visits:     parseInt(r.field_visits,     10) || 0,
        total_activities: parseInt(r.total_activities, 10) || 0,
        followups_completed: completed,
        followups_total:     total,
        completion_rate: total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0,
      };
    });

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
