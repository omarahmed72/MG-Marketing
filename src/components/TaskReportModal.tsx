import React, { useState } from "react";
import { X, UploadCloud, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Task, TaskAttachment } from "../types";

interface TaskReportModalProps {
  task: Task;
  onClose: () => void;
  onSubmitReport: (taskId: string, summary: string, attachments: TaskAttachment[]) => void;
}

export default function TaskReportModal({ task, onClose, onSubmitReport }: TaskReportModalProps) {
  const [summary, setSummary] = useState("");
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [fileInputName, setFileInputName] = useState("");
  const [fileInputUrl, setFileInputUrl] = useState("");
  const [fileType, setFileType] = useState<"image" | "file">("image");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleAddAttachment = () => {
    if (!fileInputName.trim()) return;
    
    // Default url if empty
    const finalUrl = fileInputUrl.trim() || `https://example.com/uploads/${encodeURIComponent(fileInputName)}`;
    
    setAttachments([
      ...attachments,
      {
        name: fileInputName.trim(),
        url: finalUrl,
        type: fileType
      }
    ]);
    
    // Reset individual inputs
    setFileInputName("");
    setFileInputUrl("");
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments(attachments.filter((_, i) => i !== idx));
  };

  // Drag and Drop simulation
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isImg = file.type.startsWith("image/");
      
      setAttachments([
        ...attachments,
        {
          name: file.name,
          url: URL.createObjectURL(file), // Local blob simulation for quick interaction
          type: isImg ? "image" : "file"
        }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    onSubmitReport(task.id, summary, attachments);
  };

  return (
    <div id={`report-modal-overlay-${task.id}`} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div 
        id={`report-modal-${task.id}`} 
        className="w-full max-w-lg bg-white/80 border border-white/50 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-2xl animate-[enter_0.25s_ease]"
      >
        <div className="flex items-center justify-between p-5 border-b border-white/40">
          <div>
            <span className="text-[10px] font-bold tracking-wide text-indigo-700 uppercase font-sans">
              إرسال تقرير إنجاز
            </span>
            <h2 className="text-lg font-bold text-slate-800 font-sans mt-0.5">
              مهمة: {task.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            id={`report-modal-close-${task.id}`}
            className="p-1.5 rounded-xl border border-slate-200 bg-white/60 text-slate-600 hover:text-slate-800 active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-800">
            <span>ملخص التنفيذ والتقرير التفصيلي *</span>
            <textarea
              required
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="اكتب هنا ملخص الإنجاز، الخطوات التي تمت، والنتائج المستهدفة..."
              className="p-3 bg-white/50 border border-slate-200 rounded-xl focus:border-indigo-500 text-xs focus:ring-0 outline-none leading-relaxed resize-none"
            />
          </label>

          {/* Drag & Drop attachment container */}
          <div className="flex flex-col gap-1.5 text-xs font-semibold text-slate-800">
            <span>إرفاق صور أو ملفات تدعم الإيضاح</span>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                isDragOver ? "border-indigo-500 bg-indigo-500/5" : "border-slate-300 bg-white/30"
              }`}
            >
              <UploadCloud className={`w-8 h-8 ${isDragOver ? "text-indigo-600" : "text-slate-400"}`} />
              <div className="text-center">
                <span className="text-[11px] block font-medium text-slate-700">اسحب الملفات هنا أو أفلتها للتحميل المباشر</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">يدعم الصور والمستندات التوضيحية</span>
              </div>
            </div>
          </div>

          {/* Individual manual input attachment */}
          <div className="p-3.5 rounded-2xl border border-white/60 bg-white/30 flex flex-col gap-2.5">
            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" />
              أو أضف ملف توضيحي يدويًا:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileInputName}
                onChange={(e) => setFileInputName(e.target.value)}
                placeholder="اسم الملف (مثال: تصميمات السوشيال)"
                className="flex-1 p-2 bg-white/60 border border-slate-200 rounded-lg text-xs outline-none"
              />
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as "image" | "file")}
                className="p-2 bg-white/60 border border-slate-200 rounded-lg text-xs outline-none w-24"
              >
                <option value="image">صورة 🖼️</option>
                <option value="file">ملف 📄</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileInputUrl}
                onChange={(e) => setFileInputUrl(e.target.value)}
                placeholder="رابط الملف/الصورة (اختياري)"
                className="flex-1 p-2 bg-white/60 border border-slate-200 rounded-lg text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-3 bg-slate-800 hover:bg-slate-900 transition text-white text-xs font-bold rounded-lg active:scale-95 shrink-0"
              >
                إضافة
              </button>
            </div>
          </div>

          {/* Render Active Attachments List */}
          {attachments.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-500">الملفات المرفقة الحالية ({attachments.length}):</span>
              <div className="flex flex-col gap-1.5">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                    <span className="flex items-center gap-1.5 truncate text-slate-700">
                      <span>{file.type === "image" ? "🖼️" : "📄"}</span>
                      <span className="font-medium truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-red-500 hover:text-red-700 font-bold px-1"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <button
              type="submit"
              id="report-submit-btn"
              className="flex-1 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 transition text-white text-xs font-bold shadow-md shadow-indigo-600/15"
            >
              تقديم التقرير للأدمن
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition text-slate-700 text-xs font-bold"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
