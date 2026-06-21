import { Router, Request, Response } from "express";
import Task from "../models/Task.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    let tasks;
    if (req.user!.role === "admin") {
      tasks = await Task.find().populate("assigneeId", "name email").populate("campaignId", "name").sort({ createdAt: -1 });
    } else {
      tasks = await Task.find({ assigneeId: req.user!.userId })
        .populate("assigneeId", "name email")
        .populate("campaignId", "name")
        .sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

router.post("/", requireAdmin, async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    const populated = await task.populate("assigneeId", "name email");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    if (req.user!.role !== "admin" && task.assigneeId.toString() !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const allowedFields = req.user!.role === "admin"
      ? req.body
      : { status: req.body.status, timerRemaining: req.body.timerRemaining, timerIsRunning: req.body.timerIsRunning, timerStartedAt: req.body.timerStartedAt };

    const updated = await Task.findByIdAndUpdate(req.params.id, allowedFields, { new: true })
      .populate("assigneeId", "name email")
      .populate("campaignId", "name");

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
});

router.patch("/:id/timer", async (req: Request, res: Response) => {
  try {
    const { timerRemaining, timerIsRunning, timerStartedAt } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    if (task.assigneeId.toString() !== req.user!.userId && req.user!.role !== "admin") {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    task.timerRemaining = timerRemaining;
    task.timerIsRunning = timerIsRunning;
    task.timerStartedAt = timerStartedAt;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to update timer" });
  }
});

router.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
