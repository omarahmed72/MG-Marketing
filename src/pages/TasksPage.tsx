import React, { useState, useMemo } from "react";
import { Plus, Star } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useUsers } from "../hooks/useUsers";
import { useCampaigns } from "../hooks/useCampaigns";
import { useReports } from "../hooks/useReports";
import { useSpecialties } from "../hooks/useSpecialties";
import TaskTimer from "../components/TaskTimer";
import TaskReportModal from "../components/TaskReportModal";
import AdminReportReviewModal from "../components/AdminReportReviewModal";
import { Task, TaskStatus, TaskAttachment } from "../types";

export default function TasksPage() {
  const { user } = useAuth();
  const { tasks, createTask, updateTask, updateTimer } = useTasks();
  const { users } = useUsers();
  const { campaigns } = useCampaigns();
  const { specialties } = useSpecialties();
  const { reports, submitReport, approveReport, rejectReport, resubmitReport } = useReports();

  const [searchQuery, setSearchQuery] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForReport, setSelectedTaskForReport] = useState<Task | null>(null);
  const [selectedReportForReview, setSelectedReportForReview] = useState<any>(null);
  const [selectedTaskForRejectionExplanation, setSelectedTaskForRejectionExplanation] = useState<Task | null>(null);
  const [rejectionExpText, setRejectionExpText] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskCampaign, setNewTaskCampaign] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskWeight, setNewTaskWeight] = useState(10);
  const [newTaskHours, setNewTaskHours] = useState(1);
  const [newTaskMinutes, setNewTaskMinutes] = useState(0);

  const activeMembers = users.filter((u) => u.status === "active");

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    const baseTasks = user.role === "admin" ? tasks : tasks.filter((t) => t.assigneeId === user.id);
    if (!searchQuery.trim()) return baseTasks;
    return baseTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, user, searchQuery]);

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

  const handleStartTask = async (task: Task) => {
    await updateTask(task.id, { status: "progress", timerIsRunning: true } as any);
  };

  const handleTimerSync = async (taskId: string, remaining: number, isRunning: boolean) => {
    await updateTimer(taskId, remaining, isRunning, isRunning ? new Date().toISOString() : undefined);
  };

  const handleSubmitReport = async (taskId: string, summary: string, attachments: TaskAttachment[]) => {
    await submitReport(taskId, summary, attachments);
    setSelectedTaskForReport(null);
  };

  const handleApproveReport = async (reportId: string, feedback: string, stars: number) => {
    await approveReport(reportId, feedback, stars);
    setSelectedReportForReview(null);
  };

  const handleRejectReport = async (reportId: string, feedback: string) => {
    await rejectReport(reportId, feedback);
    setSelectedReportForReview(null);
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForRejectionExplanation || !rejectionExpText.trim()) return;
    const currentReport = reports.find((r) => r.taskId === selectedTaskForRejectionExplanation.id);
    if (!currentReport) return;
    await resubmitReport(currentReport.id, { rejectionExplanation: rejectionExpText });
    setRejectionExpText("");
    setSelectedTaskForRejectionExplanation(null);
  };

  const columns: { status: TaskStatus; title: string; color: string; dotColor: string }[] = [
    { status: "todo", title: "مطلوبة (Todo)", color: "bg-slate-100", dotColor: "bg-slate-400" },
    { status: "progress", title: "قيد التنفيذ (Progress)", color: "bg-blue-100/40 border border-blue-200/50", dotColor: "bg-blue-500" },
    { status: "review", title: "قيد المراجعة (Review)", color: "bg-amber-100/40 border border-amber-200/50", dotColor: "bg-amber-500 animate-pulse" },
    { status: "done", title: "معتمدة مقبولة (Done)", color: "bg-emerald-100/40 border border-emerald-200/50", dotColor: "bg-emerald-500" },
    { status: "rejected", title: "تعديلات وملاحظات (Rejected)", color: "bg-red-100/40 border border-red-200/50", dotColor: "bg-red-500" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600">جدولة وتوقيت مهام الفريق</span>
          <h1 className="text-2xl font-black text-slate-800 mt-1">المهام والمؤقتات اليومية</h1>
        </div>
        {user?.role === "admin" && (
          <button onClick={() => setIsTaskModalOpen(true)} className="px-4.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/10">
            <Plus className="w-4 h-4" />
            <span>تكليف بمهمة جديدة</span>
          </button>
        )}
      </div>

      {user?.role !== "admin" && (
        <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 text-xs text-right leading-relaxed flex items-center justify-between gap-3">
          <span>💡 الخصوصية مفعلة: هذه اللوحة مخصصة لك فقط، ولا يمكنك رؤية المهام أو المؤقتات الخاصة بزملائك في المساحة.</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-4 items-start mt-2">
        {columns.map((col) => (
          <div key={col.status} className={`p-3 rounded-2xl ${col.color} flex flex-col gap-3 min-h-[350px]`}>
            <div className="flex justify-between items-center px-1">
              <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
              <h4 className="text-xs font-bold text-slate-700">{col.title}</h4>
              <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full">{filteredTasks.filter((t) => t.status === col.status).length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {filteredTasks.filter((t) => t.status === col.status).map((task) => {
                const associatedReport = reports.find((r) => r.taskId === task.id);
                return (
                  <div key={task.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-right flex flex-col gap-2.5 shadow-sm">
                    <span className="text-[9px] font-bold text-indigo-600">{campaigns.find((c) => c.id === task.campaignId)?.name || "الحملة العامة"}</span>
                    <h5 className="text-xs font-bold text-slate-800 leading-normal">{task.title}</h5>
                    <span className="text-[10px] text-slate-400">التسليم: {new Date(task.dueDate).toLocaleDateString("ar-EG")}</span>

                    <TaskTimer task={task} onUpdateTimer={handleTimerSync} canControl={user?.id === task.assigneeId} />

                    {col.status === "todo" && user?.id === task.assigneeId && (
                      <button onClick={() => handleStartTask(task)} className="w-full py-2 hover:bg-indigo-50 hover:text-indigo-600 transition text-[11px] font-bold text-slate-600 border border-slate-200 rounded-xl">بدء المهمة الآن ▶️</button>
                    )}

                    {col.status === "progress" && user?.id === task.assigneeId && (
                      <button onClick={() => setSelectedTaskForReport(task)} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-[11px] flex items-center justify-center gap-1">تسليم التقرير للأدمن 📝</button>
                    )}

                    {col.status === "review" && user?.role === "admin" && associatedReport && (
                      <button onClick={() => setSelectedReportForReview(associatedReport)} className="w-full py-2 bg-amber-500/10 border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-500 hover:text-white transition text-[11px]">مراجعة تقرير المخرجات ⭐</button>
                    )}

                    {col.status === "review" && user?.role !== "admin" && (
                      <div className="p-2 bg-slate-50 rounded-xl text-center text-[10px] text-amber-800 font-semibold border border-amber-500/10">بانتظار تصديق الأدمن والتقييم...</div>
                    )}

                    {col.status === "done" && (
                      <div className="flex gap-1 justify-end py-1 items-center">
                        <span className="text-[9px] text-slate-400 mr-2">جودة التقييم:</span>
                        {Array.from({ length: task.starsRating || 5 }).map((_, i) => (<Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />))}
                      </div>
                    )}

                    {col.status === "done" && (
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 text-center font-bold py-1 rounded-lg">+ {task.weight} نقطة مستحقة لراتبك</span>
                    )}

                    {col.status === "rejected" && associatedReport?.adminFeedback && (
                      <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-[10px] text-red-700 leading-relaxed font-medium">
                        <span className="font-bold underline">تعليق الأدمن:</span> {associatedReport.adminFeedback}
                      </div>
                    )}

                    {col.status === "rejected" && user?.id === task.assigneeId && (
                      <button onClick={() => setSelectedTaskForRejectionExplanation(task)} className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 text-[11px]">تقديم مسببات وتعديل المخرج 🔁</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/80 border border-white/50 shadow-2xl rounded-[28px] overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/40">
              <h2 className="text-sm font-bold text-slate-800">التكليف بمهمة وجدولة نقاطها</h2>
              <button onClick={() => setIsTaskModalOpen(false)} className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"><Plus className="w-5 h-5" /></button>
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

      {/* Task Report Modal */}
      {selectedTaskForReport && (
        <TaskReportModal task={selectedTaskForReport} onClose={() => setSelectedTaskForReport(null)} onSubmitReport={handleSubmitReport} />
      )}

      {/* Admin Review Modal */}
      {selectedReportForReview && (
        <AdminReportReviewModal report={selectedReportForReview} onClose={() => setSelectedReportForReview(null)} onApprove={handleApproveReport} onReject={handleRejectReport} />
      )}

      {/* Rejection Explanation Modal */}
      {selectedTaskForRejectionExplanation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/85 border border-white/50 shadow-2xl rounded-[24px] overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/40">
              <h2 className="text-xs font-bold text-slate-800">مراجعة التعديلات وتوقيت التوضيح</h2>
              <button onClick={() => setSelectedTaskForRejectionExplanation(null)} className="p-1 rounded-lg border hover:bg-slate-50"><Plus className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleResubmit} className="p-5 flex flex-col gap-4 text-right">
              <div className="p-3 bg-red-500/5 rounded-2xl text-[11px] text-red-800 leading-relaxed font-semibold">
                يرجى كتابة المبررات، أو ما تم تنفيذه لمعالجة ملاحظات الأدمن.
              </div>
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                <span>توضيح وتعليق الموظف حول التعديل الملتزم *</span>
                <textarea required rows={4} value={rejectionExpText} onChange={(e) => setRejectionExpText(e.target.value)}
                  placeholder="مثال: تم مراجعة نظام التصميم، وتغيير درجات الألوان..."
                  className="p-3 bg-white/50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed" />
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">تسليم التعديلات الفورية للمراجعة</button>
                <button type="button" onClick={() => setSelectedTaskForRejectionExplanation(null)} className="px-4 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-600">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
