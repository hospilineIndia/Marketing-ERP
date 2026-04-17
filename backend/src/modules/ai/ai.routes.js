import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/status", requireAuth, (_req, res) => {
  res.json({
    data: {
      queue: "ai-processing",
      status: "idle",
    },
  });
});

export default router;
