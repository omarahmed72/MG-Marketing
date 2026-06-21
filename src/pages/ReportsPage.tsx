import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useReports } from "../hooks/useReports";
import AdminReportReviewModal from "../components/AdminReportReviewModal";

export default function ReportsPage() {
  const { user } = useAuth();
  const { reports, approveReport, rejectReport } = useReports();
  const [selectedReportForReview, setSelectedReportForReview] = useState<any>(null);

  const handleApprove = async (reportId: string, feedback: string, stars: number) => {
    await approveReport(reportId, feedback, stars);
    setSelectedReportForReview(null);
  };

  const handleReject = async (reportId: string, feedback: string) => {
    await rejectReport(reportId, feedback);
    setSelectedReportForReview(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-50 text-emerald-800";
      case "rejected": return "bg-red-50 text-red-800";
      default: return "bg-amber-50 text-amber-800 animate-pulse";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "تم قبول التقرير والاعتماد";
      case "rejected": return "مرفوض - وبانتظار التعديل";
      default: return "قيد المراجعة حاليًا";
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div>
        <span className="text-xs font-bold text-black">أرشيف تقارير المخرجات والتقييمات الفورية</span>
        <h1 className="text-2xl font-black text-slate-800 mt-1">تقارير التنفيذ والتسليمات</h1>
      </div>

      <div className="flex flex-col gap-4 text-right mt-2">
        {reports.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 italic bg-white/40 border border-slate-200 rounded-3xl">
            لا توجد تقارير منشورة حاليًا في أرشيف مساحة العمل.
          </div>
        ) : (
          reports.map((rep) => (
            <div key={rep.id} className="p-5 glass-panel rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-2.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">رقم التقرير: #{rep.id}</span>
                  <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${getStatusBadge(rep.status)}`}>{getStatusText(rep.status)}</span>
                </div>
                <h4 className="text-[14px] font-bold text-slate-800">تاسك: {rep.taskTitle}</h4>
                <span className="text-[10px] text-slate-400">بواسطة الموظف: {rep.memberName} · بتاريخ {new Date(rep.createdAt).toLocaleDateString("ar-EG")}</span>
                <p className="text-slate-600 text-xs leading-relaxed max-w-2xl">{rep.summary}</p>
                {rep.adminFeedback && (
                  <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 leading-relaxed font-semibold">
                    <span className="font-bold text-indigo-850">تعقيب مراجعة الإدارة:</span> {rep.adminFeedback}
                  </div>
                )}
              </div>
              {user?.role === "admin" && rep.status === "pending" && (
                <button onClick={() => setSelectedReportForReview(rep)} className="p-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 transition text-white text-xs font-bold">
                  اتخاذ قرار تقييمي 📝
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {selectedReportForReview && (
        <AdminReportReviewModal
          report={selectedReportForReview}
          onClose={() => setSelectedReportForReview(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}
