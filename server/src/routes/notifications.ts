import { Router, Request, Response } from "express";
import Notification from "../models/Notification.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user!.userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.patch("/:id/read", async (req: Request, res: Response) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }
    res.json(notif);
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification" });
  }
});

router.post("/mark-all-read", async (req: Request, res: Response) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user!.userId, read: false },
      { read: true }
    );
    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notifications as read" });
  }
});

export default router;
