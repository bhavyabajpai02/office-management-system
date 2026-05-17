import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Target, CheckCircle2, Clock, TrendingUp, CalendarClock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { calcProgress } from "@/lib/progress";
import { getDemoGoalWorkspace } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/employee")({
  component: EmployeeDashboard,
});

function EmployeeDashboard() {
  const { user, profile } = useAuth();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["my-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*, check_ins(*)")
        .eq("employee_id", user!.id)
        .order("created_at", { ascending: false });
      if (error || !data || data.length === 0) return getDemoGoalWorkspace(user!.id).goals;
      return data ?? [];
    },
    enabled: !!user,
  });

  const total = goals.length;
  const approved = goals.filter((g) => g.status === "approved" || g.status === "locked").length;
  const pending = goals.filter((g) => g.status === "submitted").length;
  const completionPct =
    total === 0 ? 0 : Math.round(goals.reduce((acc, g) => acc + calcProgressForGoal(g), 0) / total);

  const chartData = goals.map((g) => ({
    name: g.title.length > 16 ? g.title.slice(0, 16) + "…" : g.title,
    Progress: calcProgressForGoal(g),
  }));

  const statusBuckets = ["draft", "submitted", "rework_requested", "approved", "locked"]
    .map((s) => ({
      name: s,
      value: goals.filter((g) => g.status === s).length,
    }))
    .filter((b) => b.value > 0);

  const COLORS = [
    "hsl(220 9% 60%)",
    "var(--info)",
    "var(--warning)",
    "var(--success)",
    "var(--primary)",
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(" ")[0] ?? "there"} 👋`}
        description="Track your goals, quarterly check-ins and overall progress."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/ai">
                <Sparkles className="h-4 w-4 mr-1.5" /> AI Copilot
              </Link>
            </Button>
            <Button asChild>
              <Link to="/employee/goals">
                <Target className="h-4 w-4 mr-1.5" /> Manage Goals
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Total goals"
          value={total}
          hint={`out of 8 max`}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Approved"
          value={approved}
          hint="locked in for the cycle"
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pending approval"
          value={pending}
          hint="awaiting manager"
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="Avg. progress"
          value={`${completionPct}%`}
          hint="across all goals"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <SectionCard title="Goal progress" description="Real-time achievement per goal">
          <div className="lg:col-span-2 h-64">
            {chartData.length === 0 ? (
              <EmptyState
                title="No goals yet"
                description="Create your first goal to see progress."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                    }}
                  />
                  <Bar dataKey="Progress" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Goal status mix">
          <div className="h-64">
            {statusBuckets.length === 0 ? (
              <EmptyState
                title="No status mix yet"
                description="Create goals to see distribution."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBuckets}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {statusBuckets.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="My goals"
        description="Snapshot of your goal sheet"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/employee/goals">Open</Link>
          </Button>
        }
      >
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 rounded-md bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-8 w-8" />}
            title="You don't have any goals yet"
            description="Start by creating goals for this quarter or use the AI assistant."
            action={
              <Button asChild>
                <Link to="/employee/goals">Create goals</Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Thrust area</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.slice(0, 6).map((g) => {
                const pct = calcProgressForGoal(g);
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.title}</TableCell>
                    <TableCell className="text-muted-foreground">{g.thrust_area}</TableCell>
                    <TableCell>{Number(g.weightage)}%</TableCell>
                    <TableCell className="w-48">
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-2" />
                        <span className="text-xs tabular-nums text-muted-foreground w-9">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={g.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <SectionCard title="Upcoming check-ins">
          <ul className="space-y-2 text-sm">
            {["Q1", "Q2", "Q3", "Q4"].map((q) => (
              <li
                key={q}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
              >
                <span className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" /> {q} self-review and
                  manager feedback
                </span>
                <Link
                  to="/employee/checkins"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Validation status">
          <WeightageWarning goals={goals} />
        </SectionCard>
      </div>
    </div>
  );
}

function calcProgressForGoal(g: {
  uom_direction: string;
  target: number | string;
  check_ins?: { actual: number | null }[];
}) {
  const actuals = (g.check_ins ?? []).map((c) => Number(c.actual ?? 0));
  const totalActual = actuals.reduce((a, b) => a + b, 0);
  return calcProgress({
    direction: g.uom_direction as "min" | "max" | "timeline" | "zero",
    target: Number(g.target),
    actual: totalActual,
  });
}

function WeightageWarning({ goals }: { goals: { weightage: number | string }[] }) {
  const total = goals.reduce((a, g) => a + Number(g.weightage), 0);
  const ok = total === 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm">Total weightage</span>
        <span
          className={`text-sm font-semibold ${ok ? "text-success" : "text-warning-foreground"}`}
        >
          {total}%
        </span>
      </div>
      <Progress value={Math.min(total, 100)} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {ok
          ? "Your goal sheet is balanced — ready for submission."
          : "Total weightage must equal 100% before you can submit."}
      </p>
    </div>
  );
}
