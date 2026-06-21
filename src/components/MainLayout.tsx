import { useState, useMemo } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  Users, CheckSquare, TrendingUp, Briefcase, Settings,
  Bell, Search, LogOut, Activity, Menu, X, Star,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNotifications } from "../hooks/useNotifications";
import logoImg from "../../assets/logo.png";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  const currentTab = location.pathname.replace("/", "") || "dashboard";

  const navItems = [
    ...(user?.role === "admin" ? [{ id: "dashboard", label: "لوحة المتابعة العامة", icon: Activity }] : []),
    { id: "tasks", label: "المهام", icon: CheckSquare },
    ...(user?.role === "admin" ? [
      { id: "team", label: "أعضاء الفريق", icon: Users },
      { id: "campaigns", label: "الحملات الإعلانية", icon: TrendingUp },
      { id: "reports", label: "تقارير التسليمات", icon: Briefcase },
    ] : []),
    { id: "settings", label: "الاعدادات", icon: Settings },
  ];

  const pendingMembersList = useMemo(() => {
    return []; // Will be populated from useUsers hook when that page mounts
  }, []);

  const activeReportsCount = useMemo(() => {
    return notifications.filter((n) => n.type === "review" && !n.read).length;
  }, [notifications]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 right-0 h-screen w-90 bg-slate-900 text-slate-200 z-40 transition-transform duration-300 transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} flex flex-col justify-between p-6 shadow-2xl`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-13 h-9 rounded-xl text-white font-bold flex items-center justify-center text-lg">
                <img src={logoImg} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <strong className="text-xl font-bold tracking-tight text-slate-500 font-sans text-right">محــي الديــن</strong>
                <span className="text-[14px] text-slate-600">Marketing CRM</span>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 text-right">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate(`/${item.id === "dashboard" ? "" : item.id}`); setSidebarOpen(false); }}
                className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xl font-semibold ${currentTab === item.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
              >
                <item.icon className="w-4 h-4 ml-1" />
                <span>{item.label}</span>
                {item.id === "reports" && activeReportsCount > 0 && (
                  <span className="mr-auto bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{activeReportsCount} مراجعة</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-3 text-right">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-sm uppercase">
                {user?.name?.[0]}
              </div>
            )}
            <div className="flex flex-col max-w-[140px] truncate">
              <span className="text-lg font-bold text-white truncate text-slate-400">{user?.name}</span>
              <span className="text-[15px] text-slate-500 truncate capitalize">
                {user?.role === "admin" ? "مدير التسويق (أدمن)" : user?.specialty}
              </span>
            </div>
          </div>
          <button onClick={logout} className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-red-800 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition">
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 min-w-0 p-4 md:p-8 flex flex-col gap-6">
        {/* TOP BAR */}
        <header className="flex items-center justify-between gap-4 border-b border-white/40 pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-xl border border-white/50 bg-white/40">
              <Menu className="w-5 h-5 text-slate-800" />
            </button>
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-400 font-semibold font-sans">
                {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
              <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-0.5">أهلاً وسهلاً بك، {user?.name?.split(" ")[0]}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative hidden lg:block">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في لوحة العمل..."
                className="w-56 p-2 pr-9 pl-3 text-xs bg-white/60 text-slate-800 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition" />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            <div className="relative">
              <button onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2.5 rounded-xl border border-white/60 bg-white/50 hover:bg-white/80 transition relative">
                <Bell className="w-4.5 h-4.5 text-slate-700" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-white/95 border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden backdrop-blur-xl">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                    <span className="text-xs font-bold text-slate-800">التحديثات والإشعارات ({unreadCount})</span>
                    <button onClick={markAllAsRead} className="text-[9px] font-bold text-indigo-850 hover:underline">تحديد الكل كمقروء</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[11px] text-slate-400 italic">لا توجد تنبيهات جديدة في الوقت الحالي.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-3 border-b border-slate-100 text-right text-xs transition duration-150 hover:bg-slate-50 ${!n.read ? "bg-indigo-50/20 font-medium" : ""}`}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-indigo-600 font-bold block">{n.title}</span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="text-slate-600 text-[11px] mt-1 text-right leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <Outlet context={{ searchQuery }} />
      </main>
    </div>
  );
}
