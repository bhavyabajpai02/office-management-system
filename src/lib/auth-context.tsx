import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUsers } from "@/lib/demo-workflows";

export type AppRole = "employee" | "manager" | "admin";

export interface AppProfile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  job_title: string | null;
  manager_id: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: AppProfile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const DEMO_AUTH_KEY = "momentum-demo-auth";

type DemoAuthSession = {
  role: AppRole;
  profile: AppProfile;
};

function demoSessionForRole(role: AppRole): DemoAuthSession {
  const demoUser =
    getDemoUsers().find((user) => user.role === role) ??
    getDemoUsers().find((user) => user.role === "employee")!;
  return {
    role,
    profile: {
      id: demoUser.id,
      full_name: demoUser.full_name,
      email: demoUser.email,
      department: demoUser.department,
      job_title: demoUser.job_title,
      manager_id: demoUser.manager_id,
      avatar_url: null,
    },
  };
}

function readDemoSession(): DemoAuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DemoAuthSession;
  } catch {
    window.localStorage.removeItem(DEMO_AUTH_KEY);
    return null;
  }
}

export function startDemoSession(role: AppRole) {
  if (typeof window === "undefined") return;
  const session = demoSessionForRole(role);
  window.localStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(session));
  window.dispatchEvent(new CustomEvent("momentum-demo-auth", { detail: session }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const applyDemoSession = (demo: DemoAuthSession | null) => {
    if (!demo) return false;
    setSession(null);
    setProfile(demo.profile);
    setRole(demo.role);
    setUser({
      id: demo.profile.id,
      email: demo.profile.email,
      user_metadata: { full_name: demo.profile.full_name, role: demo.role },
      app_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as User);
    return true;
  };

  const loadProfile = async (uid: string) => {
    const demo = readDemoSession();
    if (demo?.profile.id === uid) {
      applyDemoSession(demo);
      return;
    }
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    const roles = (roleData ?? []).map((r) => r.role as AppRole);
    const primary: AppRole | null = roles.includes("admin")
      ? "admin"
      : roles.includes("manager")
        ? "manager"
        : roles.includes("employee")
          ? "employee"
          : null;
    if (!profileData || !primary) {
      const fallbackRole = (
        (profileData as AppProfile | null)?.email?.includes("admin")
          ? "admin"
          : (profileData as AppProfile | null)?.email?.includes("manager")
            ? "manager"
            : null
      ) as AppRole | null;
      const fallback = fallbackRole ? demoSessionForRole(fallbackRole) : null;
      if (fallback) {
        setProfile(fallback.profile);
        setRole(fallback.role);
        return;
      }
    }
    setProfile(profileData as AppProfile | null);
    setRole(primary);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Defer to avoid deadlock on auth callback
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        if (!applyDemoSession(readDemoSession())) {
          setProfile(null);
          setRole(null);
        }
      }
    });

    const onDemoAuth = (event: Event) => {
      applyDemoSession((event as CustomEvent<DemoAuthSession>).detail);
      setLoading(false);
    };
    window.addEventListener("momentum-demo-auth", onDemoAuth);

    const existingDemo = readDemoSession();
    if (existingDemo) {
      applyDemoSession(existingDemo);
      setLoading(false);
    } else {
      supabase.auth
        .getSession()
        .then(({ data: { session: s } }) => {
          setSession(s);
          setUser(s?.user ?? null);
          if (s?.user) {
            loadProfile(s.user.id).finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch(() => {
          if (!applyDemoSession(readDemoSession())) setLoading(false);
        });
    }

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("momentum-demo-auth", onDemoAuth);
    };
  }, []);

  const signOut = async () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(DEMO_AUTH_KEY);
    await supabase.auth.signOut().catch(() => undefined);
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const refresh = async () => {
    const demo = readDemoSession();
    if (demo) applyDemoSession(demo);
    else if (user) await loadProfile(user.id);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, role, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function roleDashboardPath(role: AppRole | null): string {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/employee";
}
