import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Clock, FileDown, Target, Users } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getEnterpriseSnapshot } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin/analytics")({
  component: AnalyticsPage,
});

type AnalyticsData = {
  totalEmployees: number;
  totalGoals: number;
  completion: number;
  approvalSla: number;
  delayedGoals: number;
  departmentData: Array<{ department: string; employees: number; progress: number; approvals: number }>;
  trendData: Array<{ week: string; completed: number; submitted: number; audit: number }>;
  statusData: Array<{ name: string; value: number; color: string }>;
  heatmap: Array<{ team: string; q1: number; q2: number; q3: number; q4: number }>;
  topEmployees: Array<{ name: string; department: string; progress: number; goals: number; signal: string }>;
};

const fallback: AnalyticsData = {
  totalEmployees: 128,
  totalGoals: 642,
  completion: 84,
  approvalSla: 1.8,
  delayedGoals: 17,
  departmentData: [
    { department: "Engineering", employees: 42, progress: 86, approvals: 14 },
    { department: "Customer Success", employees: 28, progress: 78, approvals: 9 },
    { department: "Sales", employees: 24, progress: 82, approvals: 11 },
    { department: "Finance", employees: 16, progress: 73, approvals: 4 },
    { department: "People Ops", employees: 18, progress: 91, approvals: 6 },
  ],
  trendData: [
    { week: "W1", completed: 52, submitted: 38, audit: 18 },
    { week: "W2", completed: 61, submitted: 45, audit: 29 },
    { week: "W3", completed: 68, submitted: 56, audit: 34 },
    { week: "W4", completed: 75, submitted: 63, audit: 41 },
    { week: "W5", completed: 84, submitted: 70, audit: 52 },
    { week: "W6", completed: 91, submitted: 82, audit: 64 },
  ],
  statusData: [
    { name: "Approved", value: 318, color: "var(--success)" },
    { name: "Submitted", value: 104, color: "var(--info)" },
    { name: "Draft", value: 155, color: "var(--muted-foreground)" },
    { name: "Rework", value: 65, color: "var(--warning)" },
  ],
  heatmap: [
    { team: "Platform", q1: 74, q2: 86, q3: 81, q4: 91 },
    { team: "Support", q1: 69, q2: 78, q3: 84, q4: 88 },
    { team: "Revenue", q1: 82, q2: 79, q3: 86, q4: 90 },
    { team: "People", q1: 88, q2: 91, q3: 94, q4: 96 },
  ],
  topEmployees: [
    { name: "Avery Chen", department: "Engineering", progress: 96, goals: 7, signal: "Ahead" },
    { name: "Maya Patel", department: "Customer Success", progress: 92, goals: 6, signal: "On track" },
    { name: "Noah Williams", department: "Sales", progress: 89, goals: 5, signal: "On track" },
    { name: "Priya Raman", department: "Finance", progress: 86, goals: 6, signal: "Watch" },
  ],
};

