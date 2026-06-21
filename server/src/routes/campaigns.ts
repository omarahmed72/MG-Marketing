import { Router, Request, Response } from "express";
import Campaign from "../models/Campaign.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.create(req.body);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

router.patch("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!campaign) {
      res.status(404).json({ error: "Campaign not found" });
      return;
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

export default router;
