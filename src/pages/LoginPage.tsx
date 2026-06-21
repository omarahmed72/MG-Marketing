import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import logoImg from "../../assets/logo.png";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const demoLogin = async (role: "admin" | "member") => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:4000/api"}/auth/demo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("crm_token", data.token);
        localStorage.setItem("crm_user", JSON.stringify(data.user));
        window.location.href = data.user.role === "admin" ? "/" : "/tasks";
      } else {
        setError("تعذر الاتصال بالخادم. تأكد من تشغيل الخادم (server) على port 4000.");
      }
    } catch {
      setError("تعذر الاتصال بالخادم. تأكد من تشغيل الخادم (server) على port 4000.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid md:grid-cols-2 gap-8 glass-panel rounded-[32px] p-8 md:p-12 relative overflow-hidden">
        <div className="flex flex-col justify-between gap-12 text-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 flex items-center justify-center text-xl">
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bold tracking-tight text-slate-800 font-sans text-sm">مؤسسة محي الدين للتسويق</span>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-xs font-bold text-slate-600 tracking-wider">مساحة فريق التسويق الرقمي</span>
            <h1 className="text-3xl md:text-5xl font-black leading-[1.25] tracking-tight text-slate-500">
              كل شغلك الإبداعي.<br />
              <span className="text-slate-500">في مكان واحد.</span>
            </h1>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
              نظّم فريق الماركتينج، وزّع المهام الإبداعية بقياس النقاط المتراكمة وأوزان المهام، مع التوقيت التلقائي المنبه ومتابعة الأداء لحظيًا.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/40 border border-white/60">صلاحيات مرنة</span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/40 border border-white/60">تنبيهات فورية للمؤقت</span>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/40 border border-white/60">تقارير أداء PDF معتمدة</span>
          </div>
        </div>

        <div className="flex flex-col justify-center items-stretch gap-6 border border-white/80 rounded-[24px] p-6 md:p-8 backdrop-blur-md relative z-10 shadow-xl">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-slate-800">ابدأ مساحتك المهنية الملتزمة</h2>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 text-center">{error}</div>
          )}

          <div className="text-center p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl text-indigo-900 text-xs text-right leading-relaxed flex flex-col gap-2">
            <span className="text-[10px] text-amber-700 font-semibold block">⚠️ الوضع التجريبي: بيانات محلية من قاعدة البيانات</span>
            <div className="flex gap-2.5 mt-1.5">
              <button
                onClick={() => demoLogin("admin")}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                إدارة المساحة (أدمن)
              </button>
              <button
                onClick={() => demoLogin("member")}
                disabled={loading}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-900 transition disabled:opacity-50"
              >
                مساحة موظف (عضو)
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed text-center">
            * ملاحظة: المدير فقط يملك صلاحية تنشيط وقبول وتنسيب الأعضاء وتعيين أوزان نقاطهم.
          </p>
        </div>
      </div>
    </div>
  );
}
