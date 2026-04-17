import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { upload } from "../../config/multer.js";

const router = Router();

router.post(
  "/upload",
  requireAuth,
  upload.single("cardImage"),
  (req, res) => {
    res.status(201).json({
      data: {
        file: req.file || null,
      },
    });
  },
);

export default router;
