import { Router, Request, Response } from "express";
import Specialty from "../models/Specialty.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const specialties = await Specialty.find().sort({ name: 1 });
    res.json(specialties);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch specialties" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const specialty = await Specialty.create(req.body);
    res.status(201).json(specialty);
  } catch (error) {
    res.status(500).json({ error: "Failed to create specialty" });
  }
});

router.patch("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const specialty = await Specialty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!specialty) {
      res.status(404).json({ error: "Specialty not found" });
      return;
    }
    res.json(specialty);
  } catch (error) {
    res.status(500).json({ error: "Failed to update specialty" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await Specialty.findByIdAndDelete(req.params.id);
    res.json({ message: "Specialty deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete specialty" });
  }
});

export default router;
