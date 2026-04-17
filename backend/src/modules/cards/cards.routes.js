import { Router } from "express";
import { db } from "../../config/db.js";
import { requireAuth, requireKnownUser } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/multer.js";
import { badRequest, isBlank } from "../../utils/validation.js";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  requireKnownUser,
  upload.single("cardImage"),
  async (req, res, next) => {
    try {
      const { lead_id } = req.body;

      if (isBlank(lead_id)) {
        throw badRequest("Lead ID is required.");
      }

      if (!req.file) {
        throw badRequest("No file uploaded.");
      }

      // Security check: Ensure user owns the lead
      const leadCheck = await db.query(
        "SELECT id FROM leads WHERE id = $1 AND created_by = $2",
        [lead_id, req.user.id]
      );

      if (leadCheck.rowCount === 0) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      const fullUrl = `${req.protocol}://${req.get("host")}${imageUrl}`;

      const result = await db.query(
        "INSERT INTO visiting_cards (lead_id, image_url) VALUES ($1, $2) RETURNING *",
        [lead_id, imageUrl]
      );

      res.status(201).json({
        data: {
          ...result.rows[0],
          image_url: imageUrl,
          full_url: fullUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