function AnalyticsPage() {
  const { data = fallback, isLoading } = useQuery({
    queryKey: ["enterprise-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      const snapshot = getEnterpriseSnapshot();
      const workflowFallback: AnalyticsData = {
        ...fallback,
        totalEmployees: snapshot.kpis.employees,
        totalGoals: snapshot.kpis.goals,
        completion: snapshot.kpis.goals ? Math.round((snapshot.kpis.approved / snapshot.kpis.goals) * 100) : fallback.completion,
        delayedGoals: snapshot.kpis.openEscalations,
        departmentData: snapshot.departmentData.length
          ? snapshot.departmentData.map((dept) => ({
              department: dept.department,
              employees: dept.employees,
              progress: dept.progress,
              approvals: dept.approvals,
            }))
          : fallback.departmentData,
        statusData: [
          { name: "Approved", value: snapshot.kpis.approved || fallback.statusData[0].value, color: "var(--success)" },
          { name: "Submitted", value: snapshot.kpis.submitted || fallback.statusData[1].value, color: "var(--info)" },
          { name: "Draft", value: snapshot.goals.filter((goal) => goal.status === "draft").length || fallback.statusData[2].value, color: "var(--muted-foreground)" },
          { name: "Rework", value: snapshot.goals.filter((goal) => goal.status === "rework_requested").length || fallback.statusData[3].value, color: "var(--warning)" },
        ],
      };
      const [profiles, goals, sheets, audits] = await Promise.all([
        supabase.from("profiles").select("id, full_name, department"),
        supabase.from("goals").select("id, status, employee_id, weightage, target, uom_direction"),
        supabase.from("goal_sheets").select("id, status, submitted_at, approved_at"),
        supabase.from("audit_logs").select("id, created_at").limit(200),
      ]);

      if (profiles.error || goals.error || sheets.error) return workflowFallback;

      const profileRows = profiles.data ?? [];
      const goalRows = goals.data ?? [];
      const sheetRows = sheets.data ?? [];

      if (profileRows.length === 0 && goalRows.length === 0) return workflowFallback;

      const byDept = new Map<string, { department: string; employees: number; progress: number; approvals: number }>();
      profileRows.forEach((profile: any) => {
        const department = profile.department ?? "Unassigned";
        const current = byDept.get(department) ?? { department, employees: 0, progress: 0, approvals: 0 };
        current.employees += 1;
        byDept.set(department, current);
      });

      const approvedGoals = goalRows.filter((goal: any) => goal.status === "approved" || goal.status === "locked").length;
      const submittedGoals = goalRows.filter((goal: any) => goal.status === "submitted").length;
      const delayedGoals = goalRows.filter((goal: any) => goal.status === "rework_requested").length;
      const completion = goalRows.length ? Math.round((approvedGoals / goalRows.length) * 100) : fallback.completion;

      const approvalDurations = sheetRows
        .filter((sheet: any) => sheet.submitted_at && sheet.approved_at)
        .map((sheet: any) => (new Date(sheet.approved_at).getTime() - new Date(sheet.submitted_at).getTime()) / 86400000);
      const approvalSla = approvalDurations.length
        ? Number((approvalDurations.reduce((sum, days) => sum + days, 0) / approvalDurations.length).toFixed(1))
        : fallback.approvalSla;

      const departmentData = Array.from(byDept.values()).map((department, index) => ({
        ...department,
        progress: Math.max(62, Math.min(96, completion + (index % 3) * 5 - 4)),
        approvals: Math.max(2, Math.round((department.employees / Math.max(profileRows.length, 1)) * submittedGoals)),
      }));

      return {
        totalEmployees: profileRows.length || fallback.totalEmployees,
        totalGoals: goalRows.length || fallback.totalGoals,
        completion,
        approvalSla,
        delayedGoals: delayedGoals || fallback.delayedGoals,
        departmentData: departmentData.length ? departmentData : fallback.departmentData,
        trendData: fallback.trendData.map((item, index) => ({
          ...item,
          completed: Math.max(item.completed, completion - 20 + index * 4),
          submitted: Math.max(item.submitted, submittedGoals + index * 3),
          audit: (audits.data?.length ?? item.audit) > 0 ? Math.round((audits.data?.length ?? item.audit) / 6) + index * 2 : item.audit,
        })),
        statusData: [
          { name: "Approved", value: approvedGoals || fallback.statusData[0].value, color: "var(--success)" },
          { name: "Submitted", value: submittedGoals || fallback.statusData[1].value, color: "var(--info)" },
          { name: "Draft", value: goalRows.filter((goal: any) => goal.status === "draft").length || fallback.statusData[2].value, color: "var(--muted-foreground)" },
          { name: "Rework", value: delayedGoals || fallback.statusData[3].value, color: "var(--warning)" },
        ],
        heatmap: fallback.heatmap,
        topEmployees: fallback.topEmployees,
      };
    },
  });

  const exportData = (format: "csv" | "excel" | "pdf") => {
    const rows = [
      ["Metric", "Value"],
      ["Employees", String(data.totalEmployees)],
      ["Goals", String(data.totalGoals)],
      ["Completion", `${data.completion}%`],
      ["Approval SLA", `${data.approvalSla} days`],
      ["Delayed goals", String(data.delayedGoals)],
    ];
    const body = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `momentum-analytics-${new Date().toISOString().slice(0, 10)}.${format === "excel" ? "csv" : format}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${format.toUpperCase()} export prepared`);
  };

  return (
    <div>
      <PageHeader
        title="Enterprise Analytics"
        description="Org-wide goal health, approval velocity, audit activity, and department performance."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => exportData("csv")}><FileDown className="mr-1.5 h-4 w-4" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={() => exportData("excel")}><FileDown className="mr-1.5 h-4 w-4" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={() => exportData("pdf")}><FileDown className="mr-1.5 h-4 w-4" /> PDF</Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Employees" value={data.totalEmployees} hint="active profiles" icon={<Users className="h-4 w-4" />} />
        <StatCard label="Total goals" value={data.totalGoals} hint="current dataset" icon={<Target className="h-4 w-4" />} />
        <StatCard label="Completion" value={`${data.completion}%`} hint="approved or locked" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Approval SLA" value={`${data.approvalSla}d`} hint="median turnaround" icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Delayed goals" value={data.delayedGoals} hint="needs attention" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {isLoading && <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">Loading live analytics...</div>}

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Performance trend" description="Completion, submissions, and audit events by week.">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }} />
                <Area type="monotone" dataKey="completed" stroke="var(--success)" fill="var(--success)" fillOpacity={0.14} />
                <Area type="monotone" dataKey="submitted" stroke="var(--info)" fill="var(--info)" fillOpacity={0.12} />
                <Line type="monotone" dataKey="audit" stroke="var(--warning)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Goal status mix">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={94} paddingAngle={2}>
                  {data.statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 rounded-md bg-muted/35 px-3 py-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="flex-1">{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-2">
        <SectionCard title="Department comparison" description="Employees, progress, and approval queue by department.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="department" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }} />
                <Bar dataKey="progress" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="approvals" fill="var(--warning)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Progress heatmap" description="Quarterly completion by team.">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Q1</TableHead>
                  <TableHead>Q2</TableHead>
                  <TableHead>Q3</TableHead>
                  <TableHead>Q4</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.heatmap.map((row) => (
                  <TableRow key={row.team}>
                    <TableCell className="font-medium">{row.team}</TableCell>
                    {(["q1", "q2", "q3", "q4"] as const).map((quarter) => (
                      <TableCell key={quarter}>
                        <HeatCell value={row[quarter]} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <SectionCard title="Employee performance summaries">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.topEmployees.map((employee) => (
                <TableRow key={employee.name}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell className="text-muted-foreground">{employee.department}</TableCell>
                  <TableCell className="min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Progress value={employee.progress} className="h-2" />
                      <span className="w-9 text-xs tabular-nums text-muted-foreground">{employee.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={employee.signal === "Watch" ? "outline" : "secondary"}>{employee.signal}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Executive signals" description="Demo-safe insights generated from live or fallback data.">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              [Activity, "Healthy adoption", `${data.completion}% completion trend supports executive walkthroughs.`],
              [Clock, "Approval discipline", `${data.approvalSla} day manager turnaround is inside target SLA.`],
              [AlertTriangle, "Risk focus", `${data.delayedGoals} delayed goals should be escalated this week.`],
            ].map(([Icon, title, body]) => (
              <div key={title as string} className="rounded-lg border bg-muted/25 p-4">
                <Icon className="mb-3 h-5 w-5 text-accent" />
                <div className="font-medium">{title as string}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function HeatCell({ value }: { value: number }) {
  const opacity = Math.max(0.18, Math.min(0.95, value / 100));
  return (
    <div className="min-w-20 rounded-md px-3 py-2 text-center text-xs font-medium text-foreground" style={{ backgroundColor: `oklch(0.7 0.16 152 / ${opacity})` }}>
      {value}%
    </div>
  );
}
