import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, 
  CheckSquare, 
  TrendingUp, 
  Briefcase, 
  Settings, 
  Bell, 
  Search, 
  LogOut, 
  Plus, 
  Activity, 
  Award, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star, 
  FileDown, 
  Menu, 
  X,
  FileText,
  MessageSquare,
  Smartphone,
  ChevronDown
} from "lucide-react";

import { 
  UserProfile, 
  Task, 
  Campaign, 
  Specialty, 
  TaskReport, 
  CRMNotification,
  TaskStatus,
  TaskAttachment
} from "./types";

import { 
  auth, 
  db, 
  googleProvider, 
  OperationType, 
  handleFirestoreError 
} from "./firebase";

import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where,
  deleteDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";

import TaskTimer from "./components/TaskTimer";
import TaskReportModal from "./components/TaskReportModal";
import AdminReportReviewModal from "./components/AdminReportReviewModal";
import { calculateEmployeeStats, printPerformancePdf } from "./utils/reports";

// Seed/Mock Data for initial Local Storage demo state
const SEED_SPECIALTIES: Specialty[] = [
  { id: "sp-1", name: "صناعة المحتوى", description: "تخطيط وكتابة المحتوى عبر القنوات المختلفة" },
  { id: "sp-2", name: "التصميم الإبداعي", description: "الهوية البصرية وتصميم مواد الحملات" },
  { id: "sp-3", name: "الإعلانات المدفوعة", description: "إدارة وتحسين الحملات الإعلانية الرقمية" },
  { id: "sp-4", name: "تحليل البيانات", description: "قياس الأداء وتحويل الأرقام إلى قرارات" },
  { id: "sp-5", name: "السوشيال ميديا", description: "إدارة المجتمع والنشر على المنصات" }
];

const SEED_CAMPAIGNS: Campaign[] = [
  { id: "c-1", name: "إطلاق الصيف", channel: "السوشيال ميديا", budget: 85000, spent: 62000, progress: 73, leads: 1240 },
  { id: "c-2", name: "عودة العملاء", channel: "البريد الإلكتروني", budget: 28000, spent: 12500, progress: 46, leads: 680 },
  { id: "c-3", name: "وعي العلامة", channel: "إعلانات مدفوعة", budget: 120000, spent: 91000, progress: 78, leads: 2100 }
];

const SEED_USERS: UserProfile[] = [
  { id: "admin-1", name: "أ. محمد محي الدين", email: "admin@moheyeldin.marketing", role: "admin", status: "active", specialty: "إدارة التسويق", workload: 68, createdAt: new Date().toISOString() },
  { id: "m-1", name: "سارة خالد", email: "sara@moheyeldin.marketing", role: "member", status: "active", specialty: "صناعة المحتوى", workload: 40, createdAt: new Date().toISOString(), overallRating: 5 },
  { id: "m-2", name: "عمر محمود", email: "omar@moheyeldin.marketing", role: "member", status: "active", specialty: "الإعلانات المدفوعة", workload: 80, createdAt: new Date().toISOString(), overallRating: 4 },
  { id: "m-3", name: "ليلى سامي", email: "laila@moheyeldin.marketing", role: "member", status: "active", specialty: "التصميم الإبداعي", workload: 50, createdAt: new Date().toISOString(), overallRating: 5 },
  { id: "m-4", name: "يوسف علي", email: "youssef@moheyeldin.marketing", role: "member", status: "active", specialty: "تحليل البيانات", workload: 20, createdAt: new Date().toISOString(), overallRating: 3 },
  { id: "p-1", name: "منى عادل", email: "mona@gmail.com", role: "member", status: "pending", specialty: "صناعة المحتوى", workload: 0, createdAt: new Date().toISOString() }
];

const SEED_TASKS: Task[] = [
  { id: "t-1", title: "كتابة محتوى صفحة الهبوط الإبداعية", assigneeId: "m-1", campaignId: "c-1", priority: "high", status: "todo", dueDate: "2026-06-25", createdAt: new Date().toISOString(), timerDuration: 3600, timerRemaining: 3600, timerIsRunning: false, weight: 10 },
  { id: "t-2", title: "تصميم وإخراج منشورات إطلاق الصيف", assigneeId: "m-3", campaignId: "c-1", priority: "high", status: "progress", dueDate: "2026-06-28", createdAt: new Date().toISOString(), timerDuration: 7200, timerRemaining: 7200, timerIsRunning: false, weight: 20 },
  { id: "t-3", title: "مراجعة وتحسين أداء إعلانات Meta", assigneeId: "m-2", campaignId: "c-3", priority: "medium", status: "progress", dueDate: "2026-06-29", createdAt: new Date().toISOString(), timerDuration: 1800, timerRemaining: 1200, timerIsRunning: false, weight: 15 },
  { id: "t-4", title: "تجهيز التقرير الإحصائي الأسبوعي للتحويلات", assigneeId: "m-4", campaignId: "c-3", priority: "medium", status: "done", dueDate: "2026-06-10", createdAt: new Date().toISOString(), timerDuration: 5400, timerRemaining: 0, timerIsRunning: false, weight: 10, starsRating: 5, evaluatedAt: new Date().toISOString() }
];

const SEED_REPORTS: TaskReport[] = [
  {
    id: "rep-1",
    taskId: "t-4",
    taskTitle: "تجهيز التقرير الإحصائي الأسبوعي للتحويلات",
    memberId: "m-4",
    memberName: "يوسف علي",
    summary: "تم تجميع تقارير الحملات الإعلانية النشطة على غوغل وباد وفيسبوك للتأكد من وصول معدل تكلفة العميل لأقل حد وتصدير مخرجات الأسبوع كتقرير منظم للإدارة.",
    attachments: [{ name: "analytics-excel.xlsx", url: "https://example.com/analytics-excel.xlsx", type: "file" }],
    createdAt: new Date().toISOString(),
    status: "approved",
    adminFeedback: "مجهود رائع وتسليم دقيق في الموعد المحدد ومرفق ممتاز.",
    starsAwarded: 5,
    reviewedAt: new Date().toISOString()
  }
];

