import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { enqueueAiInsight } from "../../queues/ai.queue.js";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const job = await enqueueAiInsight({
      leadId: req.body.leadId,
      note: req.body.text,
      createdBy: req.user?.sub,
    });

    res.status(202).json({
      data: {
        note: {
          leadId: req.body.leadId,
          text: req.body.text,
        },
        jobId: job.id,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
