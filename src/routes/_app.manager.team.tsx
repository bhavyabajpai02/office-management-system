import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { AlertTriangle, Bell, CalendarClock, CheckCircle2, Download, MessageSquareText, Target, Undo2, Users } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { calcProgress } from "@/lib/progress";
import { getDemoGoalWorkspace } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/manager/team")({
  component: TeamCheckInsPage,
});

type TeamMember = {
  id: string;
  full_name: string;
  department: string | null;
  job_title: string | null;
  goals: Array<{ title: string; target: number | string; uom_direction: string; check_ins?: Array<{ actual: number | null; quarter: string; status: string | null }> }>;
};

const fallbackTeam: TeamMember[] = [
  {
    id: "demo-1",
    full_name: "Alex Morgan",
    department: "Engineering",
    job_title: "Software Engineer",
    goals: [
      { title: "Improve release predictability", target: 100, uom_direction: "min", check_ins: [{ actual: 86, quarter: "Q2", status: "on_track" }] },
      { title: "Reduce escaped defects", target: 20, uom_direction: "min", check_ins: [{ actual: 16, quarter: "Q2", status: "on_track" }] },
    ],
  },
  {
    id: "demo-2",
    full_name: "Maya Patel",
    department: "Customer Success",
    job_title: "Success Lead",
    goals: [
      { title: "Improve renewal readiness", target: 100, uom_direction: "min", check_ins: [{ actual: 78, quarter: "Q2", status: "on_track" }] },
    ],
  },
  {
    id: "demo-3",
    full_name: "Jordan Kim",
    department: "Engineering",
    job_title: "QA Analyst",
    goals: [
      { title: "Expand automated coverage", target: 100, uom_direction: "min", check_ins: [{ actual: 52, quarter: "Q2", status: "not_started" }] },
    ],
  },
];

function connectedFallbackTeam(): TeamMember[] {
  const workspace = getDemoGoalWorkspace("demo-employee");
  return fallbackTeam.map((member) =>
    member.id === "demo-1"
      ? {
          ...member,
          goals: workspace.goals.map((goal) => ({
            title: goal.title,
            target: goal.target,
            uom_direction: goal.uom_direction,
            check_ins: goal.check_ins?.map((checkIn) => ({
              actual: checkIn.actual,
              quarter: checkIn.quarter,
              status: checkIn.status,
            })),
          })),
        }
      : member,
  );
}

function TeamCheckInsPage() {
  const { user } = useAuth();

  const { data: team = connectedFallbackTeam(), isLoading } = useQuery({
    queryKey: ["team-checkins", user?.id],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, department, job_title")
        .eq("manager_id", user!.id);
      if (error) throw error;
      if (!profiles || profiles.length === 0) return connectedFallbackTeam();

      const ids = profiles.map((profile) => profile.id);
      const { data: goals } = await supabase
        .from("goals")
        .select("title, target, uom_direction, employee_id, check_ins(actual, quarter, status)")
        .in("employee_id", ids);

      return profiles.map((profile: any) => ({
        ...profile,
        goals: (goals ?? []).filter((goal: any) => goal.employee_id === profile.id),
      })) as TeamMember[];
    },
    enabled: !!user,
  });

  const rows = team.map((member) => {
    const progressValues = member.goals.map((goal) => {
      const actual = (goal.check_ins ?? []).reduce((sum, checkIn) => sum + Number(checkIn.actual ?? 0), 0);
      return calcProgress({
        direction: goal.uom_direction as "min" | "max" | "timeline" | "zero",
        target: Number(goal.target) || 100,
        actual,
      });
    });
    const progress = progressValues.length ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length) : 0;
    const checkIns = member.goals.reduce((sum, goal) => sum + (goal.check_ins?.length ?? 0), 0);
    return {
      ...member,
      progress,
      checkIns,
      status: progress >= 85 ? "Ahead" : progress >= 65 ? "On track" : "At risk",
    };
  });

  const avgProgress = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0;
  const atRisk = rows.filter((row) => row.status === "At risk").length;
  const totalGoals = rows.reduce((sum, row) => sum + row.goals.length, 0);
  const coverage = totalGoals ? Math.round((rows.reduce((sum, row) => sum + row.checkIns, 0) / totalGoals) * 100) : 0;

  const chartData = rows.map((row) => ({ name: row.full_name.split(" ")[0], progress: row.progress }));

  const exportTeam = () => {
    const csv = [
      ["Employee", "Department", "Progress", "Goals", "Check-ins", "Status"],
      ...rows.map((row) => [row.full_name, row.department ?? "", `${row.progress}%`, String(row.goals.length), String(row.checkIns), row.status]),
    ].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-checkins-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Team report exported");
  };

  return (
    <div>
      <PageHeader
        title="Team Check-Ins"
        description="Review quarterly updates, coverage, and risk across your direct reports."
        actions={
          <>
            <Button variant="outline" onClick={exportTeam}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button onClick={() => toast.success("Reminder notifications queued for missing check-ins")}>
              <Bell className="mr-1.5 h-4 w-4" /> Send reminders
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team members" value={rows.length} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Avg. progress" value={`${avgProgress}%`} hint="across goals" icon={<Target className="h-4 w-4" />} />
        <StatCard label="Check-in coverage" value={`${coverage}%`} hint="submitted updates" icon={<CalendarClock className="h-4 w-4" />} />
        <StatCard label="At risk" value={atRisk} hint="needs coaching" icon={<AlertTriangle className="h-4 w-4" />} />
      </div>

      {isLoading && <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">Loading team check-ins...</div>}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_380px]">
        <SectionCard title="Team progress distribution" description="Average achievement by direct report.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--popover)" }} />
                <Bar dataKey="progress" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Manager actions">
          <div className="space-y-3">
            {[
              ["Review approvals", "Goal sheets waiting for decision", "/manager/approvals"],
              ["Create shared goal", "Align the team on a department KPI", "/manager/shared"],
              ["Coach at-risk reports", `${atRisk} employee(s) need attention`, "/manager/team"],
            ].map(([title, body, href]) => (
              <Link key={title} to={href} className="block rounded-lg border bg-card p-3 transition hover:bg-muted/40">
                <div className="font-medium">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{body}</div>
              </Link>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Direct report check-ins" description="Click a goal page or approval queue for deeper workflow actions.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Goals</TableHead>
              <TableHead>Check-ins</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Review</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {row.full_name}
                  <div className="text-xs text-muted-foreground">{row.job_title ?? "Team member"}</div>
                </TableCell>
                <TableCell>{row.department ?? "Unassigned"}</TableCell>
                <TableCell>{row.goals.length}</TableCell>
                <TableCell>{row.checkIns}</TableCell>
                <TableCell className="min-w-[180px]">
                  <div className="flex items-center gap-2">
                    <Progress value={row.progress} className="h-2" />
                    <span className="w-9 text-xs tabular-nums text-muted-foreground">{row.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={row.status === "At risk" ? "outline" : "secondary"}>
                    {row.status === "Ahead" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                    {row.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.success(`Feedback sent to ${row.full_name}`)}>
                      <MessageSquareText className="mr-1 h-4 w-4" /> Feedback
                    </Button>
                    <Button size="sm" onClick={() => toast.success(`Update requested from ${row.full_name}`)}>
                      <Undo2 className="mr-1 h-4 w-4" /> Request update
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>
    </div>
  );
}