export default function App() {
  // App authentication & system states
  const [useFirebase, setUseFirebase] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [teamSpecialtyFilter, setTeamSpecialtyFilter] = useState<string>("الكل");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Workspace primary collections
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<TaskReport[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // Modal control states
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  
  const [selectedTaskForReport, setSelectedTaskForReport] = useState<Task | null>(null);
  const [selectedReportForReview, setSelectedReportForReview] = useState<TaskReport | null>(null);
  const [selectedTaskForRejectionExplanation, setSelectedTaskForRejectionExplanation] = useState<Task | null>(null);

  // New item form states (Tasks / Campaigns / Specialties)
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [newTaskCampaign, setNewTaskCampaign] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskWeight, setNewTaskWeight] = useState<number>(10);
  const [newTaskHours, setNewTaskHours] = useState<number>(1);
  const [newTaskMinutes, setNewTaskMinutes] = useState<number>(0);

  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignChannel, setNewCampaignChannel] = useState("السوشيال ميديا");
  const [newCampaignBudget, setNewCampaignBudget] = useState<number>(50000);

  const [newSpecialtyName, setNewSpecialtyName] = useState("");
  const [newSpecialtyDesc, setNewSpecialtyDesc] = useState("");

  const [rejectionExpText, setRejectionExpText] = useState("");

  // Firebase Setup Guide Accordion State
  const [isFirebaseGuideOpen, setIsFirebaseGuideOpen] = useState(false);

  // Pre-load logic from localStorage if exists, else seed
  useEffect(() => {
    const savedUseFirebase = localStorage.getItem("workspace_prefer_firebase");
    if (savedUseFirebase !== null) {
      setUseFirebase(savedUseFirebase === "true");
    }

    if (!localStorage.getItem("workspace_seeded")) {
      localStorage.setItem("workspace_users", JSON.stringify(SEED_USERS));
      localStorage.setItem("workspace_tasks", JSON.stringify(SEED_TASKS));
      localStorage.setItem("workspace_reports", JSON.stringify(SEED_REPORTS));
      localStorage.setItem("workspace_campaigns", JSON.stringify(SEED_CAMPAIGNS));
      localStorage.setItem("workspace_specialties", JSON.stringify(SEED_SPECIALTIES));
      localStorage.setItem("workspace_notifications", JSON.stringify([]));
      localStorage.setItem("workspace_seeded", "true");
    }

    // Hydrate default states
    setUsers(JSON.parse(localStorage.getItem("workspace_users") || "[]"));
    setTasks(JSON.parse(localStorage.getItem("workspace_tasks") || "[]"));
    setReports(JSON.parse(localStorage.getItem("workspace_reports") || "[]"));
    setCampaigns(JSON.parse(localStorage.getItem("workspace_campaigns") || "[]"));
    setSpecialties(JSON.parse(localStorage.getItem("workspace_specialties") || "[]"));
    setNotifications(JSON.parse(localStorage.getItem("workspace_notifications") || "[]"));
  }, []);

  // Save changes locally whenever local collections alter
  const saveCollectionsLocally = (
    updatedUsers?: UserProfile[],
    updatedTasks?: Task[],
    updatedReports?: TaskReport[],
    updatedCampaigns?: Campaign[],
    updatedSpecialties?: Specialty[],
    updatedNotifications?: CRMNotification[]
  ) => {
    if (updatedUsers) {
      localStorage.setItem("workspace_users", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
    if (updatedTasks) {
      localStorage.setItem("workspace_tasks", JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    }
    if (updatedReports) {
      localStorage.setItem("workspace_reports", JSON.stringify(updatedReports));
      setReports(updatedReports);
    }
    if (updatedCampaigns) {
      localStorage.setItem("workspace_campaigns", JSON.stringify(updatedCampaigns));
      setCampaigns(updatedCampaigns);
    }
    if (updatedSpecialties) {
      localStorage.setItem("workspace_specialties", JSON.stringify(updatedSpecialties));
      setSpecialties(updatedSpecialties);
    }
    if (updatedNotifications) {
      localStorage.setItem("workspace_notifications", JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }
  };

  // Google Firebase Auth listeners
  useEffect(() => {
    if (!useFirebase) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Prepare profile
        const isDeveloperEmail = firebaseUser.email === "mostafakassab572@gmail.com" || firebaseUser.email?.includes("admin");
        const uid = firebaseUser.uid;
        
        // Lookup or sync Firestore profile
        try {
          const userRef = doc(db, "users", uid);
          const defaultProfile: UserProfile = {
            id: uid,
            name: firebaseUser.displayName || "عضو مساحة جديد",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || undefined,
            role: isDeveloperEmail ? "admin" : "member",
            status: isDeveloperEmail ? "active" : "pending",
            specialty: isDeveloperEmail ? "إدارة التسويق" : "غير محدد",
            createdAt: new Date().toISOString(),
          };

          // On login, attempt to write to Firestore, if blocked we fallback smoothly
          await setDoc(userRef, defaultProfile, { merge: true });
          
          setCurrentUser(defaultProfile);
          showToast(`سجلت دخولك بنجاح كـ ${defaultProfile.name}`);
        } catch (error: any) {
          console.warn("Firestore user record blocked/restricted (Connecting localized simulated profiles):", error.message);
          // Fallback user matching developer parameters
          const localMatch = users.find(u => u.email === firebaseUser.email) || {
            id: uid,
            name: firebaseUser.displayName || "مستخدم تجريبي",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || undefined,
            role: isDeveloperEmail ? "admin" : "member",
            status: "active",
            specialty: "التصميم الإبداعي",
            createdAt: new Date().toISOString()
          };
          setCurrentUser(localMatch);
        }
      } else {
        setCurrentUser(null);
      }
    }, (error) => {
      console.error("Auth error:", error);
    });

    return () => unsubscribe();
  }, [useFirebase, users]);

  // Real-time listener for Firestore Collections (syncing reports, tasks on-the-fly)
  useEffect(() => {
    if (!useFirebase || !currentUser || currentUser.status !== "active") return;

    // Direct Tasks real-time Sync
    const tasksQuery = currentUser.role === "admin" 
      ? collection(db, "tasks") 
      : query(collection(db, "tasks"), where("assigneeId", "==", currentUser.id));

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((doc) => {
        fetchedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });
      if (fetchedTasks.length > 0) {
        setTasks(fetchedTasks);
        localStorage.setItem("workspace_tasks", JSON.stringify(fetchedTasks));
      }
    }, (error) => {
      console.warn("Offline or insufficient rules for real-time task loading, falling back to cached state.");
      handleFirestoreError(error, OperationType.LIST, "tasks");
    });

    // Reports Sync
    const reportsQuery = currentUser.role === "admin"
      ? collection(db, "reports")
      : query(collection(db, "reports"), where("memberId", "==", currentUser.id));

    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const fetchedReports: TaskReport[] = [];
      snapshot.forEach((doc) => {
        fetchedReports.push({ id: doc.id, ...doc.data() } as TaskReport);
      });
      if (fetchedReports.length > 0) {
        setReports(fetchedReports);
        localStorage.setItem("workspace_reports", JSON.stringify(fetchedReports));
      }
    }, (error) => {
      console.warn("Reports subscription warning:", error.message);
      handleFirestoreError(error, OperationType.LIST, "reports");
    });

    // Users Sync (Only admin listens/updates other members, members can look up for listing)
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetchedUsers: UserProfile[] = [];
      snapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      if (fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        localStorage.setItem("workspace_users", JSON.stringify(fetchedUsers));
      }
    }, (error) => {
      console.warn("Firestore users listing warning:", error.message);
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    // Campaigns Sync
    const unsubscribeCampaigns = onSnapshot(collection(db, "campaigns"), (snapshot) => {
      const fetchedCampaigns: Campaign[] = [];
      snapshot.forEach((doc) => {
        fetchedCampaigns.push({ id: doc.id, ...doc.data() } as Campaign);
      });
      if (fetchedCampaigns.length > 0) {
        setCampaigns(fetchedCampaigns);
        localStorage.setItem("workspace_campaigns", JSON.stringify(fetchedCampaigns));
      }
    }, (error) => {
      console.warn("Campaigns subscription warning:", error.message);
      handleFirestoreError(error, OperationType.LIST, "campaigns");
    });

    // Specialties Sync
    const unsubscribeSpecialties = onSnapshot(collection(db, "specialties"), (snapshot) => {
      const fetchedSpecialties: Specialty[] = [];
      snapshot.forEach((doc) => {
        fetchedSpecialties.push({ id: doc.id, ...doc.data() } as Specialty);
      });
      if (fetchedSpecialties.length > 0) {
        setSpecialties(fetchedSpecialties);
        localStorage.setItem("workspace_specialties", JSON.stringify(fetchedSpecialties));
      }
    }, (error) => {
      console.warn("Specialties subscription warning:", error.message);
      handleFirestoreError(error, OperationType.LIST, "specialties");
    });

    return () => {
      unsubscribeTasks();
      unsubscribeReports();
      unsubscribeUsers();
      unsubscribeCampaigns();
      unsubscribeSpecialties();
    };
  }, [useFirebase, currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Login handler
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Authentication popup failed", e);
      showToast("تعذر تسجيل الدخول من خلال Google. سنقوم بالمتابعة في الوضع التجريبي دون اتصال.");
    }
  };

  // Demo direct login credentials
  const loginAsDemoAdmin = () => {
    const adminProfile = users.find(u => u.role === "admin") || SEED_USERS[0];
    setCurrentUser(adminProfile);
    showToast(`مرحبًا بك في لوحة تحكم الإدارة: ${adminProfile.name}`);
  };

  const loginAsDemoMember = () => {
    const memberProfile = users.find(u => u.role === "member" && u.status === "active") || SEED_USERS[1];
    setCurrentUser(memberProfile);
    showToast(`مرحبًا بك في مساحة عمل الموظف: ${memberProfile.name}`);
  };

  const handleLogout = async () => {
    if (useFirebase) {
      await signOut(auth);
    }
    setCurrentUser(null);
    showToast("تم تسجيل الخروج بنجاح.");
  };

  // Unified persistent database write function supporting both firestore write sync and local simulation
  const writeDocCollection = async <T extends { id: string }>(
    colName: string, 
    docId: string, 
    data: T,
    localStateList: T[],
    updateStateFn: (list: T[]) => void
  ) => {
    const updatedList = [data, ...localStateList.filter(item => item.id !== docId)];
    updateStateFn(updatedList);
    localStorage.setItem(`workspace_${colName}`, JSON.stringify(updatedList));

    if (useFirebase && currentUser) {
      try {
        await setDoc(doc(db, colName, docId), data, { merge: true });
      } catch (e) {
        console.warn(`Firestore collection write '${colName}' blocked securely (Preserved locally):`, e);
        handleFirestoreError(e, OperationType.WRITE, `${colName}/${docId}`);
      }
    }
  };

  // Push notifications
  const pushNotification = async (recipientId: string, title: string, message: string, type: "tasks" | "team" | "review" | "rating") => {
    const newNotif: CRMNotification = {
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      recipientId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString()
    };
    await writeDocCollection("notifications", newNotif.id, newNotif, notifications, setNotifications);
  };

  // --- Task Operations ---
  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskAssignee || !newTaskDueDate) return;

    const allottedSeconds = (newTaskHours * 3600) + (newTaskMinutes * 60);

    const createdTask: Task = {
      id: "task-" + Math.random().toString(36).substr(2, 9),
      title: newTaskTitle.trim(),
      assigneeId: newTaskAssignee,
      campaignId: newTaskCampaign || "c-1",
      priority: newTaskPriority,
      status: "todo",
      dueDate: newTaskDueDate,
      createdAt: new Date().toISOString(),
      timerDuration: allottedSeconds,
      timerRemaining: allottedSeconds,
      timerIsRunning: false,
      weight: Number(newTaskWeight)
    };

    await writeDocCollection("tasks", createdTask.id, createdTask, tasks, setTasks);
    
    // Notify member
    const assigneeName = users.find(u => u.id === newTaskAssignee)?.name || "موظف";
    await pushNotification(
      newTaskAssignee, 
      "مهمة جديدة مسندة إليك", 
      `تم إسناد مهمة '${createdTask.title}' إليك. بمعدل نقاط: ${createdTask.weight} نقطة.`,
      "tasks"
    );

    setIsTaskModalOpen(false);
    setNewTaskTitle("");
    setNewTaskDueDate("");
    setNewTaskWeight(10);
    setNewTaskHours(1);
    setNewTaskMinutes(0);
    showToast("تم جدولة المهمة وإرسالها للموظف بنجاح");
  };

  const syncTimerState = async (taskId: string, remaining: number, isRunning: boolean) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;
    
    // Sync local list inside local storage immediately to avoid HMR restarts losing timer value
    const updatedTasks = tasks.map(t => {
      if (t.id === taskId) {
        return { ...t, timerRemaining: remaining, timerIsRunning: isRunning, timerStartedAt: isRunning ? new Date().toISOString() : undefined };
      }
      return t;
    });
    setTasks(updatedTasks);
    localStorage.setItem("workspace_tasks", JSON.stringify(updatedTasks));

    // Async write to firebase
    if (useFirebase && currentUser) {
      try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
          timerRemaining: remaining,
          timerIsRunning: isRunning,
          timerStartedAt: isRunning ? new Date().toISOString() : null
        });
      } catch (err) {
        // standard fallback
        handleFirestoreError(err, OperationType.UPDATE, `tasks/${taskId}`);
      }
    }
  };

  // Submit complete report
  const handleSubmitTaskReport = async (taskId: string, summary: string, attachments: TaskAttachment[]) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask || !currentUser) return;

    const reportId = "report-" + Math.random().toString(36).substr(2, 9);
    const newReport: TaskReport = {
      id: reportId,
      taskId,
      taskTitle: targetTask.title,
      memberId: currentUser.id,
      memberName: currentUser.name,
      summary,
      attachments,
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    // Update report
    await writeDocCollection("reports", reportId, newReport, reports, setReports);

    // Update task status to "review"
    const updatedTask = { ...targetTask, status: "review" as TaskStatus, timerIsRunning: false };
    await writeDocCollection("tasks", taskId, updatedTask, tasks, setTasks);

    // Send Admin notification
    const siteAdmins = users.filter(u => u.role === "admin");
    for (const adm of siteAdmins) {
      await pushNotification(
        adm.id,
        "تقرير إنجاز جديد في مراجعة العمل",
        `قدّم الموظف ${currentUser.name} تقرير إنجاز عن مهمة: ${targetTask.title}`,
        "review"
      );
    }

    setSelectedTaskForReport(null);
    showToast("تم تسليم التقرير للأدمن ومراجعة نقاط المهمة قيد الفحص الحسابي.");
  };

  // Admin approves task report
  const handleApproveReport = async (reportId: string, feedback: string, stars: number) => {
    const targetReport = reports.find(r => r.id === reportId);
    if (!targetReport) return;

    // Approved report updates
    const approvedReport: TaskReport = {
      ...targetReport,
      status: "approved",
      adminFeedback: feedback,
      starsAwarded: stars,
      reviewedAt: new Date().toISOString()
    };
    await writeDocCollection("reports", reportId, approvedReport, reports, setReports);

    // Update task status to "done"
    const targetTask = tasks.find(t => t.id === targetReport.taskId);
    if (targetTask) {
      const finishedTask: Task = {
        ...targetTask,
        status: "done",
        starsRating: stars,
        evaluatedAt: new Date().toISOString()
      };
      await writeDocCollection("tasks", targetTask.id, finishedTask, tasks, setTasks);
    }

    // Notify employee of approval and score!
    await pushNotification(
      targetReport.memberId,
      "تهانينا! تم اعتماد مهمتك بنجاح",
      `اعتمد الأدمن تقرير مهمتك المكتملة بنجوم قيمتها: ${stars} وبنقاط نقاط إضافية: ${targetTask?.weight} نقطة!`,
      "rating"
    );

    setSelectedReportForReview(null);
    showToast("تم اعتماد وإغلاق التقرير وحساب النقاط الشهيرة للموظف!");
  };

  // Admin rejects report with feedback modifications
  const handleRejectReport = async (reportId: string, feedback: string) => {
    const targetReport = reports.find(r => r.id === reportId);
    if (!targetReport) return;

    // Rejected report updates
    const rejectedReport: TaskReport = {
      ...targetReport,
      status: "rejected",
      adminFeedback: feedback,
      reviewedAt: new Date().toISOString()
    };
    await writeDocCollection("reports", reportId, rejectedReport, reports, setReports);

    // Set task back to "rejected" so member can edit
    const targetTask = tasks.find(t => t.id === targetReport.taskId);
    if (targetTask) {
      const modifiedTask: Task = {
        ...targetTask,
        status: "rejected"
      };
      await writeDocCollection("tasks", targetTask.id, modifiedTask, tasks, setTasks);
    }

    // Send alert to employee
    await pushNotification(
      targetReport.memberId,
      "تنبيه تعديل! تم إرجاع المهمة للتنقيح",
      `علّق الأدمن على تقريرك ملتمسًا التعديل والمراجعة: ${feedback}`,
      "tasks"
    );

    setSelectedReportForReview(null);
    showToast("تم إرسال التوجيهات والتعديلات المطلوبة للموظف بنجاح.");
  };

  // Member comments and uploads more evidence on a rejected task to submit it again
  const handleMemberSubmitRejectionExplanation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForRejectionExplanation || !rejectionExpText.trim() || !currentUser) return;

    // Find the pending or active report associated with this task
    const currentReport = reports.find(r => r.taskId === selectedTaskForRejectionExplanation.id);
    if (!currentReport) return;

    const reSubmittedReport: TaskReport = {
      ...currentReport,
      summary: `${currentReport.summary}\n\n[إيضاح إضافي من الموظف]:\n${rejectionExpText}`,
      status: "pending",
      rejectionExplanation: rejectionExpText,
      rejectionCommentedAt: new Date().toISOString(),
      createdAt: new Date().toISOString() // reset timestamp
    };

    await writeDocCollection("reports", currentReport.id, reSubmittedReport, reports, setReports);

    // Update task back to "review" status
    const updatedTask: Task = {
      ...selectedTaskForRejectionExplanation,
      status: "review",
      timerIsRunning: false
    };
    await writeDocCollection("tasks", selectedTaskForRejectionExplanation.id, updatedTask, tasks, setTasks);

    // Alert admin
    const admins = users.filter(u => u.role === "admin");
    for (const adm of admins) {
      await pushNotification(
        adm.id,
        "إعادة تقديم تقرير لتاسك معدل",
        `أرسل ${currentUser.name} توضيحًا وتعليقات جديدة حول سبب التعديل لمهمة: ${selectedTaskForRejectionExplanation.title}`,
        "review"
      );
    }

    setRejectionExpText("");
    setSelectedTaskForRejectionExplanation(null);
    showToast("تم إعادة تسليم التوضيح للأدمن ولجنة الإشراف لمراجعة الاعتماد.");
  };

  // Admin rates overall employee monthly rating
  const handleSetOverallEmployeeRating = async (memberId: string, rating: number) => {
    const updatedUsers = users.map(u => {
      if (u.id === memberId) {
        return { ...u, overallRating: rating };
      }
      return u;
    });
    saveCollectionsLocally(updatedUsers);
    
    // Write database update if inline
    if (useFirebase && currentUser) {
      try {
        const userDocRef = doc(db, "users", memberId);
        await updateDoc(userDocRef, { overallRating: rating });
      } catch (err) {
        // Fallback
      }
    }

    // Send evaluation alert to member
    await pushNotification(
      memberId,
      "تم تحديث تقييمك الشهري الشامل",
      `منحك المدير تقييمًا وشهادة نهائية شاملة لهذا الشهر بمعدل: ${"⭐️".repeat(rating)}!`,
      "rating"
    );
    showToast("تم تثبيت التقييم المهنّئ الشامل للموظف للشهر الحالي!");
  };

  // --- Campaign Operations ---
  const handleAddNewCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName.trim()) return;

    const brandCampaign: Campaign = {
      id: "c-" + Math.random().toString(36).substr(2, 9),
      name: newCampaignName.trim(),
      channel: newCampaignChannel,
      budget: Number(newCampaignBudget),
      spent: 0,
      progress: 0,
      leads: 0
    };

    await writeDocCollection("campaigns", brandCampaign.id, brandCampaign, campaigns, setCampaigns);
    setIsCampaignModalOpen(false);
    setNewCampaignName("");
    showToast("تم إطلاق وإضافة تفاصيل الحملة التسويقية الجديدة بالناجح.");
  };

  // --- Specialty Operations ---
  const handleAddNewSpecialty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpecialtyName.trim()) return;

    const newSp: Specialty = {
      id: "sp-" + Math.random().toString(36).substr(2, 9),
      name: newSpecialtyName.trim(),
      description: newSpecialtyDesc.trim() || "وصف متخصص للفريق المساند"
    };

    await writeDocCollection("specialties", newSp.id, newSp, specialties, setSpecialties);
    setIsSpecialtyModalOpen(false);
    setNewSpecialtyName("");
    setNewSpecialtyDesc("");
    showToast("تم تسجيل وحفظ القسم/التخصص الإداري الجديد بالناجح.");
  };

  // Pending user review triggers (Admin accepts teammates)
  const handleApproveTeammate = async (memberId: string, chosenSpecialty: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === memberId) {
        return { ...u, status: "active" as const, specialty: chosenSpecialty };
      }
      return u;
    });
    saveCollectionsLocally(updatedUsers);

    if (useFirebase && currentUser) {
      try {
        const userDocRef = doc(db, "users", memberId);
        await updateDoc(userDocRef, { status: "active", specialty: chosenSpecialty });
      } catch (e) {
        // preserve
      }
    }

    await pushNotification(
      memberId,
      "أهلًا بك! تم تفعيل حسابك من مدير المساحة",
      `تم قبول طلب انضمامك لقسم الماركتينج بنجاح. تخصصك: ${chosenSpecialty}`,
      "team"
    );
    showToast("تم قبول طلب الانضمام وتعيين قسم الموظف المذكور.");
  };

  const handleRejectTeammate = async (memberId: string) => {
    const updatedUsers = users.filter(u => u.id !== memberId);
    saveCollectionsLocally(updatedUsers);

    if (useFirebase && currentUser) {
      try {
        await deleteDoc(doc(db, "users", memberId));
      } catch (err) {
        // Fallback
      }
    }
    showToast("تم رفض وإقصاء العضو المعلق.");
  };

  // Mark all notifications as read
  const handleMarkAllNotificationsRead = () => {
    const cleared = notifications.map(n => ({ ...n, read: true }));
    saveCollectionsLocally(undefined, undefined, undefined, undefined, undefined, cleared);
    setShowNotificationsDropdown(false);
    showToast("تم تحديد جميع التحديثات كالتنبيهات مقروءة.");
  };

  // Employee workload calculators
  const calculatedWorkload = useMemo(() => {
    return (userId: string) => {
      const unsolved = tasks.filter(t => t.assigneeId === userId && t.status !== "done").length;
      return Math.min(100, unsolved * 25); // simple rating system
    };
  }, [tasks]);

  // Private task filter mapping: Admin sees everything, employee sees ONLY their own assigned tasks!
  const filteredTasks = useMemo(() => {
    if (!currentUser) return [];
    const baseTasks = currentUser.role === "admin" 
      ? tasks 
      : tasks.filter(t => t.assigneeId === currentUser.id);

    if (!searchQuery.trim()) return baseTasks;
    return baseTasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [tasks, currentUser, searchQuery]);

  const activeReports = useMemo(() => {
    if (!currentUser) return [];
    return reports.filter(r => r.status === "pending");
  }, [reports, currentUser]);

  const activeMembers = useMemo(() => {
    return users.filter(u => u.status === "active");
  }, [users]);

  const pendingMembersList = useMemo(() => {
    return users.filter(u => u.status === "pending");
  }, [users]);

  // Total points monthly overall summary statistics
  const teamMemberStats = useMemo(() => {
    return activeMembers.map(member => calculateEmployeeStats(member, tasks, reports));
  }, [activeMembers, tasks, reports]);

  return (
    <div className="min-h-screen text-slate-800 flex flex-col font-sans selection:bg-indigo-500/20 antialiased relative">
      
      {/* Toast Alert message banner */}
      {toastMessage && (
        <div 
          id="global-toast-banner" 
          className="fixed bottom-6 left-6 z-50 p-4 rounded-2xl glass-panel max-w-sm flex items-center gap-3 border-emerald-500/30 text-emerald-800 animate-bounce"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* BEFORE USER SIGN IN SHELL BAR */}
      {!currentUser ? (
        <div id="auth-gate-window" className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 glass-panel rounded-[32px] p-8 md:p-12 relative overflow-hidden">
            
            {/* Ambient branding side decoration panel */}
            <div className="flex flex-col justify-between gap-12 text-slate-800 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xl shadow-lg shadow-indigo-600/30">
                  M
                </div>
                <span className="font-bold tracking-tight text-slate-800 font-sans text-sm">مؤسسة محي الدين للتسويق</span>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold text-indigo-700 tracking-wider">مساحة فريق التسويق الرقمي</span>
                <h1 className="text-3xl md:text-5xl font-black leading-[1.25] tracking-tight text-indigo-950">
                  كل شغلك الإبداعي.<br />
                  <span className="text-indigo-600">في مكان واحد.</span>
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

            {/* Auth panel selector */}
            <div className="flex flex-col justify-center items-stretch gap-6 bg-white/70 border border-white/80 rounded-[24px] p-6 md:p-8 backdrop-blur-md relative z-10 shadow-xl">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-bold text-slate-800">ابدأ مساحتك المهنية الملتزمة</h2>
                <p className="text-xs text-slate-500">سجل حسابك باستخدام Google للالتحاق الفوري بالشركة</p>
              </div>

              {/* Toggle to choose between dynamic mode */}
              <div className="p-1 rounded-xl bg-slate-200/50 flex gap-1 border border-slate-200 text-xs">
                <button 
                  onClick={() => { setUseFirebase(true); localStorage.setItem("workspace_prefer_firebase", "true"); }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${useFirebase ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
                >
                  ربط السحابة Firebase 🌐
                </button>
                <button 
                  onClick={() => { setUseFirebase(false); localStorage.setItem("workspace_prefer_firebase", "false"); }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${!useFirebase ? "bg-white text-slate-800 shadow" : "text-slate-500 hover:text-slate-700"}`}
                >
                  الوضع المحلي التجريبي 💾
                </button>
              </div>

              {useFirebase ? (
                <button 
                  onClick={handleGoogleLogin}
                  id="google-signin-btn"
                  className="w-full py-3 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-lg shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.01v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.38Z"/>
                    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.39l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"/>
                    <path fill="#FBBC05" d="M6.39 13.91A6 6 0 0 1 6.08 12c0-.66.11-1.3.31-1.91V7.48H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.52l3.35-2.61Z"/>
                    <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.48l3.35 2.61C7.18 7.72 9.39 5.96 12 5.96Z"/>
                  </svg>
                  اتصال وتأكيد بهوية Google
                </button>
              ) : (
                <div className="text-center p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl text-indigo-900 text-xs text-right leading-relaxed flex flex-col gap-2">
                  <span className="font-semibold block text-[13px]">حفظ كفاءات العمل وتأثيثها محليًا</span>
                  <span>البيانات ستخلق وتحفظ داخل متصفحك مباشرة. يمكنك تشغيل النسخة الكاملة كمدير أو موظف للاختبار السريع:</span>
                  <div className="flex gap-2.5 mt-1.5">
                    <button 
                      onClick={loginAsDemoAdmin}
                      className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                    >
                      إدارة المساحة (أدمن)
                    </button>
                    <button 
                      onClick={loginAsDemoMember}
                      className="flex-1 py-2 rounded-lg bg-slate-800 text-white font-bold hover:bg-slate-900 transition"
                    >
                      مساحة موظف (عضو)
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                * ملاحظة: المدير فقط يملك صلاحية تنشيط وقبول وتنسيب الأعضاء وتعيين أوزان نقاطهم في قاعدة بيانات الماركتينج.
              </p>
            </div>
          </div>
        </div>
      ) : currentUser.status === "pending" ? (
        /* PENDING APPROVAL SCREEN WITH BEAUTIFUL GLASS LAYOUT */
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-panel rounded-[32px] p-8 text-center relative overflow-hidden flex flex-col gap-6 items-center">
            {/* Ambient background light */}
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/15 blur-2xl"></div>
            
            {/* Pulsing visual indicator */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 animate-pulse relative z-10 shadow-lg">
              <Clock className="w-8 h-8" />
            </div>

            <div className="flex flex-col gap-2 relative z-10">
              <h1 className="text-2xl font-black tracking-tight text-white mb-1">
                سجلت دخولك بنجاح! طلب الانضمام قيد المراجعة ⏳
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed max-w-md">
                مرحباً بك يا <span className="font-extrabold text-indigo-400">{currentUser.name}</span> في مؤسسة محيي الدين للتسويق. لقد تم تسجيل حسابك الفعلي بنجاح ببريدك الإلكتروني، ونحن في انتظار تفعيل حسابك وتنسيب تخصصك من قبل المدير المعمد.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 w-full text-right flex flex-col gap-2.5 text-xs relative z-10">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">البريد الإلكتروني:</span>
                <span className="font-semibold text-slate-200">{currentUser.email}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">رقم التعريف الفردي لربط المهام (UID):</span>
                <span className="font-mono text-indigo-350 select-all">{currentUser.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">حالة الحساب بمجموعة العمل:</span>
                <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">معلق وبانتظار تفعيل المسؤول</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed relative z-10">
              بمجرد قيام المدير (محيي الدين) بتنشيط طلبك وتحديد صلاحيات التخصص لك في صفحته بمساحة الإدارة، سيتم فتح كافة أقسام النظام تلقائياً لك للبدء بالعمل واستقبال المهام.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full relative z-10">
              <button
                onClick={handleLogout}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs transition active:scale-95 duration-200"
              >
                تسجيل الخروج والعودة
              </button>
              <button
                onClick={() => {
                  setUseFirebase(false);
                  localStorage.setItem("workspace_prefer_firebase", "false");
                  setCurrentUser(null);
                  showToast("تم تحويل مساحتك للوضعية المحلية الاستكشافية!");
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white text-xs transition active:scale-95 duration-200 shadow-lg shadow-indigo-600/20"
              >
                تصفح بالوضع التجريبي المحلي 💾
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ACTIVE APP SHELL LAYOUT */
        <div className="flex flex-col md:flex-row min-h-screen">
          
          {/* SIDEBAR NAVIGATION GRID */}
          <aside className={`fixed md:sticky top-0 right-0 h-screen w-64 bg-slate-900 text-slate-200 z-40 transition-transform duration-300 transform md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"} flex flex-col justify-between p-6 shadow-2xl`}>
            <div className="flex flex-col gap-8">
              
              {/* Sidebar Header Brand logo */}
              <div className="flex items-center gap-3 justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg">
                    M
                  </div>
                  <div className="flex flex-col">
                    <strong className="text-sm font-bold tracking-tight text-white font-sans text-right">محي الدين</strong>
                    <span className="text-[10px] text-slate-400">Marketing CRM</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Nav anchors */}
              <nav className="flex flex-col gap-1 text-right">
                <button 
                  onClick={() => { setActiveTab("dashboard"); setSidebarOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${activeTab === "dashboard" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <Activity className="w-4 h-4 ml-1" />
                  <span>لوحة المتابعة العامة</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("tasks"); setSidebarOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${activeTab === "tasks" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <CheckSquare className="w-4 h-4 ml-1" />
                  <span>المهام والمؤقتات</span>
                  {tasks.filter(t => t.assigneeId === currentUser.id && t.status !== "done").length > 0 && currentUser.role !== "admin" && (
                    <span className="mr-auto bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {tasks.filter(t => t.assigneeId === currentUser.id && t.status !== "done").length}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => { setActiveTab("team"); setSidebarOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${activeTab === "team" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <Users className="w-4 h-4 ml-1" />
                  <span>أعضاء الفريق</span>
                  {pendingMembersList.length > 0 && currentUser.role === "admin" && (
                    <span id="pending-count-badge" className="mr-auto bg-indigo-500 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingMembersList.length} جديد
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => { setActiveTab("campaigns"); setSidebarOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${activeTab === "campaigns" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <TrendingUp className="w-4 h-4 ml-1" />
                  <span>الحملات الإعلانية</span>
                </button>

                <button 
                  onClick={() => { setActiveTab("reports"); setSidebarOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${activeTab === "reports" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <Briefcase className="w-4 h-4 ml-1" />
                  <span>تقارير التسليمات</span>
                  {activeReports.length > 0 && currentUser.role === "admin" && (
                    <span id="reports-pending-badge" className="mr-auto bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {activeReports.length} مراجعة
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}
                  className={`w-full py-2.5 px-4 rounded-xl flex items-center gap-3 transition-all text-xs font-semibold ${activeTab === "settings" ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800/60"}`}
                >
                  <Settings className="w-4 h-4 ml-1" />
                  <span>اعدادات ومصادر الـ Firebase</span>
                </button>
              </nav>
            </div>

            {/* Profile footer and exit trigger */}
            <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-3 text-right">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-9 h-9 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-500 text-slate-800 font-extrabold flex items-center justify-center text-sm uppercase">
                    {currentUser.name[0]}
                  </div>
                )}
                <div className="flex flex-col max-w-[140px] truncate">
                  <span className="text-xs font-bold text-white truncate">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-500 truncate capitalize">{currentUser.role === "admin" ? "مدير المساحة (أدمن)" : currentUser.specialty}</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                id="sidebar-logout-btn"
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>

          {/* MAIN INTERACTING SPACE */}
          <main className="flex-1 min-w-0 p-4 md:p-8 flex flex-col gap-6">
            
            {/* TOP BAR SEARCH AND NOTIFICATION PANEL */}
            <header className="flex items-center justify-between gap-4 border-b border-white/40 pb-4">
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-xl border border-white/50 bg-white/40"
                >
                  <Menu className="w-5 h-5 text-slate-800" />
                </button>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-slate-400 font-semibold font-sans">
                    {new Date().toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  <h2 className="text-xl font-bold tracking-tight text-slate-800 mt-0.5">
                    أهلاً وسهلاً بك، {currentUser.name.split(" ")[0]}
                  </h2>
                </div>
              </div>

              {/* Dynamic Action Buttons */}
              <div className="flex items-center gap-2.5">
                
                {/* Global Search box */}
                <div className="relative hidden lg:block">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في لوحة العمل..."
                    className="w-56 p-2 pr-9 pl-3 text-xs bg-white/60 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>

                {/* DB toggle Badge Indicator */}
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-white/40 border-indigo-400/20 text-indigo-700 hidden sm:block">
                  {useFirebase ? "قاعدة بيانات Firebase مستقرة 🌐" : "وضع المحاكاة المحلي 💾"}
                </span>

                {/* Notifications Dropdown anchor */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                    id="notifications-bell-btn"
                    className="p-2.5 rounded-xl border border-white/60 bg-white/50 hover:bg-white/80 transition relative"
                  >
                    <Bell className="w-4.5 h-4.5 text-slate-700" />
                    {notifications.filter(n => n.recipientId === currentUser.id && !n.read).length > 0 && (
                      <span id="unread-notif-dot" className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    )}
                  </button>

                  {/* Active notifications list drop panel */}
                  {showNotificationsDropdown && (
                    <div id="notifications-dropdown-menu" className="absolute left-0 mt-2 w-72 bg-white/95 border border-slate-200 shadow-2xl rounded-2xl z-50 overflow-hidden backdrop-blur-xl animate-enter">
                      <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
                        <span className="text-xs font-bold text-slate-800">التحديثات والإشعارات ({notifications.filter(n => n.recipientId === currentUser.id && !n.read).length})</span>
                        <button 
                          onClick={handleMarkAllNotificationsRead}
                          className="text-[9px] font-bold text-indigo-600 hover:underline"
                        >
                          تحديد الكل كمقروء
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.filter(n => n.recipientId === currentUser.id).length === 0 ? (
                          <div className="p-6 text-center text-[11px] text-slate-400 italic">
                            لا توجد تنبيهات جديدة في الوقت الحالي.
                          </div>
                        ) : (
                          notifications
                            .filter(n => n.recipientId === currentUser.id)
                            .map(n => (
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

            {/* DYNAMIC TAB COMPONENT BINDING */}
            
            {/* TAB 1: DASHBOARD VIEW */}
            {activeTab === "dashboard" && (
              <div id="dashboard-tab-view" className="flex flex-col gap-6 animate-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase">نظرة عامة شاملة للأداء</span>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 mt-1">أنشطة فريق الماركتينج</h1>
                  </div>

                  {currentUser.role === "admin" && (
                    <button 
                      onClick={() => setIsTaskModalOpen(true)}
                      id="dashboard-new-task-btn"
                      className="px-4.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة مهمة جديدة</span>
                    </button>
                  )}
                </div>

                {/* Dashboard Stats boxes Grid */}
                <div id="dashboard-metric-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                      ⏱️
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">مهام نشطة قيد الإنجاز</span>
                      <strong className="text-2xl font-black text-slate-800 mt-2 block">
                        {tasks.filter(t => t.status === "progress" || t.status === "todo" || t.status === "rejected").length} مهام
                      </strong>
                    </div>
                  </div>

                  <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      🎯
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">نسبة تغطية الإنجاز</span>
                      <strong className="text-2xl font-black text-slate-800 mt-2 block">
                        {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}% إتمام
                      </strong>
                    </div>
                  </div>

                  <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-indigo-150 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      👥
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">كادر الفريق والطلبات</span>
                      <strong className="text-2xl font-black text-slate-800 mt-2 block">
                        {activeMembers.length} موظف {pendingMembersList.length > 0 && `(+${pendingMembersList.length} معلق)`}
                      </strong>
                    </div>
                  </div>

                  <div className="p-5 glass-panel rounded-3xl flex flex-col justify-between min-h-[140px] relative overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                      🏆
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">متوسط نقاط التكريم الكلي</span>
                      <strong className="text-2xl font-black text-slate-800 mt-2 block">
                        {teamMemberStats.reduce((sum, s) => sum + s.totalWeightPoints, 0)} نقطة شهريًا
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Dashboard layout visualizer */}
                <div className="grid lg:grid-cols-3 gap-6">
                  
                  {/* Column 1: Live workspace tracking widget (Employee summary list) */}
                  <div className="lg:col-span-2 p-5 glass-panel rounded-3xl flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-indigo-700">تحديث لحظي</span>
                        <h3 className="text-base font-bold text-slate-800">متابعة الأداء وساعات النبض الإنشائي</h3>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 py-1 text-right">
                      {teamMemberStats.map((stat) => (
                        <div key={stat.memberId} className="p-3 bg-white/40 hover:bg-white/60 transition rounded-2xl border border-white/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-700 font-bold uppercase">
                              {stat.name[0]}
                            </div>
                            <div className="flex flex-col">
                              <strong className="text-slate-800 text-[13px]">{stat.name}</strong>
                              <span className="text-[10px] text-slate-400 uppercase">{stat.specialty}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 items-center justify-between sm:justify-end">
                            {/* Overall rating custom input */}
                            <div className="flex flex-col text-right">
                              <span className="text-[9px] text-slate-400">التقييم الشامل لهذا الشهر</span>
                              <div className="flex gap-1 mt-1 justify-end">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star 
                                    key={s} 
                                      className={`w-3 h-3 hover:scale-125 cursor-pointer ${s <= (stat.overallRating || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                                      onClick={() => currentUser.role === "admin" && handleSetOverallEmployeeRating(stat.memberId, s)}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Total points */}
                            <div className="text-left font-mono text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-xl">
                              {stat.totalWeightPoints} نقطة
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Live workloads and pending queue summary */}
                  <div className="p-5 glass-panel rounded-3xl flex flex-col gap-4 text-right">
                    <h3 className="text-base font-bold text-slate-800">كثافة العمل النشط</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">توزيع قوة وتغطية ساعات التسليمات حاليًا للموظفين الفاعلين:</p>

                    <div className="flex flex-col gap-4 mt-2">
                      {activeMembers.map((m) => {
                        const load = calculatedWorkload(m.id);
                        return (
                          <div key={m.id} className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-mono text-[10px]">{load}% عبء عمل</span>
                              <strong className="text-slate-700">{m.name}</strong>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${load > 75 ? "bg-red-500" : load > 40 ? "bg-amber-400" : "bg-emerald-500"}`}
                                style={{ width: `${load}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: TASKS KANBAN & TIMERS VIEW */}
            {activeTab === "tasks" && (
              <div id="tasks-tab-view" className="flex flex-col gap-6 animate-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600">جدولة وتوقيت مهام الفريق</span>
                    <h1 className="text-2xl font-black text-slate-800 mt-1">المهام والمؤقتات اليومية</h1>
                  </div>

                  {currentUser.role === "admin" && (
                    <button 
                      onClick={() => setIsTaskModalOpen(true)}
                      id="tasks-add-task-btn"
                      className="px-4.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>تكليف بمهمة جديدة</span>
                    </button>
                  )}
                </div>

                {/* Task Private info warning */}
                {currentUser.role !== "admin" && (
                  <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-800 text-xs text-right leading-relaxed flex items-center justify-between gap-3">
                    <span>💡 الخصوصية مفعلة: هذه اللوحة مخصصة لك فقط، ولا يمكنك رؤية المهام أو المؤقتات الخاصة بزملائك في المساحة.</span>
                  </div>
                )}

                {/* BOARD COLUMNS FLOW */}
                <div id="kanban-columns-container" className="grid md:grid-cols-3 xl:grid-cols-5 gap-4 items-start mt-2">
                  
                  {/* Column 1: Todo */}
                  <div className="p-3 rounded-2xl bg-slate-100 flex flex-col gap-3 min-h-[350px]">
                    <div className="flex justify-between items-center px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      <h4 className="text-xs font-bold text-slate-700">مطلوبة (Todo)</h4>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full">
                        {filteredTasks.filter(t => t.status === "todo").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {filteredTasks.filter(t => t.status === "todo").map(task => (
                        <div key={task.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-right flex flex-col gap-2.5 shadow-sm">
                          <span className="text-[9px] font-bold text-indigo-600">{(campaigns.find(c => c.id === task.campaignId)?.name) || "الحملة العامة"}</span>
                          <h5 className="text-xs font-bold text-slate-800 leading-normal">{task.title}</h5>
                          <span className="text-[10px] text-slate-400">التسليم: {new Date(task.dueDate).toLocaleDateString("ar-EG")}</span>
                          
                          {/* Timer widget */}
                          <TaskTimer task={task} onUpdateTimer={syncTimerState} canControl={currentUser.id === task.assigneeId} />

                          {currentUser.id === task.assigneeId && (
                            <button
                              onClick={() => {
                                const refreshed = { ...task, status: "progress" as TaskStatus, timerIsRunning: true };
                                writeDocCollection("tasks", task.id, refreshed, tasks, setTasks);
                                showToast("تم بدء العمل وتشغيل العداد الزمني للمهمة.");
                              }}
                              className="w-full py-2 hover:bg-indigo-50 hover:text-indigo-600 transition text-[11px] font-bold text-slate-600 border border-slate-200 rounded-xl"
                            >
                              بدء المهمة الآن ▶️
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Progress */}
                  <div className="p-3 rounded-2xl bg-blue-100/40 border border-blue-200/50 flex flex-col gap-3 min-h-[350px]">
                    <div className="flex justify-between items-center px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <h4 className="text-xs font-bold text-slate-700">قيد التنفيذ (Progress)</h4>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full">
                        {filteredTasks.filter(t => t.status === "progress").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {filteredTasks.filter(t => t.status === "progress").map(task => (
                        <div key={task.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-right flex flex-col gap-2.5 shadow-sm">
                          <span className="text-[9px] font-bold text-indigo-600 font-sans">{(campaigns.find(c => c.id === task.campaignId)?.name) || "الحملة العامة"}</span>
                          <h5 className="text-xs font-bold text-slate-800 leading-normal">{task.title}</h5>
                          <span className="text-[10px] text-slate-400">التسليم: {new Date(task.dueDate).toLocaleDateString("ar-EG")}</span>
                          
                          <TaskTimer task={task} onUpdateTimer={syncTimerState} canControl={currentUser.id === task.assigneeId} />

                          {currentUser.id === task.assigneeId && (
                            <button
                              onClick={() => setSelectedTaskForReport(task)}
                              className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition text-[11px] flex items-center justify-center gap-1"
                            >
                              تسليم التقرير للأدمن 📝
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Review */}
                  <div className="p-3 rounded-2xl bg-amber-100/40 border border-amber-200/50 flex flex-col gap-3 min-h-[350px]">
                    <div className="flex justify-between items-center px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                      <h4 className="text-xs font-bold text-slate-700">قيد المراجعة (Review)</h4>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full">
                        {filteredTasks.filter(t => t.status === "review").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {filteredTasks.filter(t => t.status === "review").map(task => {
                        const associatedReport = reports.find(r => r.taskId === task.id);
                        return (
                          <div key={task.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-right flex flex-col gap-2.5 shadow-sm">
                            <span className="text-[9px] font-bold text-indigo-600">{(campaigns.find(c => c.id === task.campaignId)?.name) || "الحملة العامة"}</span>
                            <h5 className="text-xs font-bold text-slate-800 leading-normal">{task.title}</h5>
                            <span className="text-[10px] text-slate-400">ملتحق بملفات التقارير الفنية</span>
                            
                            {currentUser.role === "admin" && associatedReport && (
                              <button
                                onClick={() => setSelectedReportForReview(associatedReport)}
                                className="w-full py-2 bg-amber-500/10 border border-amber-300 text-amber-800 font-bold rounded-xl hover:bg-amber-500 hover:text-white transition text-[11px] flex items-center justify-center gap-1"
                              >
                                مراجعة تقرير المخرجات ⭐
                              </button>
                            )}

                            {currentUser.role !== "admin" && (
                              <div className="p-2 bg-slate-50 rounded-xl text-center text-[10px] text-amber-800 font-semibold border border-amber-500/10">
                                بانتظار تصديق الأدمن والتقييم...
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 4: Approved/Done */}
                  <div className="p-3 rounded-2xl bg-emerald-100/40 border border-emerald-200/50 flex flex-col gap-3 min-h-[350px]">
                    <div className="flex justify-between items-center px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h4 className="text-xs font-bold text-slate-700">معتمدة مقبولة (Done)</h4>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full">
                        {filteredTasks.filter(t => t.status === "done").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {filteredTasks.filter(t => t.status === "done").map(task => (
                        <div key={task.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-right flex flex-col gap-2.5 shadow-sm ring-1 ring-emerald-500/10">
                          <span className="text-[9px] font-bold text-indigo-600">{(campaigns.find(c => c.id === task.campaignId)?.name) || "الحملة العامة"}</span>
                          <h5 className="text-xs font-bold text-slate-805 leading-normal">{task.title}</h5>
                          
                          <div className="flex gap-1 justify-end py-1 items-center">
                            <span className="text-[9px] text-slate-400 mr-2">جودة التقييم:</span>
                            {Array.from({ length: task.starsRating || 5 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-500 shrink-0" />
                            ))}
                          </div>
                          
                          <span className="text-[10px] text-emerald-800 bg-emerald-50 text-center font-bold py-1 rounded-lg">
                            + {task.weight} نقطة مستحقة لراتبك
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 5: Rejected/Revision */}
                  <div className="p-3 rounded-2xl bg-red-100/40 border border-red-200/50 flex flex-col gap-3 min-h-[350px]">
                    <div className="flex justify-between items-center px-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <h4 className="text-xs font-bold text-slate-700">تعديلات وملاحظات (Rejected)</h4>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded-full">
                        {filteredTasks.filter(t => t.status === "rejected").length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {filteredTasks.filter(t => t.status === "rejected").map(task => {
                        const reportOfRejected = reports.find(r => r.taskId === task.id);
                        return (
                          <div key={task.id} className="p-4 rounded-2xl bg-white border border-slate-200 text-right flex flex-col gap-2 shadow-sm ring-1 ring-red-500/10">
                            <span className="text-[9px] font-bold text-indigo-600">{(campaigns.find(c => c.id === task.campaignId)?.name) || "الحملة العامة"}</span>
                            <h5 className="text-xs font-bold text-slate-800 leading-normal">{task.title}</h5>
                            
                            {reportOfRejected?.adminFeedback && (
                              <div className="p-2 rounded-xl bg-red-50 border border-red-100 text-[10px] text-red-700 leading-relaxed font-medium">
                                <span className="font-bold underline">تعليق الأدمن:</span> {reportOfRejected.adminFeedback}
                              </div>
                            )}

                            {currentUser.id === task.assigneeId && (
                              <button
                                onClick={() => setSelectedTaskForRejectionExplanation(task)}
                                className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 text-[11px]"
                              >
                                تقديم مسببات وتعديل المخرج 🔁
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: TEAM MEMBERS & PDF GENERATOR VIEW */}
            {activeTab === "team" && (
              <div id="team-tab-view" className="flex flex-col gap-6 animate-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600">تقييم الكادر وإجراءات PDF</span>
                    <h1 className="text-2xl font-black text-slate-800 mt-1">كادر فريق التسويق والشركاء</h1>
                  </div>
                </div>

                {/* Admin-only pending requests widget */}
                {currentUser.role === "admin" && pendingMembersList.length > 0 && (
                  <div className="p-5 bg-indigo-950 text-white rounded-3xl flex flex-col gap-4 shadow-xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold tracking-tight">طلبات التفعيل والانضمام المعلقة ({pendingMembersList.length})</h3>
                      <span className="text-xs font-bold bg-indigo-600 px-3 py-1 rounded-full text-indigo-100">رسمي</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {pendingMembersList.map((pending) => (
                        <div key={pending.id} className="p-4 rounded-2xl bg-white/10 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-right">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 font-extrabold flex items-center justify-center">
                              {pending.name[0]}
                            </div>
                            <div className="flex flex-col">
                              <strong className="font-bold">{pending.name}</strong>
                              <span className="text-slate-400">{pending.email}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            {/* specialty selector */}
                            <select 
                              id={`select-specialty-${pending.id}`}
                              defaultValue={SEED_SPECIALTIES[0].name}
                              className="p-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] outline-none font-semibold text-white"
                            >
                              {specialties.map(sp => (
                                <option key={sp.id} value={sp.name}>{sp.name}</option>
                              ))}
                            </select>

                            <button
                              onClick={() => {
                                const selectEl = document.getElementById(`select-specialty-${pending.id}`) as HTMLSelectElement;
                                handleApproveTeammate(pending.id, selectEl?.value || "صناعة المحتوى");
                              }}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500 text-slate-900 font-bold hover:bg-indigo-600"
                            >
                              تفعيل انضمام
                            </button>
                            <button
                              onClick={() => handleRejectTeammate(pending.id)}
                              className="px-2 py-1.5 rounded-lg bg-red-650 hover:bg-red-750 text-red-400 transition"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ACTIVE EMPLOYEES GRID VIEW */}
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 text-right">
                  {teamMemberStats.map((stat) => (
                    <div key={stat.memberId} className="p-5 glass-panel rounded-3xl flex flex-col gap-4 relative overflow-hidden shadow">
                      
                      {/* Member Info row */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase">
                          {stat.name[0]}
                        </div>
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
                          <strong className="text-[13px] text-indigo-600 font-bold block">{stat.totalWeightPoints} نقطة مجدية</strong>
                        </div>
                      </div>

                      {/* Display PDF Report puller button */}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => printPerformancePdf(stat)}
                          className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 transition text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
                        >
                          <FileDown className="w-4 h-4 ml-1 text-indigo-400" />
                          <span>استخراج تقرير أداء PDF شهري</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CAMPAIGNS VIEW */}
            {activeTab === "campaigns" && (
              <div id="campaigns-tab-view" className="flex flex-col gap-6 animate-enter">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-600">الميزانيات التسويقية والتقدم</span>
                    <h1 className="text-2xl font-black text-slate-800 mt-1">حملات التسويق والماركتينج المفعّلة</h1>
                  </div>

                  {currentUser.role === "admin" && (
                    <button 
                      onClick={() => setIsCampaignModalOpen(true)}
                      className="px-4.5 py-2.5 rounded-xl border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-lg shadow-indigo-600/10"
                    >
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
                        <span className="text-[9px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-100">
                          نشطة
                        </span>
                      </div>

                      {/* Progress and status bars */}
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
                          <strong className="font-bold text-indigo-700 block mt-0.5 font-sans text-[11px]">{tasks.filter(t => t.campaignId === camp.id).length} مهام</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: REPORTS ARCHIVE VIEW */}
            {activeTab === "reports" && (
              <div id="reports-tab-view" className="flex flex-col gap-6 animate-enter">
                <div>
                  <span className="text-xs font-bold text-indigo-600">أرشيف تقارير المخرجات والتقييمات الفورية</span>
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
                        <div className="flex flex-col gap-2.5 flex-1 select-all">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">رقم التقرير: #{rep.id}</span>
                            <span className={`text-[9px] px-2 py-1 rounded-full font-bold ${rep.status === "approved" ? "bg-emerald-50 text-emerald-800" : rep.status === "rejected" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800 animate-pulse"}`}>
                              {rep.status === "approved" ? "تم قبول التقرير والاعتماد" : rep.status === "rejected" ? "مرفوض - وبانتظار التعديل" : "قيد المراجعة حاليًا"}
                            </span>
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

                        {/* Admin triggers */}
                        {currentUser.role === "admin" && rep.status === "pending" && (
                          <button
                            onClick={() => setSelectedReportForReview(rep)}
                            className="p-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 transition text-white text-xs font-bold"
                          >
                            اتخاذ قرار تقييمي 📝
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: SETTINGS & STEP-BY-STEP FIREBASE SETUP GUIDE */}
            {activeTab === "settings" && (
              <div id="settings-tab-view" className="flex flex-col gap-6 animate-enter">
                <div>
                  <span className="text-xs font-bold text-indigo-600">الملف الفني ومصادر السحابة</span>
                  <h1 className="text-2xl font-black text-slate-800 mt-1">الإعدادات وإرشاد الـ Firebase</h1>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 mt-2 text-right">
                  
                  {/* Info card */}
                  <div className="lg:col-span-2 p-5 glass-panel rounded-3xl flex flex-col gap-4">
                    <h3 className="text-base font-bold text-slate-800">ملف مساحة الحساب الفني الحالي</h3>
                    
                    <div className="flex items-center gap-4 py-2 border-b border-slate-200/50 pb-4">
                      {currentUser.photoURL ? (
                        <img src={currentUser.photoURL} alt="" className="w-14 h-14 rounded-full border-2 border-white object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-indigo-500 text-slate-800 font-extrabold flex items-center justify-center text-lg">
                          {currentUser.name[0]}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <strong className="text-base font-bold text-slate-800">{currentUser.name}</strong>
                        <span className="text-xs text-slate-500 mt-1">{currentUser.email}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 py-1 text-xs">
                      <div className="flex justify-between p-2 rounded-xl bg-white/40">
                        <span className="text-slate-400">الدور الإشرافي الحالي</span>
                        <strong className="text-slate-700 capitalize">{currentUser.role === "admin" ? "مدير المساحة الفعّال (أدمن)" : "موظف ممارس"}</strong>
                      </div>
                      <div className="flex justify-between p-2 rounded-xl bg-white/40">
                        <span className="text-slate-400">القسم الوظيفي الملحق</span>
                        <strong className="text-slate-700 font-bold">{currentUser.specialty}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Settings toggler for testing local fallback */}
                  <div className="p-5 glass-panel rounded-3xl flex flex-col gap-4">
                    <h3 className="text-base font-bold text-slate-800">بيئة تشغيل قاعدة البيانات</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      يدعم النظام الاتصال اللحظي بقاعدة بيانات Firebase Firestore أو استبدالها تلقائيًا بوضع حفظ محلي لسهولة الفحص السريع ومراجعة النماذج مجانًا:
                    </p>

                    <button
                      onClick={() => {
                        const nextVal = !useFirebase;
                        setUseFirebase(nextVal);
                        localStorage.setItem("workspace_prefer_firebase", String(nextVal));
                        showToast(nextVal ? "تم ربط مساحة العمل الفني بقاعدة Firebase السحابية" : "تم تعيين متصفحك المحلي بيئة مستقرة لمعالجة البيانات.");
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 border ${useFirebase ? "bg-indigo-600 text-white border-indigo-700 shadow-md" : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"}`}
                    >
                      {useFirebase ? "🌐 متصل بـ Firebase" : "💾 يعمل في الوضع المحلي"}
                    </button>
                  </div>
                </div>

                {/* ACCORDION: STEP-BY-STEP FIREBASE ACTIVATE GUIDELINE */}
                <div className="p-5 glass-panel rounded-3xl flex flex-col gap-3 text-right">
                  <button 
                    onClick={() => setIsFirebaseGuideOpen(!isFirebaseGuideOpen)}
                    id="firebase-guide-accordion-btn"
                    className="w-full flex items-center justify-between text-right outline-none focus:ring-0"
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-indigo-600 shrink-0" />
                      <h3 className="text-sm font-bold text-slate-800">إرشاد تفعيل Firebase للمدير والموظفين خطوة بخطوة 🛠️</h3>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isFirebaseGuideOpen ? "transform rotate-180" : ""}`} />
                  </button>

                  {isFirebaseGuideOpen && (
                    <div id="firebase-guide-content" className="mt-4 border-t border-slate-200/50 pt-4 flex flex-col gap-4 text-xs text-slate-700 leading-relaxed leading-[1.8] animate-enter">
                      <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-2xl">
                        <strong className="text-indigo-900 block mb-1">الرسم والاتصال الفوري بالقاعدة:</strong>
                        مساحة العمل مدمج بها إعداد مشروعك المذكور في ملف <code className="font-mono bg-white px-1 py-0.5 rounded border">/src/firebase.ts</code> تلقائيًا. لتفعيل الدخول للمدراء والموظفين ومزامنة أوزان المهام ومؤقت العد ومرفقات التقارير بشكل كامل، يرجى اتباع الخطوات البسيطة التالية:
                      </div>

                      <div className="flex flex-col gap-3.5">
                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">1</span>
                          <div>
                            <strong className="text-slate-800 font-bold block mb-0.5">تفعيل Google Auth في مشروع الـ Auth:</strong>
                            اذهب لـ <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">شاشة تحكم Firebase Coonsle</a>، اختر مشروعك <code className="font-mono bg-slate-100 p-0.5 text-xs text-red-650 rounded">mohey-el-din-marketing-crm</code>. اذهب لـ <span className="font-bold text-slate-900">Build &gt; Authentication &gt; Sign-in method &gt; Add new provider</span> ثم قم بتعريف وتفعيل هوية <strong className="text-slate-800 underline">Google Login</strong> لتمكين الموظفين من المتابعة الآمنة الفورية.
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">2</span>
                          <div>
                            <strong className="text-slate-800 font-bold block mb-0.5">تهيئة قاعدة بيانات Cloud Firestore DB:</strong>
                            اذهب لـ <span className="font-bold text-slate-900">Build &gt; Firestore Database</span> واضغط على زر <span className="font-bold">Create Database</span>. اختر قاعدة مجانية خفيفة وحدد خيار <span className="font-bold">Start in Test Mode</span> أو التصدير المباشر لضمان تفعيل الحفظ من النوافذ.
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">3</span>
                          <div>
                            <strong className="text-slate-800 font-bold block mb-0.5">تلقيح ونشر قواعد الحماية والإتاحة (Rules):</strong>
                            قم بنسخ شستة القوانين المحمية المذكورة في ملف <code className="font-mono bg-slate-100 p-0.5 text-xs text-red-650 rounded">firestore.rules</code>، وألصقها في تبويب <span className="font-bold text-slate-905">Rules</span> بقاعدة بيانات الـ Firestore DB لمنع سرقة أو عبث الموظفين بالمهام الخاصة بزملائهم، وحصر المتابعة والإشراف والتسعير فقط للأدمن!
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">4</span>
                          <div>
                            <strong className="text-slate-800 font-bold block mb-0.5">تعيين وتنشيط المدراء وإسناد الصلاحيات الشاملة:</strong>
                            سيتم ترقية المستخدمين ذوي البريد <span className="font-bold text-slate-900">mostafakassab572@gmail.com</span> تلقائيًا ليكون له كامل الصلاحيات لإنشاء المهام والتسعير الإعلاني وتقييم التقارير بمستويات النجوم الـ 5. أو يمكنك يدوياً ترقية وثيقة أي مستخدم داخل مجمع الـ Cloud Firestore collection <code className="font-sans font-bold">users</code> وتعديل حقل <code className="font-semibold">role</code> الخاص به ليكون <code className="font-mono">admin</code>.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

          </main>
        </div>
      )}

      {/* RENDER MODAL: ALLOT NEW TASK FOR TEAM MEMBER (Admin only) */}
      {isTaskModalOpen && (
        <div id="new-task-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/80 border border-white/50 shadow-2xl rounded-[28px] overflow-hidden backdrop-blur-2xl animate-enter">
            <div className="flex items-center justify-between p-5 border-b border-white/40">
              <h2 className="text-sm font-bold text-slate-800">التكليف بمهمة وجدولة نقاطها</h2>
              <button 
                onClick={() => setIsTaskModalOpen(false)}
                className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewTask} className="p-5 flex flex-col gap-4 text-right">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                <span>اسم ومسمى المهمة المطلوبة *</span>
                <input
                  required
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="مثال: تجهيز تصميمات الواجهات الزجاجية"
                  className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>إسناد للموظف بمسؤولية الخصوصية *</span>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs"
                    required
                  >
                    <option value="">اختر الموظف...</option>
                    {activeMembers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.specialty})</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>الحملة الملحقة بالتاسك</span>
                  <select
                    value={newTaskCampaign}
                    onChange={(e) => setNewTaskCampaign(e.target.value)}
                    className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>أولوية التكليف</span>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="p-3 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs"
                  >
                    <option value="high">شديدة الأولوية 🔥</option>
                    <option value="medium">متوسطة الأولوية 🎯</option>
                    <option value="low">منخفضة</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>موعد التسليم النهائي *</span>
                  <input
                    required
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="p-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                  <span>وزن المهمة (نقاط مضافة) *</span>
                  <input
                    required
                    type="number"
                    min={1}
                    value={newTaskWeight}
                    onChange={(e) => setNewTaskWeight(Number(e.target.value))}
                    className="p-2.5 bg-white/50 border border-slate-200 rounded-xl outline-none text-xs text-center font-mono font-bold"
                  />
                </label>
              </div>

              {/* ALLOTTED COUNTDOWN TIMER DURATION FIELDS */}
              <div className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-slate-600 block">الوقت المخصص للعداد الزمني التلقائي:</span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">ساعة(ـات):</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={24}
                      value={newTaskHours}
                      onChange={(e) => setNewTaskHours(Number(e.target.value))}
                      className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center outline-none font-boldfont-mono"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">دقيقة (دقائق):</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={59}
                      value={newTaskMinutes}
                      onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                      className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-center outline-none font-boldfont-mono"
                    />
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="submit"
                  id="task-submit-btn"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-xs shadow-md shadow-indigo-600/10"
                >
                  تأكيد الجدولة والإرسال للموظف
                </button>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER MODAL: SUBMIT TASK REPORT (By employee) */}
      {selectedTaskForReport && (
        <TaskReportModal
          task={selectedTaskForReport}
          onClose={() => setSelectedTaskForReport(null)}
          onSubmitReport={handleSubmitTaskReport}
        />
      )}

      {/* RENDER MODAL: REVIEW TASK REPORT (By admin) */}
      {selectedReportForReview && (
        <AdminReportReviewModal
          report={selectedReportForReview}
          onClose={() => setSelectedReportForReview(null)}
          onApprove={handleApproveReport}
          onReject={handleRejectReport}
        />
      )}

      {/* RENDER MODAL: EXPLAIN REJECT REASON & RE-SUBMIT WITH FILES */}
      {selectedTaskForRejectionExplanation && (
        <div id="rejection-explanation-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white/85 border border-white/50 shadow-2xl rounded-[24px] overflow-hidden backdrop-blur-2xl animate-enter">
            <div className="flex items-center justify-between p-5 border-b border-white/40">
              <h2 className="text-xs font-bold text-slate-800">مراجعة التعديلات وتوقيت التوضيح روتينيًا</h2>
              <button onClick={() => setSelectedTaskForRejectionExplanation(null)} className="p-1 rounded-lg border hover:bg-slate-50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMemberSubmitRejectionExplanation} className="p-5 flex flex-col gap-4 text-right">
              <div className="p-3 bg-red-500/5 rounded-2xl text-[11px] text-red-800 leading-relaxed font-semibold">
                يرجى كتابة المبررات، أو ما تم تنفيذه لمعالجة ملاحظات الأدمن، كما يمكنك إرفاق وتصديق مستندات توضيحية.
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-700">
                <span>توضيح و تعليق الموظف حول التعديل الملتزم *</span>
                <textarea
                  required
                  rows={4}
                  value={rejectionExpText}
                  onChange={(e) => setRejectionExpText(e.target.value)}
                  placeholder="مثال: تم مراجعة نظام التصميم، وتغيير درجات الألوان لتعتمد التدرج الزجاجي الشفاف مع ملحق توضيحي لنموذج الواجهة المعتمد..."
                  className="p-3 bg-white/50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </label>

              <div className="flex gap-2">
                <button
                  type="submit"
                  id="rejection-submit-btn"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
                >
                  تسليم التعديلات الفورية للمراجعة
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTaskForRejectionExplanation(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-600"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
