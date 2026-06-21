import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainLayout from "./components/MainLayout";
import LoginPage from "./pages/LoginPage";
import PendingApproval from "./pages/PendingApproval";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import TeamPage from "./pages/TeamPage";
import CampaignsPage from "./pages/CampaignsPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";

import React from "react";

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.status === "pending") return <Navigate to="/pending" replace />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/tasks" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>;
  if (user && user.status === "active") return <Navigate to={user.role === "admin" ? "/" : "/tasks"} replace />;
  if (user && user.status === "pending") return <Navigate to="/pending" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/pending" element={<ProtectedRoute><PendingApproval /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<ProtectedRoute requireAdmin><Dashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/team" element={<ProtectedRoute requireAdmin><TeamPage /></ProtectedRoute>} />
            <Route path="/campaigns" element={<ProtectedRoute requireAdmin><CampaignsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute requireAdmin><ReportsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
