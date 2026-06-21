import React, { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useCampaigns } from "../hooks/useCampaigns";
import { useTasks } from "../hooks/useTasks";

export default function CampaignsPage() {
  const { user } = useAuth();
  const { campaigns, createCampaign } = useCampaigns();
  const { tasks } = useTasks();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("السوشيال ميديا");
  const [budget, setBudget] = useState(50000);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await createCampaign({ name: name.trim(), channel, budget: Number(budget), spent: 0, progress: 0, leads: 0 });
    setIsModalOpen(false);
    setName("");
  };

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600">الميزانيات التسويقية والتقدم</span>
          <h1 className="text-2xl font-black text-slate-800 mt-1">حملات التسويق والماركتينج المفعّلة</h1>
        </div>
        {user?.role === "admin" && (
          <button onClick={() => setIsModalOpen(true)} className="px-4.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/10">
            <Plus className="w-4 h-4" />
            <span>إنشاء حملة تسويقية جديدة</span>
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 text-right">
        {campaigns.map((camp) => (
          <div key={camp.id} className="p-5 glass-panel rounded-3xl flex flex-col gap-3.5 relative overflow-hidden">
            <div className="w-1.5 h-12 bg-indigo-600 rounded-full absolute left-0 top-6" />
            <div className="flex justify-between items-start">
              <div>
                <strong className="text-sm font-bold text-slate-800">{camp.name}</strong>
                <span className="text-[10px] text-slate-400 block mt-1">القناة: {camp.channel}</span>
              </div>
              <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">نشطة</span>
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-mono text-[10px]">{camp.progress}%</span>
                <span className="text-slate-500">معدل التقدم الإجمالي</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${camp.progress}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2.5 border-t border-slate-200/50 pt-3.5 text-xs">
              <div>
                <span className="text-slate-400 block">الميزانية</span>
                <strong className="font-bold text-slate-700 block mt-0.5 font-sans text-[11px]">{camp.budget.toLocaleString("ar-EG")} ج.م</strong>
              </div>
              <div>
                <span className="text-slate-400 block">المصروف</span>
                <strong className="font-bold text-slate-700 block mt-0.5 font-sans text-[11px]">{camp.spent?.toLocaleString("ar-EG") || 0} ج.م</strong>
              </div>
              <div>
                <span className="text-slate-400 block">المهام المنسوبة</span>
                <strong className="font-bold text-slate-600 block mt-0.5 font-sans text-[11px]">{tasks.filter((t) => t.campaignId === camp.id).length} مهام</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/80 border border-white/50 shadow-2xl rounded-[28px] overflow-hidden backdrop-blur-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/40">
              <h2 className="text-sm font-bold text-slate-800">إنشاء حملة تسويقية</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"><Plus className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 flex flex-col gap-4 text-right">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                <span>اسم الحملة *</span>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: إطلاق الخريف" className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>القناة التسويقية</span>
                  <select value={channel} onChange={(e) => setChannel(e.target.value)} className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs">
                    <option>السوشيال ميديا</option>
                    <option>البريد الإلكتروني</option>
                    <option>إعلانات مدفوعة</option>
                    <option>المحتوى والتسويق</option>
                    <option>العلاقات العامة</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>الميزانية (ج.م)</span>
                  <input required type="number" min={0} value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs" />
                </label>
              </div>
              <div className="flex gap-2.5 mt-2">
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs">إنشاء الحملة</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
