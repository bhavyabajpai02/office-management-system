import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Users, Target, CheckCircle2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getEnterpriseSnapshot } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin")({
  component: AdminDashboard,
});

const fallbackStats = {
  totalEmployees: 128,
  totalGoals: 642,
  approvedSheets: 94,
  submittedSheets: 18,
  deptData: [
    { name: "Engineering", employees: 42 },
    { name: "Customer Success", employees: 28 },
    { name: "Sales", employees: 24 },
    { name: "Finance", employees: 16 },
    { name: "People Ops", employees: 18 },
  ],
};

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, goals, sheets] = await Promise.all([
        supabase.from("profiles").select("id, department", { count: "exact" }),
        supabase.from("goals").select("id, status", { count: "exact" }),
        supabase.from("goal_sheets").select("id, status", { count: "exact" }),
      ]);
      const snapshot = getEnterpriseSnapshot();
      if (profiles.error || goals.error || sheets.error) {
        return {
          totalEmployees: snapshot.kpis.employees,
          totalGoals: snapshot.kpis.goals,
          approvedSheets: snapshot.kpis.approved,
          submittedSheets: snapshot.kpis.submitted,
          deptData: snapshot.departmentData.map((dept) => ({
            name: dept.department,
            employees: dept.employees,
          })),
        };
      }
      const totalEmployees = profiles.count ?? 0;
      const totalGoals = goals.count ?? 0;
      const approvedSheets = (sheets.data ?? []).filter(
        (s) => s.status === "approved" || s.status === "locked",
      ).length;
      const submittedSheets = (sheets.data ?? []).filter((s) => s.status === "submitted").length;

      const byDept: Record<string, number> = {};
      (profiles.data ?? []).forEach((p) => {
        byDept[p.department ?? "—"] = (byDept[p.department ?? "—"] ?? 0) + 1;
      });
      const deptData = Object.entries(byDept).map(([name, value]) => ({ name, employees: value }));

      if (totalEmployees === 0 && totalGoals === 0) {
        return {
          totalEmployees: snapshot.kpis.employees,
          totalGoals: snapshot.kpis.goals,
          approvedSheets: snapshot.kpis.approved,
          submittedSheets: snapshot.kpis.submitted,
          deptData: snapshot.departmentData.map((dept) => ({
            name: dept.department,
            employees: dept.employees,
          })),
        };
      }
      return {
        totalEmployees,
        totalGoals,
        approvedSheets,
        submittedSheets,
        deptData: deptData.length ? deptData : fallbackStats.deptData,
      };
    },
  });

  return (
    <div>
      <PageHeader
        title="Organization Overview"
        description="Goal & performance health across the company"
        actions={
          <Button asChild variant="outline">
            <Link to="/admin/analytics">
              <BarChart3 className="h-4 w-4 mr-1.5" /> Full analytics
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          label="Employees"
          value={stats?.totalEmployees ?? 0}
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="Total goals"
          value={stats?.totalGoals ?? 0}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Sheets approved"
          value={stats?.approvedSheets ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <StatCard
          label="Pending approval"
          value={stats?.submittedSheets ?? 0}
          icon={<BarChart3 className="h-4 w-4" />}
        />
      </div>

      <SectionCard title="Headcount by department">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.deptData ?? []}>
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
              <Bar dataKey="employees" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}
