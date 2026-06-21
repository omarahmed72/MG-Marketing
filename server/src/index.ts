import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB, stopMongoDB, getMongoUri } from "./config/db.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import taskRoutes from "./routes/tasks.js";
import campaignRoutes from "./routes/campaigns.js";
import specialtyRoutes from "./routes/specialties.js";
import reportRoutes from "./routes/reports.js";
import notificationRoutes from "./routes/notifications.js";
import uploadRoutes from "./routes/upload.js";
import User from "./models/User.js";
import Campaign from "./models/Campaign.js";
import Specialty from "./models/Specialty.js";
import Task from "./models/Task.js";
import Report from "./models/Report.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/specialties", specialtyRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/admin/db", async (_req, res) => {
  const collections = await mongoose.connection.db?.listCollections().toArray() || [];
  const data: Record<string, any[]> = {};
  for (const c of collections) {
    const docs = await mongoose.connection.db?.collection(c.name).find().toArray() || [];
    data[c.name] = docs;
  }
  res.json({ uri: getMongoUri(), collections: data });
});

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("join:user", (userId: string) => { socket.join(`user:${userId}`); });
  socket.on("join:admin", () => { socket.join("admin"); });
  socket.on("disconnect", () => { console.log(`Client disconnected: ${socket.id}`); });
});

export { io };

async function seedIfEmpty() {
  const count = await User.countDocuments();
  if (count > 0) return;

  console.log("Seeding database with initial data...");

  const admin = await User.create({
    googleId: "seed-admin", name: "أ. محمد محي الدين", email: "admin@moheyeldin.marketing",
    role: "admin", status: "active", specialty: "إدارة التسويق", workload: 68,
  });
  const m1 = await User.create({
    googleId: "seed-m1", name: "سارة خالد", email: "sara@moheyeldin.marketing",
    role: "member", status: "active", specialty: "صناعة المحتوى", workload: 40, overallRating: 5,
  });
  const m2 = await User.create({
    googleId: "seed-m2", name: "عمر محمود", email: "omar@moheyeldin.marketing",
    role: "member", status: "active", specialty: "الإعلانات المدفوعة", workload: 80, overallRating: 4,
  });
  const m3 = await User.create({
    googleId: "seed-m3", name: "ليلى سامي", email: "laila@moheyeldin.marketing",
    role: "member", status: "active", specialty: "التصميم الإبداعي", workload: 50, overallRating: 5,
  });
  const m4 = await User.create({
    googleId: "seed-m4", name: "يوسف علي", email: "youssef@moheyeldin.marketing",
    role: "member", status: "active", specialty: "تحليل البيانات", workload: 20, overallRating: 3,
  });
  await User.create({
    googleId: "seed-p1", name: "منى عادل", email: "mona@gmail.com",
    role: "member", status: "pending", specialty: "صناعة المحتوى",
  });

  await Specialty.insertMany([
    { name: "صناعة المحتوى", description: "تخطيط وكتابة المحتوى عبر القنوات المختلفة" },
    { name: "التصميم الإبداعي", description: "الهوية البصرية وتصميم مواد الحملات" },
    { name: "الإعلانات المدفوعة", description: "إدارة وتحسين الحملات الإعلانية الرقمية" },
    { name: "تحليل البيانات", description: "قياس الأداء وتحويل الأرقام إلى قرارات" },
    { name: "السوشيال ميديا", description: "إدارة المجتمع والنشر على المنصات" },
  ]);

  const camps = await Campaign.insertMany([
    { name: "إطلاق الصيف", channel: "السوشيال ميديا", budget: 85000, spent: 62000, progress: 73, leads: 1240 },
    { name: "عودة العملاء", channel: "البريد الإلكتروني", budget: 28000, spent: 12500, progress: 46, leads: 680 },
    { name: "وعي العلامة", channel: "إعلانات مدفوعة", budget: 120000, spent: 91000, progress: 78, leads: 2100 },
  ]);

  const t4 = await Task.create({
    title: "تجهيز التقرير الإحصائي الأسبوعي للتحويلات", assigneeId: m4._id, campaignId: camps[2]._id,
    priority: "medium", status: "done", dueDate: "2026-06-10", timerDuration: 5400, timerRemaining: 0,
    timerIsRunning: false, weight: 10, starsRating: 5, evaluatedAt: new Date().toISOString(),
  });

  await Task.insertMany([
    { title: "كتابة محتوى صفحة الهبوط الإبداعية", assigneeId: m1._id, campaignId: camps[0]._id,
      priority: "high", status: "todo", dueDate: "2026-06-25", timerDuration: 3600, timerRemaining: 3600,
      timerIsRunning: false, weight: 10 },
    { title: "تصميم وإخراج منشورات إطلاق الصيف", assigneeId: m3._id, campaignId: camps[0]._id,
      priority: "high", status: "progress", dueDate: "2026-06-28", timerDuration: 7200, timerRemaining: 7200,
      timerIsRunning: false, weight: 20 },
    { title: "مراجعة وتحسين أداء إعلانات Meta", assigneeId: m2._id, campaignId: camps[2]._id,
      priority: "medium", status: "progress", dueDate: "2026-06-29", timerDuration: 1800, timerRemaining: 1200,
      timerIsRunning: false, weight: 15 },
  ]);

  await Report.create({
    taskId: t4._id, taskTitle: "تجهيز التقرير الإحصائي الأسبوعي للتحويلات",
    memberId: m4._id, memberName: "يوسف علي",
    summary: "تم تجميع تقارير الحملات الإعلانية النشطة على غوغل وفيسبوك.",
    attachments: [{ name: "analytics-excel.xlsx", url: "https://example.com/analytics-excel.xlsx", type: "file" }],
    status: "approved", adminFeedback: "مجهود رائع وتسليم دقيق.", starsAwarded: 5,
    reviewedAt: new Date().toISOString(),
  });

  console.log(`Seeded: ${await User.countDocuments()} users, ${await Task.countDocuments()} tasks`);
}

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  await seedIfEmpty();
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await stopMongoDB();
  process.exit(0);
});
