import { useAuth } from "../contexts/AuthContext";
import { Clock } from "lucide-react";

export default function PendingApproval() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-[32px] p-8 text-center relative overflow-hidden flex flex-col gap-6 items-center">
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl"></div>

        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 animate-pulse relative z-10 shadow-lg">
          <Clock className="w-8 h-8" />
        </div>

        <div className="flex flex-col gap-2 relative z-10">
          <h1 className="text-2xl font-black tracking-tight text-white mb-1">
            سجلت دخولك بنجاح! طلب الانضمام قيد المراجعة ⏳
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md">
            مرحباً بك يا{" "}
            <span className="font-extrabold text-indigo-400">{user?.name}</span>
            {" "}في مؤسسة محيي الدين للتسويق. لقد تم تسجيل حسابك الفعلي بنجاح ببريدك الإلكتروني، ونحن في انتظار تفعيل حسابك وتنسيب تخصصك من قبل المدير.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 w-full text-right flex flex-col gap-2.5 text-xs relative z-10">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">البريد الإلكتروني:</span>
            <span className="font-semibold text-slate-200">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">حالة الحساب بمجموعة العمل:</span>
            <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">معلق وبانتظار تفعيل المسؤول</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed relative z-10">
          بمجرد قيام المدير (محيي الدين) بتنشيط طلبك وتحديد صلاحيات التخصص لك في صفحته بمساحة الإدارة، سيتم فتح كافة أقسام النظام تلقائياً لك للبدء بالعمل واستقبال المهام.
        </p>

        <button onClick={logout} className="w-full py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs transition active:scale-95 duration-200">
          تسجيل الخروج والعودة
        </button>
      </div>
    </div>
  );
}
