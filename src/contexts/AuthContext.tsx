import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import client from "../api/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  role: "admin" | "member";
  status: "active" | "pending";
  specialty: string;
  workload: number;
  overallRating?: number;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("crm_token");
    const savedUser = localStorage.getItem("crm_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("crm_token");
        localStorage.removeItem("crm_user");
      }
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { data } = await client.post("/auth/google", { credential });
    localStorage.setItem("crm_token", data.token);
    localStorage.setItem("crm_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
