import { Task, TaskReport, UserProfile } from "../types";

export interface EmployeeStats {
  memberId: string;
  name: string;
  email: string;
  specialty: string;
  role: string;
  totalTasks: number;
  completedTasks: number;
  rejectedTasks: number;
  reviewTasks: number;
  totalWeightPoints: number;
  avgStars: number;
  overallRating: number; // 1-5
  evaluationMessage: string;
}

export function calculateEmployeeStats(
  member: UserProfile,
  tasks: Task[],
  reports: TaskReport[]
): EmployeeStats {
  const memberTasks = tasks.filter(t => t.assigneeId === member.id);
  const completed = memberTasks.filter(t => t.status === "done");
  const rejected = memberTasks.filter(t => t.status === "rejected");
  const review = memberTasks.filter(t => t.status === "review");

  // Sum weights of completed tasks as total points
  const totalWeightPoints = completed.reduce((sum, task) => sum + (task.weight || 0), 0);

  // Calculate average stars from approved task reports
  const approvedReports = reports.filter(r => r.memberId === member.id && r.status === "approved");
  const totalStars = approvedReports.reduce((sum, r) => sum + (r.starsAwarded || 0), 0);
  const avgStars = approvedReports.length > 0 ? (totalStars / approvedReports.length) : 0;

  // Evaluation sentence based on stats
  let evaluationMessage = "أداء ممتاز وتفاني مستمر في العمل.";
  if (avgStars >= 4.5 && completed.length > 3) {
    evaluationMessage = "أداء استثنائي متميز؛ جودة عالية وسرعة انجاز ممتازة.";
  } else if (avgStars >= 3.8) {
    evaluationMessage = "أداء قوي مستقر؛ يلبي جميع الأهداف المطلوبة باحترافية.";
  } else if (avgStars >= 2.5) {
    evaluationMessage = "أداء مقبول؛ يتمتع بروح جيدة مع حاجة لتطوير جودة مخرجات العمل.";
  } else if (completed.length === 0) {
    evaluationMessage = "لا توجد مهام مكتملة كافية في الدورة الحالية للتقييم.";
  } else {
    evaluationMessage = "بحاجة إلى جلسة مراجعة لمناقشة تحديات الأداء وزيادة الجودة.";
  }

  return {
    memberId: member.id,
    name: member.name,
    email: member.email,
    specialty: member.specialty,
    role: member.role,
    totalTasks: memberTasks.length,
    completedTasks: completed.length,
    rejectedTasks: rejected.length,
    reviewTasks: review.length,
    totalWeightPoints,
    avgStars,
    overallRating: Math.round(avgStars) || 0,
    evaluationMessage
  };
}

/**
 * Triggers a beautiful print job in the browser specifically styled for A4 performance sheets.
 * This guarantees the Arabic fonts, alignments, and graphs print beautifully as a pristine PDF document.
 */
export function printPerformancePdf(stats: EmployeeStats) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const ratingsStars = "⭐".repeat(stats.overallRating) || "لا يوجد تقييم";

  printWindow.document.write(`
    <html dir="rtl" lang="ar">
      <head>
        <title>تقرير الأداء التحليلي - ${stats.name}</title>
        <style>
          body {
            font-family: 'Madani Arabic', sans-serif;
            background: #ffffff;
            color: #101b33;
            margin: 0;
            padding: 40px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #1677ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            font-family: 'Madani Arabic', sans-serif;
            font-size: 20px;
            margin: 0;
            color: #0b214a;
          }
          .header p {
            font-size: 11px;
            color: #66728a;
            margin: 5px 0 0;
          }
          .stamp {
            border: 2px solid #1677ff;
            border-radius: 8px;
            padding: 8px 16px;
            color: #1677ff;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .meta-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
          }
          .meta-card h3 {
            margin: 0 0 10px;
            font-size: 13px;
            color: #66728a;
            font-weight: 500;
          }
          .meta-card p {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: #0b214a;
          }
          .scores-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .score-box {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            background: #f8fafc;
          }
          .score-box.featured {
            background: #f0f7ff;
            border-color: #bfe7ff;
          }
          .score-box span {
            display: block;
            font-size: 11px;
            color: #66728a;
            margin-bottom: 6px;
          }
          .score-box strong {
            font-size: 22px;
            color: #0b214a;
          }
          .evaluation-panel {
            background: #f0f7ff;
            border: 1px solid #bfe7ff;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .evaluation-panel h2 {
            font-family: 'Madani Arabic', sans-serif;
            font-size: 14px;
            margin: 0 0 10px;
            color: #1677ff;
          }
          .evaluation-panel p {
            margin: 0;
            font-size: 13px;
            line-height: 1.8;
            color: #0b214a;
          }
          .footer {
            margin-top: 60px;
            border-top: 1px dashed #e2e8f0;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #66728a;
          }
          @media print {
            body { padding: 20px; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>مؤسسة محي الدين للتسويق الرقمي</h1>
            <p>Mohey el-din Marketing CRM - تقرير التقييم الشهري للموظفين</p>
          </div>
          <div class="stamp">رسمي ومعتمد</div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-card">
            <h3>اسم الموظف</h3>
            <p>${stats.name}</p>
          </div>
          <div class="meta-card">
            <h3>التخصص الوظيفي</h3>
            <p>${stats.specialty}</p>
          </div>
          <div class="meta-card">
            <h3>البريد الإلكتروني</h3>
            <p>${stats.email}</p>
          </div>
          <div class="meta-card">
            <h3>تاريخ توليد التقرير</h3>
            <p>${new Date().toLocaleDateString("ar-EG")}</p>
          </div>
        </div>

        <div class="scores-grid">
          <div class="score-box featured">
            <span>النقاط الإجمالية المكتسبة</span>
            <strong>${stats.totalWeightPoints} نقطة</strong>
          </div>
          <div class="score-box">
            <span>التقييم الرقمي (النجمي)</span>
            <strong>${stats.avgStars.toFixed(1)} / 5</strong>
          </div>
          <div class="score-box">
            <span>المهام المكتملة</span>
            <strong>${stats.completedTasks}</strong>
          </div>
          <div class="score-box">
            <span>مجموع المهام الكلي</span>
            <strong>${stats.totalTasks}</strong>
          </div>
        </div>

        <div class="evaluation-panel">
          <h2>التقييم والبيان التحليلي النهائي: ${ratingsStars}</h2>
          <p>${stats.evaluationMessage}</p>
          <p style="margin-top: 10px; font-weight: 500; color: #66728a;">
            * ملاحظة: يتم احتساب النقاط الإجمالية بضرب أوزان المهام المنجزة بنجاح خلال الشهر الجاري.
          </p>
        </div>

        <div style="margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="text-align: center;">
            <p style="font-weight: 600; margin-bottom: 50px;">توقيع مدير إدارة الموارد البشرية</p>
            <p style="border-top: 1px solid #e2e8f0; display: inline-block; width: 150px; padding-top: 5px; color: #66728a;">أ. محمد محي الدين</p>
          </div>
          <div style="text-align: center;">
            <p style="font-weight: 600; margin-bottom: 50px;">خاتم الشركة واعتماد الإدارة</p>
            <div style="border: 2px dashed #66728a; border-radius: 50%; width: 90px; height: 90px; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; color: #66728a; transform: rotate(-15deg);">
              Mohey el-din
            </div>
          </div>
        </div>

        <div class="footer">
          <span>نظام Mohey el-din Marketing © 2026</span>
          <span>صفحة 1 / 1</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
