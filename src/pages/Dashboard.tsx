import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Star, CheckSquare } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useUsers } from "../hooks/useUsers";
import { useReports } from "../hooks/useReports";
import { useCampaigns } from "../hooks/useCampaigns";
import { useSpecialties } from "../hooks/useSpecialties";
import { calculateEmployeeStats, printPerformancePdf } from "../utils/reports";
import client from "../api/client";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tasks, createTask } = useTasks();
  const { users, rateUser } = useUsers();
  const { reports } = useReports();
  const { campaigns } = useCampaigns();
  const { specialties } = useSpecialties();

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskCampaign, setNewTaskCampaign] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskWeight, setNewTaskWeight] = useState(10);
  const [newTaskHours, setNewTaskHours] = useState(1);
  const [newTaskMinutes, setNewTaskMinutes] = useState(0);

  const activeMembers = users.filter((u) => u.status === "active");
  const pendingMembersList = users.filter((u) => u.status === "pending");

  const teamMemberStats = useMemo(() => {
    return activeMembers.map((member) => calculateEmployeeStats(member, tasks, reports));
  }, [activeMembers, tasks, reports]);

  const calculatedWorkload = useMemo(() => {
    return (userId: string) => {
      const unsolved = tasks.filter((t) => t.assigneeId === userId && t.status !== "done").length;
      return Math.min(100, unsolved * 25);
    };
  }, [tasks]);

  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskAssignee || !newTaskDueDate) return;
    const allottedSeconds = newTaskHours * 3600 + newTaskMinutes * 60;
    await createTask({
      title: newTaskTitle.trim(),
      assigneeId: newTaskAssignee,
      campaignId: newTaskCampaign || campaigns[0]?.id,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      timerDuration: allottedSeconds,
      timerRemaining: allottedSeconds,
      weight: Number(newTaskWeight),
    });
    setIsTaskModalOpen(false);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskWeight(10);
    setNewTaskHours(1);
    setNewTaskMinutes(0);
  };

  const handleRateEmployee = async (memberId: string, rating: number) => {
    await rateUser(memberId, rating);
    try {
      const { data } = await client.post("/notifications", {
        recipientId: memberId,
        title: "تم تحديث تقييمك الشهري الشامل",
        message: `منحك المدير تقييمًا وشهادة نهائية شاملة لهذا الشهر بمعدل: ${"⭐️".repeat(rating)}!`,
        type: "rating",
      });
    } catch {}
  };

  const totalPoints = teamMemberStats.reduce((sum, s) => sum + s.totalWeightPoints, 0);
  const activeTasksCount = tasks.filter((t) => t.status === "progress" || t.status === "todo" || t.status === "rejected").length;
  const completionRate = tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[21px] font-bold uppercase">نظرة عامة شاملة للأداء</span>
          <h1 className="text-2xl md:text-4xl font-black text-slate-800 mt-1">أنشطة فريق الماركتينج</h1>
        </div>
        <button onClick={() => setIsTaskModalOpen(true)} className="px-4.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/10">
          <Plus className="w-4 h-4" />
          <span>إضافة مهمة جديدة</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between items-center min-h-[140px]">
          <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">⏱️</div>
          <div>
            <span className="text-[21px] font-bold text-slate-400 block">مهام نشطة قيد الإنجاز</span>
            <strong className="text-2xl font-black text-center text-slate-800 mt-2 block">{activeTasksCount} مهام</strong>
          </div>
        </div>
        <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between items-center min-h-[140px]">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">🎯</div>
          <div>
            <span className="text-[21px] font-bold text-slate-400 block">نسبة تغطية الإنجاز</span>
            <strong className="text-2xl font-black text-center text-slate-800 mt-2 block">{completionRate}% إتمام</strong>
          </div>
        </div>
        <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between items-center min-h-[140px]">
          <div className="w-8 h-8 rounded-xl bg-indigo-150 border border-indigo-200 flex items-center justify-center text-indigo-600">👥</div>
          <div>
            <span className="text-[21px] font-bold text-slate-400 block">كادر الفريق والطلبات</span>
            <strong className="text-2xl font-black text-center text-slate-800 mt-2 block">{activeMembers.length} موظف {pendingMembersList.length > 0 && `(+${pendingMembersList.length} معلق)`}</strong>
          </div>
        </div>
        <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between items-center min-h-[140px]">
          <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">🏆</div>
          <div>
            <span className="text-[21px] font-bold text-slate-400 block">متوسط نقاط التكريم الكلي</span>
            <strong className="text-2xl text-center font-black text-slate-800 mt-2 block">{totalPoints} نقطة شهريًا</strong>
          </div>
        </div>
      </div>

      {/* Team Performance & Workload */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 glass-panel rounded-3xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/20 pb-2">
            <div className="text-right">
              <span className="text-[10px] font-bold text-indigo-950">تحديث لحظي</span>
              <h3 className="text-base font-bold text-slate-800">متابعة الأداء وساعات النبض الإنشائي</h3>
            </div>
          </div>
          <div className="flex flex-col gap-3 py-1 text-right">
            {teamMemberStats.map((stat) => (
              <div key={stat.memberId} className="p-3 bg-white/40 hover:bg-white/60 transition rounded-2xl border border-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-700 font-bold uppercase">{stat.name[0]}</div>
                  <div className="flex flex-col">
                    <strong className="text-slate-800 text-[13px]">{stat.name}</strong>
                    <span className="text-[10px] text-slate-400 uppercase">{stat.specialty}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 items-center justify-between sm:justify-end">
                  <div className="flex flex-col text-right">
                    <span className="text-[15px] text-slate-400">التقييم الشامل لهذا الشهر</span>
                    <div className="flex gap-1 mt-1 justify-end">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 hover:scale-125 cursor-pointer ${s <= (stat.overallRating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                          onClick={() => handleRateEmployee(stat.memberId, s)} />
                      ))}
                    </div>
                  </div>
                  <div className="text-left font-mono text-[13px] font-bold text-white bg-indigo-600 px-2 py-1 rounded-xl">{stat.totalWeightPoints} نقطة</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 glass-panel rounded-3xl flex flex-col gap-4 text-right">
          <h3 className="text-base font-bold text-slate-800">كثافة العمل النشط</h3>
          <p className="text-xs text-slate-500 leading-relaxed">توزيع قوة وتغطية ساعات التسليمات حاليًا للموظفين الفاعلين:</p>
          <div className="flex flex-col gap-4 mt-2">
            {activeMembers.map((m) => {
              const load = calculatedWorkload(m.id);
              return (
                <div key={m.id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-base">
                    <strong className="text-slate-700">{m.name}</strong>
                    <span className="text-slate-500 font-bold font-mono text-base">{load}% عبء عمل</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div className={`h-full rounded-full ${load > 75 ? "bg-red-500" : load > 40 ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${load}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/80 border border-white/50 shadow-2xl rounded-[28px] overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/40">
              <h2 className="text-sm font-bold text-slate-800">التكليف بمهمة وجدولة نقاطها</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"><CheckSquare className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddNewTask} className="p-5 flex flex-col gap-4 text-right">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                <span>اسم ومسمى المهمة المطلوبة *</span>
                <input required type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="مثال: تجهيز تصميمات الواجهات الزجاجية" className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>إسناد للموظف *</span>
                  <select value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs" required>
                    <option value="">اختر الموظف...</option>
                    {activeMembers.map((u) => (<option key={u.id} value={u.id}>{u.name} ({u.specialty})</option>))}
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>الحملة الملحقة</span>
                  <select value={newTaskCampaign} onChange={(e) => setNewTaskCampaign(e.target.value)} className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs">
                    {campaigns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>أولوية التكليف</span>
                  <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value as any)} className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs">
                    <option value="high">شديدة الأولوية</option>
                    <option value="medium">متوسطة الأولوية</option>
                    <option value="low">منخفضة</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>موعد التسليم *</span>
                  <input required type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="p-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs" />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>وزن المهمة (نقاط) *</span>
                  <input required type="number" min={1} value={newTaskWeight} onChange={(e) => setNewTaskWeight(Number(e.target.value))} className="p-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs text-center font-mono font-bold" />
                </label>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold block">الوقت المخصص للعداد الزمني التلقائي:</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2"><span>ساعة(ـات):</span><input type="number" min={0} max={24} value={newTaskHours} onChange={(e) => setNewTaskHours(Number(e.target.value))} className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center outline-none font-bold font-mono" /></label>
                  <label className="flex items-center gap-2"><span>دقيقة (دقائق):</span><input type="number" min={0} max={59} value={newTaskMinutes} onChange={(e) => setNewTaskMinutes(Number(e.target.value))} className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center outline-none font-bold font-mono" /></label>
                </div>
              </div>
              <div className="flex gap-2.5 mt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs shadow-md shadow-indigo-600/10">تأكيد الجدولة والإرسال للموظف</button>
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
