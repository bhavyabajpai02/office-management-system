import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, CheckCircle2, Clock, Target, Users } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { getEnterpriseSnapshot } from "@/lib/demo-workflows";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/manager/analytics")({
  component: ManagerAnalyticsPage,
});

function ManagerAnalyticsPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["manager-analytics", user?.id],
    queryFn: async () => {
      // Simulate network delay for realism
      await new Promise((r) => setTimeout(r, 400));
      const snapshot = getEnterpriseSnapshot();

      // In a real app, we would filter this snapshot to just the manager's team.
      // Since it's a demo, we will use a scaled down version of the enterprise snapshot.
      const teamEmployees = Math.max(3, Math.round(snapshot.kpis.employees / 5));
      const teamGoals = Math.max(12, Math.round(snapshot.kpis.goals / 5));
      const teamApproved = Math.max(8, Math.round(snapshot.kpis.approved / 5));
      const teamSubmitted = Math.max(1, Math.round(snapshot.kpis.submitted / 5));
      const completion = teamGoals ? Math.round((teamApproved / teamGoals) * 100) : 84;
      const approvalSla = 1.2;
      const delayed = Math.max(1, Math.round(snapshot.kpis.openEscalations / 4));

      return {
        employees: teamEmployees,
        goals: teamGoals,
        completion,
        approvalSla,
        delayed,
        trendData: [
          { week: "W1", completed: Math.max(0, completion - 20) },
          { week: "W2", completed: Math.max(0, completion - 15) },
          { week: "W3", completed: Math.max(0, completion - 10) },
          { week: "W4", completed: Math.max(0, completion - 5) },
          { week: "W5", completed: completion },
        ],
        statusData: [
          { name: "Approved", value: teamApproved, color: "var(--success)" },
          { name: "Submitted", value: teamSubmitted, color: "var(--info)" },
          {
            name: "Draft",
            value: Math.max(2, teamGoals - teamApproved - teamSubmitted - delayed),
            color: "var(--muted-foreground)",
          },
          { name: "Rework", value: delayed, color: "var(--warning)" },
        ],
        memberProgress: [
          { name: "Alex", progress: 86 },
          { name: "Maya", progress: 78 },
          { name: "Jordan", progress: 61 },
          { name: "Taylor", progress: 92 },
          { name: "Casey", progress: 74 },
        ].slice(0, teamEmployees),
      };
    },
  });

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading team analytics...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Team Analytics"
        description="Deep dive into your team's goal health, progress distribution, and approval metrics."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Team Members"
          value={data.employees}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard label="Active Goals" value={data.goals} icon={<Target className="h-4 w-4" />} />
        <StatCard
          label="Completion"
          value={`${data.completion}%`}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Approval SLA"
          value={`${data.approvalSla}d`}
          icon={<Clock className="h-4 w-4" />}
        />
        <StatCard
          label="At Risk"
          value={data.delayed}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <SectionCard title="Team Completion Trend">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="var(--success)"
                  fill="var(--success)"
                  fillOpacity={0.14}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Goal Status">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={94}
                  paddingAngle={2}
                >
                  {data.statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {data.statusData.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded-md bg-muted/35 px-3 py-2 text-xs"
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span className="flex-1">{item.name}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Progress by Direct Report">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.memberProgress}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                }}
              />
              <Bar dataKey="progress" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
