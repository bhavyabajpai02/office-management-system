import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Clock,
  Database,
  Download,
  Eye,
  KeyRound,
  Laptop,
  Loader2,
  LockKeyhole,
  Moon,
  Palette,
  Save,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getDemoOrgSettings, updateDemoOrgSettings } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin/settings")({
  component: SettingsPage,
});

type ThemePreference = "system" | "light" | "dark";

function SettingsPage() {
  const { profile, user, refresh, signOut } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [jobTitle, setJobTitle] = useState(profile?.job_title ?? "HR Administrator");
  const [department, setDepartment] = useState(profile?.department ?? "People Operations");

  const demoSettings = getDemoOrgSettings();
  const [orgName, setOrgName] = useState(demoSettings.orgName);
  const [cycle, setCycle] = useState(demoSettings.cycle);
  const [timezone, setTimezone] = useState(demoSettings.timezone);
  const [policyNotes, setPolicyNotes] = useState("Managers must review submitted goal sheets within two business days.");

  const [weeklyDigest, setWeeklyDigest] = useState(demoSettings.weeklyDigest);
  const [approvalAlerts, setApprovalAlerts] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [auditAlerts, setAuditAlerts] = useState(false);

  const [theme, setTheme] = useState<ThemePreference>(() => (localStorage.getItem("momentum-theme") as ThemePreference) || "system");
  const [mfaRequired, setMfaRequired] = useState(demoSettings.mfaRequired);
  const [sessionTimeout, setSessionTimeout] = useState("8");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [auditRetention, setAuditRetention] = useState("36");
  const [exportFormat, setExportFormat] = useState("json");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setJobTitle(profile?.job_title ?? "HR Administrator");
    setDepartment(profile?.department ?? "People Operations");
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("momentum-theme", theme);
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    if (theme === "light") root.classList.remove("dark");
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [theme]);

  const runSave = async (key: string, action: () => Promise<void> | void) => {
    try {
      setSaving(key);
      await action();
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(null);
    }
  };

  const saveProfile = () =>
    runSave("profile", async () => {
      if (!fullName.trim()) throw new Error("Full name is required");
      if (!user) throw new Error("You must be signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          job_title: jobTitle.trim(),
          department: department.trim(),
        })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
    });

  const updatePassword = () =>
    runSave("password", async () => {
      if (password.length < 8) throw new Error("Password must be at least 8 characters");
      if (password !== confirmPassword) throw new Error("Passwords do not match");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmPassword("");
    });

  const exportSettings = () => {
    const payload = {
      orgName,
      cycle,
      timezone,
      notifications: { weeklyDigest, approvalAlerts, riskAlerts, auditAlerts },
      security: { mfaRequired, sessionTimeout },
      audit: { auditRetention },
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: exportFormat === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `momentum-settings-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Settings export started");
  };

  return (
    <div>
      <PageHeader
        title="Enterprise Settings"
        description="Configure profile, organization policy, security, notifications, audit retention, and exports."
        actions={<Badge variant="secondary">Admin controls</Badge>}
      />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit & Data</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <SectionCard title="Profile settings" description="Keep your admin identity current for audit logs and approvals.">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input id="full-name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor="job-title">Job title</Label>
                    <Input id="job-title" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" value={department} onChange={(event) => setDepartment(event.target.value)} />
                  </div>
                </div>
                <Button className="w-fit" onClick={saveProfile} disabled={saving === "profile"}>
                  {saving === "profile" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                  Save profile
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Role permissions view">
              <div className="space-y-3">
                {[
                  ["Employee", "Create goals, submit check-ins, use AI Copilot"],
                  ["Manager", "Approve goal sheets, assign shared goals, review team progress"],
                  ["Admin", "Manage users, audit logs, settings, analytics, escalations"],
                ].map(([role, scope]) => (
                  <div key={role} className="rounded-lg border bg-muted/25 p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <UserCog className="h-4 w-4 text-accent" /> {role}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{scope}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          <SectionCard title="Organization settings" description="Demo-ready policy controls used across workflow messaging.">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" value={orgName} onChange={(event) => setOrgName(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="cycle">Active cycle</Label>
                <Input id="cycle" value={cycle} onChange={(event) => setCycle(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Calcutta">Asia/Calcutta</SelectItem>
                    <SelectItem value="America/New_York">America/New_York</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5 lg:col-span-3">
                <Label htmlFor="policy">Approval policy note</Label>
                <Textarea id="policy" rows={4} value={policyNotes} onChange={(event) => setPolicyNotes(event.target.value)} />
              </div>
            </div>
            <Button className="mt-4" onClick={() => runSave("org", () => {
              localStorage.setItem("momentum-org-settings", JSON.stringify({ orgName, cycle, timezone, policyNotes }));
              updateDemoOrgSettings({ orgName, cycle, timezone });
            })} disabled={saving === "org"}>
              {saving === "org" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Building2 className="mr-1.5 h-4 w-4" />}
              Save organization
            </Button>
          </SectionCard>

          <SectionCard title="Theme preferences" description="Switch the presentation between light, dark, or system mode.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["system", Laptop, "System"],
                ["light", Sun, "Light"],
                ["dark", Moon, "Dark"],
              ].map(([value, Icon, label]) => (
                <button
                  key={value as string}
                  onClick={() => setTheme(value as ThemePreference)}
                  className={`rounded-lg border p-4 text-left transition hover:bg-muted/50 ${
                    theme === value ? "border-accent bg-accent/10" : "bg-background"
                  }`}
                >
                  <Icon className="mb-3 h-5 w-5 text-accent" />
                  <div className="font-medium">{label as string}</div>
                </button>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <SectionCard title="Notification preferences" description="Control which workflow events create admin alerts.">
            <div className="grid gap-3 md:grid-cols-2">
              <SettingToggle icon={<Bell className="h-4 w-4" />} label="Weekly executive digest" description="Summarize adoption, delayed goals, and approvals every Monday." checked={weeklyDigest} onCheckedChange={setWeeklyDigest} />
              <SettingToggle icon={<ClipboardIcon />} label="Approval SLA alerts" description="Notify admins when manager reviews exceed policy." checked={approvalAlerts} onCheckedChange={setApprovalAlerts} />
              <SettingToggle icon={<Clock className="h-4 w-4" />} label="Risk and overdue alerts" description="Highlight delayed goals and missed check-ins." checked={riskAlerts} onCheckedChange={setRiskAlerts} />
              <SettingToggle icon={<Eye className="h-4 w-4" />} label="Audit anomaly alerts" description="Surface sensitive workflow changes for HR review." checked={auditAlerts} onCheckedChange={setAuditAlerts} />
            </div>
            <Button className="mt-4" onClick={() => runSave("notifications", () => {
              localStorage.setItem("momentum-notifications", JSON.stringify({ weeklyDigest, approvalAlerts, riskAlerts, auditAlerts }));
              updateDemoOrgSettings({ weeklyDigest });
            })} disabled={saving === "notifications"}>
              {saving === "notifications" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Bell className="mr-1.5 h-4 w-4" />}
              Save preferences
            </Button>
          </SectionCard>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Security settings" description="Configure authentication expectations for the organization.">
              <div className="space-y-4">
                <SettingToggle icon={<ShieldCheck className="h-4 w-4" />} label="Require MFA for admins" description="Recommended for production HR and audit access." checked={mfaRequired} onCheckedChange={setMfaRequired} />
                <div className="grid gap-1.5">
                  <Label>Session timeout</Label>
                  <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 hours</SelectItem>
                      <SelectItem value="8">8 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => runSave("security", () => {
                  localStorage.setItem("momentum-security", JSON.stringify({ mfaRequired, sessionTimeout }));
                  updateDemoOrgSettings({ mfaRequired });
                })} disabled={saving === "security"}>
                  {saving === "security" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-1.5 h-4 w-4" />}
                  Save security
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Password update" description="Change your account password.">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="new-password">New password</Label>
                  <Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                </div>
                <Button onClick={updatePassword} disabled={saving === "password"}>
                  {saving === "password" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1.5 h-4 w-4" />}
                  Update password
                </Button>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Audit preferences" description="Control retention and export defaults.">
              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <Label>Audit retention</Label>
                  <Select value={auditRetention} onValueChange={setAuditRetention}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => runSave("audit", () => localStorage.setItem("momentum-audit", JSON.stringify({ auditRetention })))} disabled={saving === "audit"}>
                  {saving === "audit" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Settings className="mr-1.5 h-4 w-4" />}
                  Save audit policy
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Data export options" description="Download the current configuration snapshot.">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Export format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={exportSettings}>
                  <Download className="mr-1.5 h-4 w-4" /> Export settings
                </Button>
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SectionCard title="Session management" description="Review current session posture and sign out when needed.">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusTile icon={<Database className="h-4 w-4" />} label="Session provider" value="Supabase Auth" />
              <StatusTile icon={<Palette className="h-4 w-4" />} label="Theme mode" value={theme} />
              <StatusTile icon={<Clock className="h-4 w-4" />} label="Timeout" value={`${sessionTimeout} hours`} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => toast.success("Current session refreshed")}>
                Refresh session
              </Button>
              <Button variant="destructive" onClick={() => signOut()}>
                Sign out current session
              </Button>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingToggle({
  icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-card p-4">
      <div className="flex gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground">{icon}</div>
        <div>
          <div className="font-medium">{label}</div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function StatusTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-4">
      <div className="mb-3 text-accent">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium capitalize">{value}</div>
    </div>
  );
}

function ClipboardIcon() {
  return <Settings className="h-4 w-4" />;
}
