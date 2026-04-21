import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/multer.js";
import { isBlank } from "../../utils/validation.js";
import { extractTextFromImage } from "../../utils/ocr.js";
import { parseVisitingCardText } from "../../utils/ai.js";
import { cleanPhone, cleanEmail, cleanGST, cleanName } from "../../utils/cleaners.js";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  requireKnownUser,
  upload.single("cardImage"),
  async (req, res, next) => {
    try {
      const { lead_id } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      let finalLead;
      let aiData = null;
      let existingLead = null;

      // Start Database Transaction
      const client = await db.connect();
      try {
        await client.query("BEGIN");

        if (!isBlank(lead_id)) {
          // CASE 1: lead_id present -> attach card to existing lead
          const leadCheck = await client.query(
            "SELECT * FROM leads WHERE id = $1 AND created_by = $2",
            [lead_id, req.user.id]
          );

          if (leadCheck.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(401).json({ error: "Unauthorized" });
          }
          finalLead = leadCheck.rows[0];
        } else {
          // CASE 2: no lead_id -> OCR -> AI -> create lead
          let rawText = "";
          try {
            rawText = await extractTextFromImage(req.file.path);

            try {
              aiData = await parseVisitingCardText(rawText);
            } catch (aiError) {
              console.error("AI failed, using OCR fallback");
              console.info("AI fallback used");

              aiData = {
                name: null,
                phone: null,
                email: null,
                business: null,
                profession: null,
                location: null,
                gst: null
              };
            }
          } catch (ocrError) {
            console.error("OCR Processing failed during upload:", ocrError.message);
          }

          // 1. EXTRACT VALUES (Prefer AI, fallback to Regex)
          const extractedPhone = rawText.match(/\b\d{10,12}\b/)?.[0] || null;
          const extractedEmail = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/)?.[0] || null;
          const extractedGst = rawText.match(/\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/)?.[0] || null;

          // CLEANED VALUES (Used for DB and Deduplication)
          const phone = cleanPhone(aiData?.phone || extractedPhone);
          const email = cleanEmail(aiData?.email || extractedEmail);
          const gst = cleanGST(aiData?.gst || extractedGst);
          const name = cleanName(aiData?.name || null) || "Unknown";
          const company = aiData?.business?.trim() || null;

          // 2. STANDARDIZE RAW DATA STRUCTURE (Archiving original output)
          const rawDataArchive = {
            ocr: rawText || null,
            ai: aiData || {},
            extracted: {
              name: aiData?.name || null,
              phone: aiData?.phone || extractedPhone,
              email: aiData?.email || extractedEmail,
              gst: aiData?.gst || extractedGst
            },
            timestamp: new Date().toISOString()
          };

          // 4. MANUAL DEDUPLICATION (for logging purposes)
          if (phone) {
            const result = await client.query(
              "SELECT * FROM leads WHERE phone = $1 AND created_by = $2",
              [phone, req.user.id]
            );
            if (result.rowCount > 0) existingLead = result.rows[0];
          }
          if (!existingLead && email) {
            const result = await client.query(
              "SELECT * FROM leads WHERE email = $1 AND created_by = $2",
              [email, req.user.id]
            );
            if (result.rowCount > 0) existingLead = result.rows[0];
          }

          // 5. SYMMETRIC UPSERT LOGIC
          let query;
          let params = [name, phone, email, gst, company, req.user.id, JSON.stringify(rawDataArchive)];

          if (phone) {
            // Target: ON CONFLICT (created_by, phone)
            query = `
              INSERT INTO leads (name, phone, email, gst, company, created_by, raw_data)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (created_by, phone) WHERE phone IS NOT NULL
              DO UPDATE SET 
                name = COALESCE(leads.name, EXCLUDED.name),
                email = COALESCE(leads.email, EXCLUDED.email),
                gst = COALESCE(leads.gst, EXCLUDED.gst),
                company = COALESCE(leads.company, EXCLUDED.company),
                raw_data = leads.raw_data || EXCLUDED.raw_data,
                updated_at = NOW()
              RETURNING *;
            `;
          } else if (email) {
            // Target: ON CONFLICT (created_by, email)
            query = `
              INSERT INTO leads (name, phone, email, gst, company, created_by, raw_data)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (created_by, email) WHERE email IS NOT NULL
              DO UPDATE SET 
                name = COALESCE(leads.name, EXCLUDED.name),
                phone = COALESCE(leads.phone, EXCLUDED.phone),
                gst = COALESCE(leads.gst, EXCLUDED.gst),
                company = COALESCE(leads.company, EXCLUDED.company),
                raw_data = leads.raw_data || EXCLUDED.raw_data,
                updated_at = NOW()
              RETURNING *;
            `;
          } else {
            // Normal Insert
            query = `
              INSERT INTO leads (name, phone, email, gst, company, created_by, raw_data)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING *;
            `;
          }

          const leadResult = await client.query(query, params);
          finalLead = leadResult.rows[0];

          // Set values for response
          req.extracted = { phone, email, gst };
        }

        // 6. ASSOCIATE CARD
        const imageUrl = `/uploads/${req.file.filename}`;
        const cardResult = await client.query(
          "INSERT INTO visiting_cards (lead_id, image_url) VALUES ($1, $2) RETURNING *",
          [finalLead.id, imageUrl]
        );

        await client.query("COMMIT");

        // Structured Logging
        console.info("lead_ingest", {
          user_id: req.user.id,
          phone: req.extracted?.phone || null,
          email: req.extracted?.email || null,
          dedup: existingLead ? "hit" : "miss"
        });

        res.status(201).json({
          data: {
            card: cardResult.rows[0],
            ai: aiData,
            lead: finalLead,
            extracted: req.extracted || null,
          },
        });
      } catch (transactionError) {
        await client.query("ROLLBACK");
        throw transactionError;
      } finally {
        client.release();
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;
