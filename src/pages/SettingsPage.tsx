import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Smartphone, ChevronDown } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-enter">
      <div>
        <span className="text-xs font-bold text-slate-600">الملف الفني ومصادر السحابة</span>
        <h1 className="text-2xl font-black text-slate-800 mt-1">الإعدادات</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-2 text-right">
        <div className="lg:col-span-2 p-5 glass-panel rounded-3xl flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800">ملف مساحة الحساب الفني الحالي</h3>
          <div className="flex items-center gap-4 py-2 border-b border-slate-200/50 pb-4">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-14 h-14 rounded-full border-2 border-white object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-lg">{user?.name?.[0]}</div>
            )}
            <div className="flex flex-col">
              <strong className="text-base font-bold text-slate-800">{user?.name}</strong>
              <span className="text-xs text-slate-500 mt-1">{user?.email}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 py-1 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-white/40">
              <span className="text-slate-400">الدور الإشرافي الحالي</span>
              <strong className="text-slate-700 capitalize">{user?.role === "admin" ? "مدير المساحة الفعّال (أدمن)" : "موظف ممارس"}</strong>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-white/40">
              <span className="text-slate-400">القسم الوظيفي الملحق</span>
              <strong className="text-slate-700 font-bold">{user?.specialty}</strong>
            </div>
          </div>
        </div>

        <div className="p-5 glass-panel rounded-3xl flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800">بيئة تشغيل قاعدة البيانات</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            هذا النظام يعمل باستخدام MongoDB + Express + Node.js. البيانات محفوظة في قاعدة بيانات MongoDB وتتزامن عبر الأجهزة عبر REST API مع Socket.IO للتنبيهات الفورية.
          </p>
          <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-indigo-800">✓</span> متصل بـ MERN Stack — تزامن عبر الأجهزة
          </div>
        </div>
      </div>

      {/* Guide Accordion */}
      <div className="p-5 glass-panel rounded-3xl flex flex-col gap-3 text-right">
        <button onClick={() => setIsGuideOpen(!isGuideOpen)} className="w-full flex items-center justify-between text-right outline-none focus:ring-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-600 shrink-0" />
            <h3 className="text-sm font-bold text-slate-800">حول نظام MERN Stack 🛠️</h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isGuideOpen ? "transform rotate-180" : ""}`} />
        </button>

        {isGuideOpen && (
          <div className="mt-4 border-t border-slate-200/50 pt-4 flex flex-col gap-4 text-xs text-slate-700 leading-relaxed leading-[1.8] animate-enter">
            <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-2xl">
              <strong className="text-slate-600 block mb-1">بنية النظام:</strong>
              مساحة العمل تستخدم MERN Stack:
              <ul className="list-disc mr-4 mt-2 space-y-1">
                <li><strong>MongoDB</strong> — قاعدة البيانات الأساسية لتخزين المستخدمين، المهام، الحملات، التقارير</li>
                <li><strong>Express.js</strong> — خادم API الوسيط للتواصل بين الواجهة وقاعدة البيانات</li>
                <li><strong>React</strong> — واجهة المستخدم التفاعلية (الواجهة الأمامية)</li>
                <li><strong>Node.js</strong> — بيئة تشغيل الخادم</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3.5">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <strong className="text-slate-800 font-bold block mb-0.5">تشغيل الخادم المحلي:</strong>
                  قم بتشغيل <code className="font-mono bg-slate-100 p-0.5 text-xs text-red-650 rounded">cd server && npm install && npm run dev</code> لبدء خادم Express على port 4000.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <strong className="text-slate-800 font-bold block mb-0.5">تشغيل قاعدة البيانات:</strong>
                  تحتاج إلى تشغيل MongoDB محليًا أو عبر <code className="font-mono bg-slate-100 p-0.5 text-xs text-red-650 rounded">docker-compose up mongodb</code>.
                </div>
              </div>
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <strong className="text-slate-800 font-bold block mb-0.5">بذر البيانات الأولية:</strong>
                  قم بتشغيل <code className="font-mono bg-slate-100 p-0.5 text-xs text-red-650 rounded">cd server && npm run seed</code> لملء قاعدة البيانات بالبيانات التجريبية (المستخدمين، المهام، الحملات).
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
