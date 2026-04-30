import { Router } from "express";
import { db } from "../../config/db.js";
import {
  requireAuth,
  requireKnownUser,
} from "../../middlewares/auth.middleware.js";
import { badRequest, isBlank } from "../../utils/validation.js";
import { cleanName, cleanPhone, cleanEmail, cleanGST, cleanText } from "../../utils/cleaners.js";
import { tokenizeSearchQuery } from "../../utils/search.js";
import { buildLeadSearchQuery } from "../../utils/searchQueryBuilder.js";

const router = Router();

router.get("/", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.min(50, Math.max(1, Number(limit)));
    const offset = (parsedPage - 1) * parsedLimit;

    // 1. Fetch lightweight lead data (No raw_data for performance)
    const dataQuery = `
      SELECT id, name, phone, email, company, created_at, last_activity_at, last_activity_type
      FROM leads
      WHERE created_by = $1
      ORDER BY last_activity_at DESC NULLS LAST, created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const dataResult = await db.query(dataQuery, [userId, parsedLimit, offset]);

    // 2. Fetch total count for pagination metadata
    const countResult = await db.query(
      "SELECT COUNT(*) as total FROM leads WHERE created_by = $1",
      [userId],
    );
    const total = parseInt(countResult.rows[0].total, 10);
    const hasMore = offset + dataResult.rowCount < total;

    res.json({
      data: dataResult.rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/search", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { q, page = 1, limit = 20 } = req.query;

    const parsedPage = Math.max(1, Number(page));
    const parsedLimit = Math.min(100, Math.max(1, Number(limit)));
    const offset = (parsedPage - 1) * parsedLimit;

    // Guardrail: Minimum search length (2 chars)
    if (!q || q.trim().length < 2) {
      return res.json({
        data: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          hasMore: false,
        },
      });
    }

    // Handle empty query (Double check via tokenizer)
    const tokenized = tokenizeSearchQuery(q);
    if (!tokenized || !tokenized.patterns || tokenized.patterns.length === 0) {
      return res.json({
        data: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          hasMore: false,
        },
      });
    }

    // Build dynamic search query
    const search = buildLeadSearchQuery(userId, tokenized.patterns);
    if (!search || !search.whereClause || !search.values) {
      return res.json({
        data: [],
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: 0,
          hasMore: false,
        },
      });
    }

    // 1. Prepare values array: [userId, ...patterns, firstToken, limit, offset]
    const firstToken = tokenized.tokens[0];
    const rankIdx = search.values.length + 1;
    const limitIdx = search.values.length + 2;
    const offsetIdx = search.values.length + 3;

    const dataValues = [...search.values, firstToken, parsedLimit, offset];
    
    console.log("Search Debug:", {
      patterns: tokenized.patterns,
      firstToken,
      whereClause: search.whereClause,
      rankIdx,
      limitIdx,
      offsetIdx
    });

    // 2. Final Data Query with Advanced Ranking
    // Priority: 
    // 0. Exact Name match
    // 1. Name starts with token
    // 2. Name contains token (ILIKE $2 is %token%)
    // 3. Company contains token
    // 4. Email contains token
    // 5. Phone contains token
    const dataQuery = `
      SELECT id, name, phone, email, company, created_at, last_activity_at, last_activity_type
      FROM leads
      WHERE ${search.whereClause}
      ORDER BY 
        CASE 
          WHEN LOWER(name) = $${rankIdx} THEN 0
          WHEN name ILIKE $${rankIdx} || '%' THEN 1
          WHEN name ILIKE $2 THEN 2
          WHEN company ILIKE $2 THEN 3
          WHEN email ILIKE $2 THEN 4
          WHEN phone LIKE $2 THEN 5
          ELSE 6
        END,
        last_activity_at DESC NULLS LAST,
        created_at DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;
    console.log("Final SQL Query with Advanced Ranking:", dataQuery);

    const dataResult = await db.query(dataQuery, dataValues);

    // 4. Total Count Query (Uses base search values: [userId, ...patterns])
    const countQuery = `
      SELECT COUNT(*) as total
      FROM leads
      WHERE ${search.whereClause}
    `;
    const countResult = await db.query(countQuery, search.values);
    const total = parseInt(countResult.rows[0].total, 10);

    const hasMore = (offset + dataResult.rowCount) < total;

    res.json({
      data: dataResult.rows,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        hasMore,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/by-phone", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { phone } = req.query;

    if (!phone || String(phone).trim() === "") {
      return res.status(400).json({ error: "Phone number is required." });
    }

    const cleanedPhone = cleanPhone(String(phone).trim());
    
    if (!cleanedPhone) {
      return res.status(400).json({ error: "Invalid phone number format." });
    }

    const query = `
      SELECT id, name, company 
      FROM leads 
      WHERE phone = $1 AND created_by = $2
    `;
    
    const result = await db.query(query, [cleanedPhone, req.user.id]);

    if (result.rowCount > 0) {
      return res.json({
        exists: true,
        lead: result.rows[0]
      });
    }

    return res.json({ exists: false });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireAuth, requireKnownUser, async (req, res, next) => {
  const client = await db.connect();

  try {
    const { name, phone, company, email, activity_type = 'field', notes, latitude, longitude, location_text, lead_latitude, lead_longitude, location_source } = req.body;

    const cleanedName = cleanText(name);
    if (!cleanedName) {
      return res.status(400).json({ error: "Valid name is required." });
    }

    const cleanedPhone = phone ? cleanPhone(String(phone).trim()) : null;
    if (!cleanedPhone) {
      return res.status(400).json({ error: "Valid phone is required." });
    }

    if (!['field', 'call'].includes(activity_type)) {
      return res.status(400).json({ error: "Invalid activity_type. Must be 'field' or 'call'." });
    }

    const parseNumberOrNull = (val) => {
      if (val === undefined || val === null || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    };

    const parsedLatitude = parseNumberOrNull(latitude);
    const parsedLongitude = parseNumberOrNull(longitude);

    // --- New location fields ---
    const cleanedLocationText = cleanText(location_text);
    const parsedLeadLatitude  = parseNumberOrNull(lead_latitude);
    const parsedLeadLongitude = parseNumberOrNull(lead_longitude);
    const cleanedLocationSource = ['manual', 'gps', 'ocr', 'unknown'].includes(location_source)
      ? location_source
      : 'manual';

    await client.query('BEGIN');

    const insertLeadQuery = `
      INSERT INTO leads (
        name, phone, company, email, latitude, longitude,
        location_text, lead_latitude, lead_longitude, location_source,
        created_by, last_activity_at, last_activity_type
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), $12)
      RETURNING *;
    `;

    const leadValues = [
      cleanedName,
      cleanedPhone,
      cleanText(company),
      cleanText(email),
      parsedLatitude,
      parsedLongitude,
      cleanedLocationText,
      parsedLeadLatitude,
      parsedLeadLongitude,
      cleanedLocationSource,
      req.user.id,
      activity_type
    ];

    const leadResult = await client.query(insertLeadQuery, leadValues);
    const newLead = leadResult.rows[0];

    const insertActivityQuery = `
      INSERT INTO activities (lead_id, activity_type, notes, created_by, latitude, longitude)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    await client.query(insertActivityQuery, [
      newLead.id,
      activity_type,
      cleanText(notes),
      req.user.id,
      activity_type === 'field' ? parsedLatitude : null,
      activity_type === 'field' ? parsedLongitude : null
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      data: newLead
    });
  } catch (error) {
    await client.query('ROLLBACK');
    
    if (error.code === '23505') { 
      return res.status(409).json({ error: "Duplicate lead exists" });
    }
    next(error);
  } finally {
    client.release();
  }
});

router.get("/:id", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, name, phone, email, company,
             location_text, lead_latitude, lead_longitude, location_source,
             created_at, last_activity_at, last_activity_type
      FROM leads
      WHERE id = $1 AND created_by = $2
    `;
    const result = await db.query(query, [id, req.user.id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/activities", requireAuth, requireKnownUser, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First ensure the lead belongs to the user
    const leadCheck = await db.query(
      "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
      [id, req.user.id]
    );

    if (leadCheck.rowCount === 0) {
      return res.status(404).json({ error: "Lead not found or unauthorized" });
    }

    const query = `
      SELECT id, activity_type, notes, call_outcome, duration_seconds, follow_up_required, latitude, longitude, created_at
      FROM activities
      WHERE lead_id = $1
      ORDER BY created_at DESC
    `;
    const result = await db.query(query, [id]);

    res.json({ data: result.rows });
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
    for (const field of ["name", "phone", "email", "gst", "company", "location_text", "lead_latitude", "lead_longitude", "location_source"]) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        if (field === "company") {
          const val = body.company?.toString().trim();
          if (val) updates.company = val;
          continue;
        }

        if (field === "location_text") {
          const val = cleanText(body.location_text);
          if (val !== null) updates.location_text = val;
          continue;
        }

        if (field === "lead_latitude" || field === "lead_longitude") {
          const raw = body[field];
          if (raw === null || raw === "") {
            updates[field] = null;
          } else {
            const num = Number(raw);
            if (!isNaN(num)) updates[field] = num;
          }
          continue;
        }

        if (field === "location_source") {
          const val = ['manual', 'gps', 'ocr', 'unknown'].includes(body.location_source)
            ? body.location_source
            : null;
          if (val !== null) updates.location_source = val;
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
