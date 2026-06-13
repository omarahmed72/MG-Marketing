import { useState } from "react";
import { X, Star, FileText, CheckCircle2, AlertOctagon } from "lucide-react";
import { TaskReport } from "../types";

interface AdminReportReviewModalProps {
  report: TaskReport;
  onClose: () => void;
  onApprove: (reportId: string, feedback: string, stars: number) => void;
  onReject: (reportId: string, feedback: string) => void;
}

export default function AdminReportReviewModal({ 
  report, 
  onClose, 
  onApprove, 
  onReject 
}: AdminReportReviewModalProps) {
  const [feedback, setFeedback] = useState(report.adminFeedback || "");
  const [stars, setStars] = useState<number>(report.starsAwarded || 5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleSubmitApprove = () => {
    onApprove(report.id, feedback, stars);
  };

  const handleSubmitReject = () => {
    if (!feedback.trim()) {
      alert("الرجاء كتابة سبب الرفض أو التعديلات المطلوبة كإيضاح للموظف.");
      return;
    }
    onReject(report.id, feedback);
  };

  return (
    <div id={`review-modal-overlay-${report.id}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div 
        id={`review-modal-${report.id}`} 
        className="w-full max-w-lg bg-white/80 border border-white/50 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-2xl animate-[enter_0.25s_ease]"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/40">
          <div>
            <span className="text-[10px] font-bold tracking-wide text-indigo-700 uppercase">
              لوحة مراجعة تقارير التنفيذ
            </span>
            <h2 className="text-base font-bold text-slate-800 mt-0.5">
              مراجعة مهمة: {report.taskTitle}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            id={`review-modal-close-${report.id}`}
            className="p-1.5 rounded-xl border border-slate-200 bg-white/60 text-slate-600 hover:text-slate-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Report Metadata */}
          <div className="p-3 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400">بواسطة الموظف: </span>
              <strong className="text-slate-700">{report.memberName}</strong>
            </div>
            <div>
              <span className="text-slate-400">تاريخ التقديم: </span>
              <strong className="text-slate-700">
                {new Date(report.createdAt).toLocaleDateString("ar-EG")}
              </strong>
            </div>
          </div>

          {/* Member's text summary */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-4 h-4 text-indigo-600" />
              التقرير التفصيلي والملخص المقدم:
            </span>
            <div className="p-4 bg-white/50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed max-white whitespace-pre-wrap">
              {report.summary}
            </div>
          </div>

          {/* Member's support files/attachments */}
          {report.attachments && report.attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-slate-700">الملفات المرفقة الداعمة:</span>
              <div className="grid grid-cols-2 gap-2">
                {report.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 bg-white/40 hover:bg-white/60 text-xs text-indigo-700 truncate font-sans flex items-center gap-1.5"
                  >
                    <span>{file.type === "image" ? "🖼️" : "📄"}</span>
                    <span className="truncate hover:underline">{file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Show Member's explanation on previous rejection if available */}
          {report.rejectionExplanation && (
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-xs flex flex-col gap-1.5">
              <span className="font-bold text-red-800 flex items-center gap-1">
                توضيح الموظف حول التعديل المطلوبة:
              </span>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{report.rejectionExplanation}</p>
              {report.rejectionAttachments && report.rejectionAttachments.length > 0 && (
                <div className="mt-2 text-indigo-850">
                  <span className="text-[10px] font-semibold block mb-1">ملفات توضيحية من الموظف:</span>
                  <div className="flex gap-2">
                    {report.rejectionAttachments.map((f, i) => (
                      <a 
                        key={i} 
                        href={f.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="p-1 px-2 text-[10px] bg-white border border-red-100 rounded-lg flex items-center gap-1"
                      >
                        <span>{f.type === "image" ? "🖼️" : "📄"}</span>
                        <span>{f.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HR Rating and stars */}
          <div className="mt-2 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-bold text-slate-700">تقييم جودة الإنجاز والمخرج (عدد النجوم) *</span>
            <div className="flex gap-1.5 justify-center py-1">
              {[1, 2, 3, 4, 5].map((index) => {
                const isActive = index <= (hoveredStar ?? stars);
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setStars(index)}
                    onMouseEnter={() => setHoveredStar(index)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="p-1 active:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors duration-150 ${
                        isActive ? "text-amber-400 fill-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-center text-[10px] text-slate-400">
              {stars === 5 ? "جودة استثنائية (5/5)" : stars === 4 ? "جودة متميزة (4/5)" : stars === 3 ? "جودة متوسطة مقبولة (3/5)" : "بحاجة إلى تطوير وتعديلات ملموسة"}
            </div>
          </div>

          {/* feedback input */}
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-800">
            <span>التعديلات المطلوبة أو تعليق التقييم النهائي</span>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="اكتب هنا توجيهاتك للموظف، تعديلات الهيئة الإبداعية، أو ثنائك على مخرجه الفني..."
              className="p-3 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs focus:ring-0 outline-none leading-relaxed resize-none"
            />
          </label>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/40">
            <button
              onClick={handleSubmitApprove}
              id="review-approve-btn"
              className="flex-1 py-2.5 rounded-xl border border-emerald-600 bg-emerald-600 hover:bg-emerald-700 transition text-white text-xs font-bold shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>موافقة واعتماد النقاط</span>
            </button>
            <button
              onClick={handleSubmitReject}
              id="review-reject-btn"
              className="flex-1 py-2.5 rounded-xl border border-rose-600 bg-white hover:bg-rose-50 text-rose-600 transition text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>طلب تعديل ورفض مؤقت</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
