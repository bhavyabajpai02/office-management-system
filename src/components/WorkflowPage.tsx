import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  FileText,
  LockKeyhole,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { demoTeamAnalytics, demoTeamPerformance } from "@/lib/data-services";
import {
  getDemoPermissions,
  getEnterpriseSnapshot,
  updateDemoPermission,
  type DemoPermissionRole,
} from "@/lib/demo-workflows";

type WorkflowKind =
  | "employee-create-goal"
  | "employee-goal-details"
  | "employee-activity"
  | "employee-insights"
  | "employee-calendar"
  | "settings"
  | "manager-analytics"
  | "manager-performance"
  | "manager-activity"
  | "manager-reports"
  | "admin-reports"
  | "admin-compliance"
  | "admin-activity"
  | "admin-security";

export function WorkflowPage({ kind }: { kind: WorkflowKind }) {
  if (kind === "employee-create-goal") return <CreateGoalPage />;
  if (kind === "settings") return <GlobalSettingsPage />;
  if (kind === "manager-analytics") return <AnalyticsWorkflow role="manager" />;
  if (kind === "manager-performance") return <TeamPerformancePage />;
  if (kind === "manager-activity") return <ActivityTimelinePage role="manager" />;
  if (kind === "manager-reports") return <ReportsPage role="manager" />;
  if (kind === "admin-reports") return <ReportsPage role="admin" />;
  if (kind === "admin-compliance") return <CompliancePage />;
  if (kind === "admin-activity") return <ActivityTimelinePage role="admin" />;
  if (kind === "admin-security") return <SecurityPage />;

  const meta = simplePages[kind];
  return (
    <div>
      <PageHeader
        title={meta.title}
        description={meta.description}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/ai">
                <Sparkles className="mr-1.5 h-4 w-4" /> Ask Copilot
              </Link>
            </Button>
            <Button onClick={() => toast.success(`${meta.title} refreshed`)}>
              <Activity className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {meta.stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} icon={stat.icon} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title={meta.primaryTitle} description={meta.primaryDescription}>
          <div className="space-y-3">
            {meta.rows.map((row) => (
              <div key={row.title} className="rounded-lg border bg-muted/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{row.title}</div>
                  <Badge variant={row.badge === "At risk" ? "outline" : "secondary"}>{row.badge}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.body}</p>
                <Progress value={row.progress} className="mt-3 h-2" />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Recommended actions">
          <div className="space-y-3">
            {meta.actions.map((action) => (
              <button
                key={action}
                onClick={() => toast.success(action)}
                className="w-full rounded-lg border bg-card p-3 text-left text-sm transition hover:bg-muted/40"
              >
                <div className="font-medium">{action}</div>
                <div className="mt-1 text-muted-foreground">Action recorded in the workspace activity stream.</div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function CreateGoalPage() {
  return (
    <div>
      <PageHeader
        title="Create Goal"
        description="Build a SMART, measurable goal with milestones, visibility, dependencies, and AI assistance."
        actions={
          <Button asChild variant="outline">
            <Link to="/ai">
              <Sparkles className="mr-1.5 h-4 w-4" /> AI suggest goal
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Goal details" description="Required fields are validated before submission.">
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label>Goal title</Label>
              <Input placeholder="Reduce enterprise onboarding cycle time by 20%" />
            </div>
            <div className="grid gap-1.5">
              <Label>Goal description</Label>
              <Textarea rows={4} placeholder="Describe the business outcome, target audience, and success criteria." />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FieldSelect label="Goal category" values={["Customer Experience", "Operational Excellence", "Revenue Growth"]} />
              <FieldSelect label="Priority level" values={["High", "Medium", "Low"]} />
              <FieldSelect label="Visibility" values={["Private", "Manager visible", "Department shared"]} />
              <InputBlock label="Quarterly target" placeholder="100" />
              <InputBlock label="KPI / Metrics" placeholder="Cycle time, quality score, adoption" />
              <InputBlock label="Due date" type="date" />
              <FieldSelect label="Team / department" values={["Engineering", "Customer Success", "People Ops"]} />
              <FieldSelect label="Progress tracking" values={["Percentage", "Numeric KPI", "Milestone-based"]} />
              <InputBlock label="Tags / labels" placeholder="Q2, onboarding, customer" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <InputBlock label="Dependencies" placeholder="Data team dashboard, manager approval" />
              <InputBlock label="Attachments" placeholder="Placeholder for documents or links" />
            </div>
            <div className="grid gap-1.5">
              <Label>Milestones</Label>
              <Textarea rows={4} placeholder="Q1 baseline, Q2 pilot, Q3 rollout, Q4 adoption review" />
            </div>
            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => toast.success("Goal draft saved")}>
                Save Draft
              </Button>
              <Button onClick={() => toast.success("Goal submitted for manager review")}>
                Submit Goal
              </Button>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="SMART guidance">
          <div className="space-y-3 text-sm">
            {[
              ["Specific", "Name the outcome and audience clearly."],
              ["Measurable", "Include a baseline, target, and source of truth."],
              ["Achievable", "Keep the target ambitious but defensible."],
              ["Relevant", "Tie the goal to a team or business priority."],
              ["Time-bound", "Set due dates and milestone review points."],
            ].map(([label, body]) => (
              <div key={label} className="rounded-lg border bg-muted/25 p-3">
                <div className="font-medium">{label}</div>
                <p className="mt-1 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function AnalyticsWorkflow({ role }: { role: "manager" | "admin" }) {
  return (
    <div>
      <PageHeader
        title={role === "manager" ? "Team Analytics" : "Department Reports"}
        description="Completion trends, delayed goals, KPI performance, check-in coverage, and AI insights."
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Timeframe updated")}>Q2 FY26</Button>
            <Button onClick={() => toast.success("Analytics exported")}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
          </>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Avg. performance" value="82%" icon={<BarChart3 className="h-4 w-4" />} />
        <StatCard label="Check-in completion" value="91%" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Delayed goals" value="7" icon={<Target className="h-4 w-4" />} />
        <StatCard label="Approval turnaround" value="1.8d" icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="Engagement" value="88%" icon={<Users className="h-4 w-4" />} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Completion trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoTeamAnalytics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }} />
                <Line type="monotone" dataKey="progress" stroke="var(--accent)" strokeWidth={3} />
                <Line type="monotone" dataKey="checkins" stroke="var(--success)" strokeWidth={2} />
                <Line type="monotone" dataKey="approvals" stroke="var(--warning)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="KPI performance">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demoTeamPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }} />
                <Bar dataKey="progress" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="AI insights summary" className="xl:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              "Two employees need blocker review before Friday.",
              "Approval turnaround improved by 18% over four weeks.",
              "Shared goals are outperforming individual draft goals by 9 points.",
            ].map((item) => (
              <div key={item} className="rounded-lg border bg-muted/25 p-4 text-sm leading-6">
                <Sparkles className="mb-3 h-4 w-4 text-accent" />
                {item}
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function TeamPerformancePage() {
  return <WorkflowPage kind="manager-activity" />;
}

function ReportsPage({ role }: { role: "manager" | "admin" }) {
  const snapshot = getEnterpriseSnapshot();
  const reports =
    role === "admin"
      ? [
          ["Goal health report", `${snapshot.kpis.goals} active goals across ${snapshot.departmentData.length} departments`],
          ["Check-in completion report", `${snapshot.kpis.checkInCoverage}% organization check-in coverage`],
          ["Approval SLA report", `${snapshot.kpis.submitted} sheets still awaiting manager action`],
          ["Escalation report", `${snapshot.kpis.openEscalations} open HR escalations`],
          ["Employee engagement report", `${snapshot.kpis.employees} employees in active workflow`],
          ["Audit-ready activity report", `${snapshot.activity.length} workflow events available`],
        ]
      : [
          ["Team goal health", `${snapshot.goals.length} employee goals in manager-visible workflow`],
          ["Check-in coaching report", `${snapshot.kpis.checkInCoverage}% check-in coverage for active goals`],
          ["Approval queue report", `${snapshot.kpis.submitted} pending submitted goals`],
          ["Shared goals report", `${snapshot.goals.filter((goal) => goal.is_shared).length} shared goals`],
          ["At-risk employees", `${snapshot.escalations.filter((item) => item.status !== "resolved").length} active signals`],
          ["Team activity export", `${snapshot.activity.filter((item) => item.role !== "admin").length} team events`],
        ];
  return (
    <div>
      <PageHeader
        title={role === "admin" ? "Team / Department Reports" : "Reports & Exports"}
        description="Generate CSV-ready reports for goals, check-ins, approvals, and audit activity."
        actions={<Button onClick={() => toast.success("Report export prepared")}><Download className="mr-1.5 h-4 w-4" /> Export report</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map(([report, summary]) => (
          <button key={report} onClick={() => toast.success(`${report} queued`)} className="rounded-lg border bg-card p-5 text-left transition hover:bg-muted/40">
            <FileText className="mb-4 h-5 w-5 text-accent" />
            <div className="font-medium">{report}</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}. Includes filters, owner context, timestamps, and export metadata.</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function GlobalSettingsPage() {
  const save = () => toast.success("Settings saved");
  return (
    <div>
      <PageHeader title="Settings" description="Profile, theme, notifications, security, privacy, AI, email, and dashboard preferences." />
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap justify-start">
          {["profile", "theme", "notifications", "security", "privacy", "dashboard", "ai", "email"].map((tab) => (
            <TabsTrigger key={tab} value={tab} className="capitalize">{tab}</TabsTrigger>
          ))}
        </TabsList>
        {["profile", "theme", "notifications", "security", "privacy", "dashboard", "ai", "email"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <SectionCard title={`${tab[0].toUpperCase()}${tab.slice(1)} preferences`}>
              <div className="grid gap-4 md:grid-cols-2">
                <InputBlock label="Display name" placeholder="Momentum user" />
                <FieldSelect label="Default workspace" values={["Dashboard", "My Goals", "AI Copilot"]} />
                <ToggleRow label="Email updates" />
                <ToggleRow label="Productivity nudges" />
                <ToggleRow label="AI-assisted summaries" />
                <ToggleRow label="Remember dashboard filters" />
              </div>
              <Button className="mt-4" onClick={save}><Settings className="mr-1.5 h-4 w-4" /> Save settings</Button>
            </SectionCard>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function CompliancePage() {
  const snapshot = getEnterpriseSnapshot();
  const openEscalations = snapshot.escalations.filter((item) => item.status !== "resolved").length;
  const auditCoverage = Math.min(100, Math.max(72, snapshot.activity.length * 8));
  return (
    <div>
      <PageHeader
        title="Compliance Center"
        description="Policy review, compliance alerts, audit summaries, health cards, and organization risk indicators."
        actions={<Button onClick={() => toast.success("Compliance evidence package prepared")}><Download className="mr-1.5 h-4 w-4" /> Export evidence</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Compliance health" value={`${Math.max(82, 96 - openEscalations * 4)}%`} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Open risks" value={openEscalations} icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="Audit coverage" value={`${auditCoverage}%`} icon={<FileText className="h-4 w-4" />} />
        <StatCard label="Policy SLA" value={`${snapshot.settings.approvalSlaDays}d`} icon={<CalendarClock className="h-4 w-4" />} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <SectionCard title="Policy review queue" description="Controls connected to workflow events and admin settings.">
          <div className="space-y-3">
            {[
              ["Manager approval SLA", `${snapshot.settings.approvalSlaDays} business days`, snapshot.kpis.submitted ? "Review" : "Healthy"],
              ["MFA for admins", snapshot.settings.mfaRequired ? "Required" : "Optional", snapshot.settings.mfaRequired ? "Healthy" : "Review"],
              ["AI summaries", snapshot.settings.aiSummaries ? "Enabled for workflow summaries" : "Disabled", "Healthy"],
              ["Audit retention", "36 months configured in admin settings", "Healthy"],
            ].map(([title, body, status]) => (
              <div key={title} className="rounded-lg border bg-muted/25 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium">{title}</div>
                  <Badge variant={status === "Healthy" ? "secondary" : "outline"}>{status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Risk indicators">
          <div className="space-y-3">
            {snapshot.escalations.slice(0, 4).map((item) => (
              <Link key={item.id} to="/admin/escalations" className="block rounded-lg border bg-card p-3 transition hover:bg-muted/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.id}</span>
                  <Badge variant={item.severity === "critical" ? "destructive" : "outline"}>{item.severity}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function SecurityPage() {
  const [permissions, setPermissions] = useState(getDemoPermissions());
  const permissionKeys = Object.keys(permissions[0]?.permissions ?? {});
  const togglePermission = (role: DemoPermissionRole["role"], key: string, enabled: boolean) => {
    updateDemoPermission(role, key, enabled);
    setPermissions(getDemoPermissions());
    toast.success(`${role} permission updated`);
  };
  return (
    <div>
      <PageHeader title="Security & Permissions" description="Manage roles, session policy, MFA posture, and permission review queues." />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <SectionCard title="Permission matrix" description="Role permissions are editable and generate audit + notification events.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-4 font-medium">Permission</th>
                  {permissions.map((role) => (
                    <th key={role.role} className="py-2 px-3 font-medium capitalize">{role.role}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionKeys.map((key) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">{key.replace(/_/g, " ")}</td>
                    {permissions.map((role) => (
                      <td key={`${role.role}-${key}`} className="px-3 py-3">
                        <Switch
                          checked={Boolean(role.permissions[key])}
                          onCheckedChange={(enabled) => togglePermission(role.role, key, enabled)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
        <SectionCard title="Session and security alerts">
          <div className="space-y-3">
            {[
              ["MFA enforcement", "Required for admins", true],
              ["Session timeout", "8 hour organization policy", true],
              ["Export monitoring", "Admin exports are audit logged", true],
              ["Permission drift", "No unreviewed changes", false],
            ].map(([title, body, healthy]) => (
              <div key={title as string} className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{title as string}</div>
                  <Badge variant={healthy ? "secondary" : "outline"}>{healthy ? "Healthy" : "Watch"}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{body as string}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function ActivityTimelinePage({ role }: { role: "manager" | "admin" }) {
  const snapshot = getEnterpriseSnapshot();
  const events = snapshot.activity.filter((item) =>
    role === "admin" ? true : item.role === "employee" || item.role === "manager" || item.role === "system",
  );
  return (
    <div>
      <PageHeader
        title={role === "admin" ? "Organization Activity" : "Activity Feed"}
        description={role === "admin" ? "Organization-wide timeline across employee, manager, admin, and system events." : "Manager-visible approvals, check-ins, blockers, shared goals, and team workflow events."}
        actions={<Button onClick={() => toast.success("Activity export prepared")}><Download className="mr-1.5 h-4 w-4" /> Export</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Events" value={events.length} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Approvals" value={events.filter((item) => item.action.toLowerCase().includes("approved")).length} icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Check-ins" value={events.filter((item) => item.entity === "check_in").length} icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="Escalations" value={snapshot.kpis.openEscalations} icon={<ShieldAlert className="h-4 w-4" />} />
      </div>
      <SectionCard title="Workflow timeline" description="Every action here is generated by the shared workflow engine.">
        <ol className="relative ml-2 space-y-4 border-l pl-6">
          {events.slice(0, 40).map((event) => (
            <li key={event.id} className="relative">
              <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{event.action}</span>
                <Badge variant="outline">{event.role ?? "system"}</Badge>
                {event.entity && <Badge variant="secondary">{event.entity}</Badge>}
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{event.actor} - {event.detail}</p>
              <div className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}

function FieldSelect({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Select defaultValue={values[0]}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{values.map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function InputBlock({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} />
    </div>
  );
}

function ToggleRow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/25 p-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch defaultChecked />
    </div>
  );
}

const simplePages: Record<Exclude<WorkflowKind, "employee-create-goal" | "settings" | "manager-analytics" | "manager-performance" | "manager-reports" | "admin-reports" | "admin-compliance" | "admin-security">, {
  title: string;
  description: string;
  primaryTitle: string;
  primaryDescription: string;
  stats: Array<{ label: string; value: string | number; hint?: string; icon: React.ReactNode }>;
  rows: Array<{ title: string; body: string; badge: string; progress: number }>;
  actions: string[];
}> = {
  "employee-goal-details": {
    title: "Goal Details",
    description: "Review goal structure, KPI health, milestones, dependencies, and progress history.",
    primaryTitle: "Active goal detail",
    primaryDescription: "A realistic detail workspace for reviewing or preparing a goal update.",
    stats: [
      { label: "Progress", value: "76%", icon: <Target className="h-4 w-4" /> },
      { label: "Milestones", value: "3/4", icon: <CheckCircle2 className="h-4 w-4" /> },
      { label: "Dependencies", value: 2, icon: <Activity className="h-4 w-4" /> },
      { label: "Due", value: "18d", icon: <CalendarClock className="h-4 w-4" /> },
    ],
    rows: [
      { title: "KPI: response time improvement", body: "Actual is 76 against a quarterly target of 100.", badge: "On track", progress: 76 },
      { title: "Milestone: automation pilot", body: "Pilot is ready for manager review and department rollout.", badge: "Ready", progress: 88 },
    ],
    actions: ["Update progress", "Request manager feedback", "Open check-in form"],
  },
  "employee-activity": {
    title: "Activity History",
    description: "Your goal edits, check-ins, notifications, AI actions, and approval events in one timeline.",
    primaryTitle: "Recent activity",
    primaryDescription: "Demo-safe activity mirrors the enterprise audit model.",
    stats: [
      { label: "Events", value: 24, icon: <Activity className="h-4 w-4" /> },
      { label: "Goal edits", value: 8, icon: <Target className="h-4 w-4" /> },
      { label: "Check-ins", value: 5, icon: <CheckCircle2 className="h-4 w-4" /> },
      { label: "AI actions", value: 11, icon: <Sparkles className="h-4 w-4" /> },
    ],
    rows: [
      { title: "Q2 check-in submitted", body: "Self-review captured achievements, blockers, and support needed.", badge: "Complete", progress: 100 },
      { title: "Goal progress updated", body: "Response time goal moved from 64% to 76%.", badge: "Logged", progress: 76 },
    ],
    actions: ["Export activity", "Filter by check-ins", "Open audit view"],
  },
  "employee-insights": {
    title: "Performance Insights",
    description: "Personal progress, check-in quality, goal risk, and AI-suggested next actions.",
    primaryTitle: "Insight feed",
    primaryDescription: "Actionable signals for the next performance conversation.",
    stats: [
      { label: "Avg. progress", value: "82%", icon: <BarChart3 className="h-4 w-4" /> },
      { label: "At risk", value: 1, icon: <Target className="h-4 w-4" /> },
      { label: "Feedback", value: 4, icon: <FileText className="h-4 w-4" /> },
      { label: "Confidence", value: "High", icon: <Sparkles className="h-4 w-4" /> },
    ],
    rows: [
      { title: "Momentum is improving", body: "Three goals have positive week-over-week movement.", badge: "Positive", progress: 82 },
      { title: "One dependency needs attention", body: "Automation export format is blocking final rollout.", badge: "At risk", progress: 54 },
    ],
    actions: ["Ask Copilot for coaching", "Create recovery plan", "Share with manager"],
  },
  "employee-calendar": {
    title: "Calendar & Deadlines",
    description: "Upcoming goal deadlines, review cycles, check-ins, and approval windows.",
    primaryTitle: "Upcoming deadlines",
    primaryDescription: "Deadlines are grouped by urgency and workflow type.",
    stats: [
      { label: "This week", value: 3, icon: <CalendarClock className="h-4 w-4" /> },
      { label: "This month", value: 8, icon: <Target className="h-4 w-4" /> },
      { label: "Check-ins", value: 4, icon: <CheckCircle2 className="h-4 w-4" /> },
      { label: "Overdue", value: 0, icon: <Activity className="h-4 w-4" /> },
    ],
    rows: [
      { title: "Q2 self-review", body: "Complete achievements, blockers, support request, and rating.", badge: "Due soon", progress: 66 },
      { title: "Automation milestone", body: "Manager review before department rollout.", badge: "Scheduled", progress: 80 },
    ],
    actions: ["Add reminder", "Open check-ins", "Export calendar"],
  },
  "manager-activity": {
    title: "Activity Feed",
    description: "Manager-visible approvals, check-ins, blockers, shared goals, and team workflow events.",
    primaryTitle: "Team activity",
    primaryDescription: "A consolidated operating feed for weekly manager review.",
    stats: [
      { label: "Events", value: 48, icon: <Activity className="h-4 w-4" /> },
      { label: "Approvals", value: 7, icon: <CheckCircle2 className="h-4 w-4" /> },
      { label: "Blockers", value: 3, icon: <Target className="h-4 w-4" /> },
      { label: "Reports", value: 4, icon: <FileText className="h-4 w-4" /> },
    ],
    rows: [
      { title: "Alex submitted Q2 check-in", body: "Support requested for escalation category decision.", badge: "Needs review", progress: 78 },
      { title: "Shared goal updated", body: "Customer retention goal moved to 84% team progress.", badge: "On track", progress: 84 },
    ],
    actions: ["Send feedback", "Request update", "Export activity"],
  },
  "admin-activity": {
    title: "Organization Activity",
    description: "Enterprise activity across goal edits, approvals, exports, escalations, and compliance events.",
    primaryTitle: "Organization timeline",
    primaryDescription: "HR-grade activity view with workflow context and export behavior.",
    stats: [
      { label: "Events", value: 312, icon: <Activity className="h-4 w-4" /> },
      { label: "Sensitive", value: 9, icon: <ShieldCheck className="h-4 w-4" /> },
      { label: "Exports", value: 14, icon: <Download className="h-4 w-4" /> },
      { label: "Resolved", value: "96%", icon: <CheckCircle2 className="h-4 w-4" /> },
    ],
    rows: [
      { title: "Bulk approval export", body: "Admin exported Q2 approval SLA report.", badge: "Logged", progress: 100 },
      { title: "Escalation resolved", body: "People Ops closed a delayed check-in escalation.", badge: "Resolved", progress: 100 },
    ],
    actions: ["Export activity", "Open audit logs", "Review escalations"],
  },
};
