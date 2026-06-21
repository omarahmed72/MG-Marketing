import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import Campaign from "./models/Campaign.js";
import Specialty from "./models/Specialty.js";
import Task from "./models/Task.js";
import Report from "./models/Report.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/moheyeldin-crm";

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log("Database already seeded, skipping...");
    await mongoose.disconnect();
    return;
  }

  const admin = await User.create({
    googleId: "seed-admin",
    name: "أ. محمد محي الدين",
    email: "admin@moheyeldin.marketing",
    role: "admin",
    status: "active",
    specialty: "إدارة التسويق",
    workload: 68,
  });

  const member1 = await User.create({
    googleId: "seed-m1",
    name: "سارة خالد",
    email: "sara@moheyeldin.marketing",
    role: "member",
    status: "active",
    specialty: "صناعة المحتوى",
    workload: 40,
    overallRating: 5,
  });

  const member2 = await User.create({
    googleId: "seed-m2",
    name: "عمر محمود",
    email: "omar@moheyeldin.marketing",
    role: "member",
    status: "active",
    specialty: "الإعلانات المدفوعة",
    workload: 80,
    overallRating: 4,
  });

  const member3 = await User.create({
    googleId: "seed-m3",
    name: "ليلى سامي",
    email: "laila@moheyeldin.marketing",
    role: "member",
    status: "active",
    specialty: "التصميم الإبداعي",
    workload: 50,
    overallRating: 5,
  });

  const member4 = await User.create({
    googleId: "seed-m4",
    name: "يوسف علي",
    email: "youssef@moheyeldin.marketing",
    role: "member",
    status: "active",
    specialty: "تحليل البيانات",
    workload: 20,
    overallRating: 3,
  });

  const pendingUser = await User.create({
    googleId: "seed-p1",
    name: "منى عادل",
    email: "mona@gmail.com",
    role: "member",
    status: "pending",
    specialty: "صناعة المحتوى",
    workload: 0,
  });

  const specialties = await Specialty.insertMany([
    { name: "صناعة المحتوى", description: "تخطيط وكتابة المحتوى عبر القنوات المختلفة" },
    { name: "التصميم الإبداعي", description: "الهوية البصرية وتصميم مواد الحملات" },
    { name: "الإعلانات المدفوعة", description: "إدارة وتحسين الحملات الإعلانية الرقمية" },
    { name: "تحليل البيانات", description: "قياس الأداء وتحويل الأرقام إلى قرارات" },
    { name: "السوشيال ميديا", description: "إدارة المجتمع والنشر على المنصات" },
  ]);

  const campaigns = await Campaign.insertMany([
    { name: "إطلاق الصيف", channel: "السوشيال ميديا", budget: 85000, spent: 62000, progress: 73, leads: 1240 },
    { name: "عودة العملاء", channel: "البريد الإلكتروني", budget: 28000, spent: 12500, progress: 46, leads: 680 },
    { name: "وعي العلامة", channel: "إعلانات مدفوعة", budget: 120000, spent: 91000, progress: 78, leads: 2100 },
  ]);

  const task4 = await Task.create({
    title: "تجهيز التقرير الإحصائي الأسبوعي للتحويلات",
    assigneeId: member4._id,
    campaignId: campaigns[2]._id,
    priority: "medium",
    status: "done",
    dueDate: "2026-06-10",
    timerDuration: 5400,
    timerRemaining: 0,
    timerIsRunning: false,
    weight: 10,
    starsRating: 5,
    evaluatedAt: new Date().toISOString(),
  });

  await Task.insertMany([
    {
      title: "كتابة محتوى صفحة الهبوط الإبداعية",
      assigneeId: member1._id,
      campaignId: campaigns[0]._id,
      priority: "high",
      status: "todo",
      dueDate: "2026-06-25",
      timerDuration: 3600,
      timerRemaining: 3600,
      timerIsRunning: false,
      weight: 10,
    },
    {
      title: "تصميم وإخراج منشورات إطلاق الصيف",
      assigneeId: member3._id,
      campaignId: campaigns[0]._id,
      priority: "high",
      status: "progress",
      dueDate: "2026-06-28",
      timerDuration: 7200,
      timerRemaining: 7200,
      timerIsRunning: false,
      weight: 20,
    },
    {
      title: "مراجعة وتحسين أداء إعلانات Meta",
      assigneeId: member2._id,
      campaignId: campaigns[2]._id,
      priority: "medium",
      status: "progress",
      dueDate: "2026-06-29",
      timerDuration: 1800,
      timerRemaining: 1200,
      timerIsRunning: false,
      weight: 15,
    },
  ]);

  await Report.create({
    taskId: task4._id,
    taskTitle: "تجهيز التقرير الإحصائي الأسبوعي للتحويلات",
    memberId: member4._id,
    memberName: "يوسف علي",
    summary: "تم تجميع تقارير الحملات الإعلانية النشطة على غوغل وفيسبوك للتأكد من وصول معدل تكلفة العميل لأقل حد وتصدير مخرجات الأسبوع كتقرير منظم للإدارة.",
    attachments: [{ name: "analytics-excel.xlsx", url: "https://example.com/analytics-excel.xlsx", type: "file" }],
    status: "approved",
    adminFeedback: "مجهود رائع وتسليم دقيق في الموعد المحدد ومرفق ممتاز.",
    starsAwarded: 5,
    reviewedAt: new Date().toISOString(),
  });

  console.log("Seed completed successfully!");
  console.log(`  Users: ${await User.countDocuments()}`);
  console.log(`  Specialties: ${await Specialty.countDocuments()}`);
  console.log(`  Campaigns: ${await Campaign.countDocuments()}`);
  console.log(`  Tasks: ${await Task.countDocuments()}`);
  console.log(`  Reports: ${await Report.countDocuments()}`);

  await mongoose.disconnect();
}

seed().catch(console.error);
