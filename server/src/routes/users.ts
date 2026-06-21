import { Router, Request, Response } from "express";
import User from "../models/User.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (_req: Request, res: Response) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.patch("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, specialty, role, overallRating } = req.body;
    const update: Record<string, unknown> = {};
    if (status) update.status = status;
    if (specialty) update.specialty = specialty;
    if (role) update.role = role;
    if (overallRating !== undefined) update.overallRating = overallRating;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.patch("/:id/rate", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { overallRating } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { overallRating },
      { new: true }
    );
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to rate user" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
