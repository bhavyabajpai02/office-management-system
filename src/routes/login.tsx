import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Loader2,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  roleDashboardPath,
  startDemoSession,
  type AppRole,
  useAuth,
} from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const DEMO_USERS: Record<
  AppRole,
  { email: string; password: string; name: string }
> = {
  employee: {
    email: "alex.employee@momentum.ai",
    password: "Demo!2345",
    name: "Alex Morgan",
  },
  manager: {
    email: "sam.manager@momentum.ai",
    password: "Demo!2345",
    name: "Sam Carter",
  },
  admin: {
    email: "jordan.admin@momentum.ai",
    password: "Demo!2345",
    name: "Jordan Lee",
  },
};

function LoginPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState<AppRole>("employee");
  const [signupDept, setSignupDept] = useState("Engineering");

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: roleDashboardPath(role) });
    }
  }, [loading, user, role, navigate]);

  const doLogin = async (email: string, password: string) => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    toast.success("Welcome back to Momentum AI");
    return true;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await doLogin(loginEmail, loginPassword);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (signupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setBusy(true);
    const redirectTo =
      typeof window !== "undefined" ? window.location.origin : undefined;
    const { error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          full_name: signupName,
          role: signupRole,
          department: signupDept,
          job_title:
            signupRole === "admin"
              ? "HR Administrator"
              : signupRole === "manager"
                ? "Team Lead"
                : "Associate",
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Momentum AI account created. You can sign in now.");
  };

  const handleDemo = async (demoRole: AppRole) => {
    const demoUser = DEMO_USERS[demoRole];
    const enterFallbackDemo = () => {
      startDemoSession(demoRole);
      toast.success(`Opened ${demoRole === "admin" ? "HR/Admin" : demoRole} demo workspace`);
      navigate({ to: roleDashboardPath(demoRole) });
    };
    setBusy(true);
    let { error } = await supabase.auth.signInWithPassword({
      email: demoUser.email,
      password: demoUser.password,
    });

    if (error) {
      const { error: signupErr } = await supabase.auth.signUp({
        email: demoUser.email,
        password: demoUser.password,
        options: {
          data: {
            full_name: demoUser.name,
            role: demoRole,
            department:
              demoRole === "admin" ? "People Operations" : "Engineering",
            job_title:
              demoRole === "admin"
                ? "HR Administrator"
                : demoRole === "manager"
                  ? "Engineering Manager"
                  : "Software Engineer",
          },
        },
      });
      if (signupErr) {
        setBusy(false);
        enterFallbackDemo();
        return;
      }
      const retry = await supabase.auth.signInWithPassword({
        email: demoUser.email,
        password: demoUser.password,
      });
      error = retry.error;
    }

    setBusy(false);
    if (error) enterFallbackDemo();
    else toast.success(`Signed in as ${demoUser.name}`);
  };

  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.04fr_0.96fr]">
      <div className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(14,165,233,0.2),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(135deg,rgba(15,23,42,1),rgba(17,24,39,0.94))]" />
        <div className="relative flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-950">
            <PanelsTopLeft className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-tight">
              Momentum AI
            </span>
            <span className="text-xs text-slate-400">Enterprise Workflow OS</span>
          </div>
        </div>

        <div className="relative max-w-xl space-y-7">
          <div className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-300 backdrop-blur">
            AI-powered performance operations
          </div>
          <h1 className="text-5xl font-semibold tracking-tight">
            Run goals, approvals, audits, and insights from one premium
            workspace.
          </h1>
          <p className="text-base leading-8 text-slate-300">
            Momentum AI helps employees, managers, and HR teams move from
            quarterly intent to measurable outcomes with polished workflows and
            executive-ready analytics.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Target className="h-4 w-4" />} label="Goal OS" />
            <Stat icon={<Users className="h-4 w-4" />} label="Team Ops" />
            <Stat icon={<ShieldCheck className="h-4 w-4" />} label="Audit Ready" />
          </div>
        </div>

        <div className="relative rounded-xl border border-white/10 bg-white/[0.06] p-4 text-xs text-slate-400 backdrop-blur">
          Momentum AI Enterprise Edition. Built for demo-ready workflow
          operations.
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <PanelsTopLeft className="h-5 w-5" />
            </div>
            <span className="font-semibold tracking-tight">Momentum AI</span>
          </Link>

          <Card className="border-border/70 bg-card/95 shadow-xl">
            <CardHeader>
              <CardTitle>Sign in to Momentum AI</CardTitle>
              <CardDescription>
                Use your workspace credentials or launch a role-based demo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Create account</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4 pt-4">
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">Work email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={loginPassword}
                        onChange={(event) =>
                          setLoginPassword(event.target.value)
                        }
                      />
                    </div>
                    <Button type="submit" disabled={busy} className="w-full">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-3 pt-4">
                  <form onSubmit={handleSignup} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="su-name">Full name</Label>
                      <Input
                        id="su-name"
                        required
                        value={signupName}
                        onChange={(event) => setSignupName(event.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="su-role">Role</Label>
                        <Select
                          value={signupRole}
                          onValueChange={(value) =>
                            setSignupRole(value as AppRole)
                          }
                        >
                          <SelectTrigger id="su-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">HR / Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="su-dept">Department</Label>
                        <Input
                          id="su-dept"
                          value={signupDept}
                          onChange={(event) =>
                            setSignupDept(event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-email">Work email</Label>
                      <Input
                        id="su-email"
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(event) => setSignupEmail(event.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="su-password">Password</Label>
                      <Input
                        id="su-password"
                        type="password"
                        required
                        minLength={8}
                        value={signupPassword}
                        onChange={(event) =>
                          setSignupPassword(event.target.value)
                        }
                      />
                    </div>
                    <Button type="submit" disabled={busy} className="w-full">
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-dashed border-border/70 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Explore a live demo</CardTitle>
              <CardDescription>
                Open a polished employee, manager, or admin workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2">
              {(["employee", "manager", "admin"] as AppRole[]).map(
                (demoRole) => (
                  <Button
                    key={demoRole}
                    variant="outline"
                    disabled={busy}
                    onClick={() => handleDemo(demoRole)}
                    className="capitalize"
                  >
                    {demoRole}
                  </Button>
                ),
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> AI copilot
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Audit logs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3 backdrop-blur">
      <div className="text-sky-300">{icon}</div>
      <div className="mt-2 text-xs text-slate-300">{label}</div>
    </div>
  );
}
