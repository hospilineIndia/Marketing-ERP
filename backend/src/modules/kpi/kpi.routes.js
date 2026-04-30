import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";

const router = Router();

// Safe numeric converter — always returns a number, never null/NaN
const n = (val, decimals = 1) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : parseFloat(num.toFixed(decimals));
};

// --- GET /kpi — Current user metrics (today only, timezone-safe) ---
router.get("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Compute start-of-day in server/app timezone — avoids CURRENT_DATE DB timezone drift
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [activityRes, followUpRes, durationRes, completionTimeRes] = await Promise.all([
      // Today's activity counts
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE activity_type = 'call')  AS calls,
           COUNT(*) FILTER (WHERE activity_type = 'field') AS field_visits,
           COUNT(*)                                         AS total
         FROM activities
         WHERE created_by = $1
           AND created_at >= $2`,
        [userId, startOfDay]
      ),

      // Today's follow-up stats
      db.query(
        `SELECT
           COUNT(*)                                                         AS total,
           COUNT(*) FILTER (WHERE status = 'completed')                    AS completed,
           COUNT(*) FILTER (WHERE status = 'pending' AND due_date < NOW()) AS missed
         FROM follow_ups
         WHERE assigned_to = $1
           AND created_at >= $2`,
        [userId, startOfDay]
      ),

      // Today's avg call duration (calls with recorded duration only)
      db.query(
        `SELECT AVG(duration_seconds) AS avg_call_duration
         FROM activities
         WHERE created_by = $1
           AND activity_type = 'call'
           AND duration_seconds IS NOT NULL
           AND created_at >= $2`,
        [userId, startOfDay]
      ),

      // Today's avg follow-up resolution time in hours
      db.query(
        `SELECT AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) AS avg_hours
         FROM follow_ups
         WHERE assigned_to = $1
           AND status = 'completed'
           AND completed_at IS NOT NULL
           AND created_at >= $2`,
        [userId, startOfDay]
      ),
    ]);

    const a  = activityRes.rows[0];
    const fu = followUpRes.rows[0];

    const total     = Number(fu.total)     || 0;
    const completed = Number(fu.completed) || 0;
    const completion_rate = total > 0
      ? parseFloat(((completed / total) * 100).toFixed(1))
      : 0;

    res.json({
      data: {
        calls:            Number(a.calls)        || 0,
        field_visits:     Number(a.field_visits) || 0,
        total_activities: Number(a.total)        || 0,

        followups_created:   total,
        followups_completed: completed,
        followups_missed:    Number(fu.missed) || 0,

        completion_rate,

        avg_call_duration:       n(durationRes.rows[0].avg_call_duration, 0),
        avg_followup_time_hours: n(completionTimeRes.rows[0].avg_hours, 1),
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Subquery pattern prevents row multiplication from multiple LEFT JOINs
    const result = await db.query(
      `SELECT
         u.id,
         u.name,

         COALESCE(a.calls,        0) AS calls,
         COALESCE(a.field_visits, 0) AS field_visits,
         COALESCE(a.calls, 0) + COALESCE(a.field_visits, 0) AS total_activities,

         COALESCE(f.completed, 0) AS followups_completed,
         COALESCE(f.total,     0) AS followups_total

       FROM users u

       LEFT JOIN (
         SELECT
           created_by,
           COUNT(*) FILTER (WHERE activity_type = 'call')  AS calls,
           COUNT(*) FILTER (WHERE activity_type = 'field') AS field_visits
         FROM activities
         WHERE created_at >= $1
         GROUP BY created_by
       ) a ON a.created_by = u.id

       LEFT JOIN (
         SELECT
           assigned_to,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed,
           COUNT(*)                                      AS total
         FROM follow_ups
         WHERE created_at >= $1
         GROUP BY assigned_to
       ) f ON f.assigned_to = u.id

       ORDER BY u.name ASC`,
      [startOfDay]
    );

    const rows = result.rows.map((r) => {
      const total     = Number(r.followups_total)     || 0;
      const completed = Number(r.followups_completed) || 0;
      return {
        id:               r.id,
        name:             r.name,
        calls:            Number(r.calls)            || 0,
        field_visits:     Number(r.field_visits)     || 0,
        total_activities: Number(r.total_activities) || 0,
        followups_completed: completed,
        followups_total:     total,
        completion_rate: total > 0
          ? parseFloat(((completed / total) * 100).toFixed(1))
          : 0,
      };
    });

    res.json({ data: rows });
  } catch (error) {
    next(error);
  }
});

export default router;
