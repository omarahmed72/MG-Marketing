import { useMemo } from "react";
import { FileDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { useUsers } from "../hooks/useUsers";
import { useReports } from "../hooks/useReports";
import { useSpecialties } from "../hooks/useSpecialties";
import { calculateEmployeeStats, printPerformancePdf } from "../utils/reports";
import client from "../api/client";

export default function TeamPage() {
  const { user } = useAuth();
  const { tasks, updateTask } = useTasks();
  const { users, updateUser, deleteUser } = useUsers();
  const { reports } = useReports();
  const { specialties } = useSpecialties();

  const activeMembers = users.filter((u) => u.status === "active");
  const pendingMembersList = users.filter((u) => u.status === "pending");

  const teamMemberStats = useMemo(() => {
    return activeMembers.map((member) => calculateEmployeeStats(member, tasks, reports));
  }, [activeMembers, tasks, reports]);

  const handleApproveTeammate = async (memberId: string, chosenSpecialty: string) => {
    await updateUser(memberId, { status: "active", specialty: chosenSpecialty } as any);
    try {
      await client.post("/notifications", {
        recipientId: memberId,
        title: "أهلًا بك! تم تفعيل حسابك من مدير المساحة",
        message: `تم قبول طلب انضمامك لقسم الماركتينج بنجاح. تخصصك: ${chosenSpecialty}`,
        type: "team",
      });
    } catch {}
  };

  const handleRejectTeammate = async (memberId: string) => {
    await deleteUser(memberId);
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600">تقييم الكادر وإجراءات PDF</span>
          <h1 className="text-2xl font-black text-slate-800 mt-1">كادر فريق التسويق والشركاء</h1>
        </div>
      </div>

      {/* Pending Requests */}
      {user?.role === "admin" && pendingMembersList.length > 0 && (
        <div className="p-5 bg-slate-900 text-white rounded-3xl flex flex-col gap-4 shadow-xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold bg-indigo-600 px-3 py-1 rounded-full text-indigo-100">رسمي</span>
            <span className="text-sm font-bold tracking-tight">طلبات التفعيل والانضمام المعلقة ({pendingMembersList.length})</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {pendingMembersList.map((pending) => (
              <div key={pending.id} className="p-4 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-right">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold flex items-center justify-center">{pending.name[0]}</div>
                  <div className="flex flex-col">
                    <strong className="font-bold">{pending.name}</strong>
                    <span className="text-slate-600">{pending.email}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <select id={`select-specialty-${pending.id}`} defaultValue={specialties[0]?.name || "صناعة المحتوى"}
                    className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] outline-none font-semibold text-white">
                    {specialties.map((sp) => (<option key={sp.id} value={sp.name}>{sp.name}</option>))}
                  </select>
                  <button onClick={() => {
                    const selectEl = document.getElementById(`select-specialty-${pending.id}`) as HTMLSelectElement;
                    handleApproveTeammate(pending.id, selectEl?.value || "صناعة المحتوى");
                  }} className="px-3 py-1.5 rounded-lg bg-indigo-500 text-slate-900 font-bold hover:bg-indigo-600">تفعيل انضمام</button>
                  <button onClick={() => handleRejectTeammate(pending.id)} className="px-2 py-1.5 rounded-lg bg-red-650 hover:bg-red-750 text-red-400 transition">إلغاء</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Members Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 text-right">
        {teamMemberStats.map((stat) => (
          <div key={stat.memberId} className="p-5 glass-panel rounded-3xl flex flex-col gap-4 relative overflow-hidden shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">{stat.name[0]}</div>
              <div className="flex flex-col">
                <strong className="text-sm font-bold text-slate-800">{stat.name}</strong>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{stat.specialty}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-b border-slate-200/50 py-3 text-xs">
              <div>
                <span className="text-slate-400 block">مهام مكتملة</span>
                <strong className="text-[13px] text-slate-700 mt-0.5 block">{stat.completedTasks} مهام</strong>
              </div>
              <div>
                <span className="text-slate-400 block">نقاط العمل الكليّة</span>
                <strong className="text-[13px] text-slate-600 font-bold block">{stat.totalWeightPoints} نقطة مجدية</strong>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => printPerformancePdf(stat)} className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow">
                <FileDown className="w-4 h-4 ml-1 text-indigo-400" />
                <span>استخراج تقرير أداء PDF شهري</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
