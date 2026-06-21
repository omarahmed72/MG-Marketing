import { Router, Request, Response } from "express";
import Report from "../models/Report.js";
import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", async (req: Request, res: Response) => {
  try {
    let reports;
    if (req.user!.role === "admin") {
      reports = await Report.find().sort({ createdAt: -1 });
    } else {
      reports = await Report.find({ memberId: req.user!.userId }).sort({ createdAt: -1 });
    }
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const report = await Report.create({
      ...req.body,
      memberId: req.user!.userId,
      memberName: req.user!.email,
    });
    const populated = await report.populate("memberId", "name email");

    await Task.findByIdAndUpdate(req.body.taskId, { status: "review", timerIsRunning: false });

    const admins = await (await import("../models/User.js")).default.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        recipientId: admin._id,
        title: "تقرير إنجاز جديد في مراجعة العمل",
        message: `قدّم الموظف ${req.user!.email} تقرير إنجاز عن مهمة: ${report.taskTitle}`,
        type: "review",
      });
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

router.patch("/:id/approve", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { feedback, stars } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "approved", adminFeedback: feedback, starsAwarded: stars, reviewedAt: new Date().toISOString() },
      { new: true }
    );
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    await Task.findByIdAndUpdate(report.taskId, { status: "done", starsRating: stars, evaluatedAt: new Date().toISOString() });

    await Notification.create({
      recipientId: report.memberId,
      title: "تهانينا! تم اعتماد مهمتك بنجاح",
      message: `اعتمد الأدمن تقرير مهمتك المكتملة بنجوم قيمتها: ${stars}`,
      type: "rating",
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to approve report" });
  }
});

router.patch("/:id/reject", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { feedback } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", adminFeedback: feedback, reviewedAt: new Date().toISOString() },
      { new: true }
    );
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    await Task.findByIdAndUpdate(report.taskId, { status: "rejected" });

    await Notification.create({
      recipientId: report.memberId,
      title: "تنبيه تعديل! تم إرجاع المهمة للتنقيح",
      message: `علّق الأدمن على تقريرك ملتمسًا التعديل والمراجعة: ${feedback}`,
      type: "tasks",
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to reject report" });
  }
});

router.patch("/:id/resubmit", async (req: Request, res: Response) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    if (report.memberId.toString() !== req.user!.userId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }

    const { summary, rejectionExplanation, attachments } = req.body;
    if (summary) report.summary = summary;
    if (rejectionExplanation) {
      report.rejectionExplanation = rejectionExplanation;
      report.rejectionCommentedAt = new Date().toISOString();
    }
    if (attachments) report.attachments = attachments;
    report.status = "pending";
    await report.save();

    await Task.findByIdAndUpdate(report.taskId, { status: "review" });

    const admins = await (await import("../models/User.js")).default.find({ role: "admin" });
    for (const admin of admins) {
      await Notification.create({
        recipientId: admin._id,
        title: "إعادة تقديم تقرير لتاسك معدل",
        message: `أرسل ${req.user!.email} توضيحًا وتعليقات جديدة لمهمة: ${report.taskTitle}`,
        type: "review",
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: "Failed to resubmit report" });
  }
});

export default router;
