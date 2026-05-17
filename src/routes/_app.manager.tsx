import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3, ClipboardCheck, Share2, TrendingUp, Users } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getDemoApprovalSheets, getEnterpriseSnapshot } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/manager")({
  component: ManagerDashboard,
});

const demoTeam = [
  {
    id: "demo-1",
    full_name: "Alex Morgan",
    department: "Engineering",
    job_title: "Software Engineer",
    progress: 86,
  },
  {
    id: "demo-2",
    full_name: "Maya Patel",
    department: "Customer Success",
    job_title: "Success Lead",
    progress: 78,
  },
  {
    id: "demo-3",
    full_name: "Jordan Kim",
    department: "Engineering",
    job_title: "QA Analyst",
    progress: 61,
  },
];

function ManagerDashboard() {
  const { user } = useAuth();

  const { data: team = demoTeam } = useQuery({
    queryKey: ["my-team", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("manager_id", user!.id);
      if (!data || data.length === 0) {
        const snapshot = getEnterpriseSnapshot();
        const demoEmployees = snapshot.users.filter((item) => item.role === "employee");
        return demoEmployees.length
          ? demoEmployees.map((member, index) => ({
              id: member.id,
              full_name: member.full_name,
              department: member.department,
              job_title: member.job_title,
              progress: [86, 78, 61, 92, 74][index % 5],
            }))
          : demoTeam;
      }
      return data.map((member: any, index: number) => ({
        ...member,
        progress: [86, 78, 61, 92, 74][index % 5],
      }));
    },
    enabled: !!user,
  });

  const { data: pending = [] } = useQuery({
    queryKey: ["pending-approvals", user?.id, team.length],
    queryFn: async () => {
      const ids = team.map((member) => member.id);
      const { data } = await supabase
        .from("goal_sheets")
        .select("*, profiles!goal_sheets_employee_id_fkey(full_name, department)")
        .in("employee_id", ids)
        .eq("status", "submitted");
      return data ?? [];
    },
    enabled: !!user && team.length > 0 && !team[0]?.id?.startsWith("demo"),
  });

  const { data: snapshot } = useQuery({
    queryKey: ["enterprise-snapshot"],
    queryFn: () => getEnterpriseSnapshot(),
  });

  const avgProgress = Math.round(
    team.reduce((sum, member) => sum + Number(member.progress ?? 75), 0) / Math.max(team.length, 1),
  );
  const delayed = team.filter((member) => Number(member.progress ?? 0) < 70).length;
  const approvalCount = pending.length || getDemoApprovalSheets().length;

  return (
    <div>
      <PageHeader
        title="Team Performance"
        description="Monitor direct reports, approval health, delayed goals, and manager actions."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/manager/shared">
                <Share2 className="mr-1.5 h-4 w-4" /> Shared goals
              </Link>
            </Button>
            <Button asChild>
              <Link to="/manager/approvals">
                <ClipboardCheck className="mr-1.5 h-4 w-4" /> Review queue
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Team size" value={team.length} icon={<Users className="h-4 w-4" />} />
        <StatCard
          label="Pending approvals"
          value={approvalCount}
          hint="goal sheets"
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <StatCard
          label="Avg. team progress"
          value={`${avgProgress}%`}
          hint="this quarter"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Delayed goals"
          value={delayed}
          hint="coach this week"
          icon={<AlertCircle className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <SectionCard
          title="Pending approvals"
          description="Manager decisions waiting in the queue."
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to="/manager/approvals">Review all</Link>
            </Button>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(pending.length
                ? pending
                : [
                    {
                      id: "demo-pending-1",
                      profiles: {
                        full_name: "Alex Morgan",
                        department: "Engineering",
                      },
                      status: "submitted",
                    },
                    {
                      id: "demo-pending-2",
                      profiles: {
                        full_name: "Maya Patel",
                        department: "Customer Success",
                      },
                      status: "submitted",
                    },
                  ]
              ).map((sheet: any) => (
                <TableRow key={sheet.id}>
                  <TableCell className="font-medium">{sheet.profiles?.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {sheet.profiles?.department}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sheet.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Manager signals" description="Recommended actions for this week.">
          <div className="space-y-3">
            {[
              [
                "Approval Queue",
                pending.length > 0
                  ? `${pending.length} sheets are waiting for your review`
                  : approvalCount > 0
                    ? `${approvalCount} sheets are waiting for your review`
                    : "All reviews are up to date",
              ],
              [
                "Goal Health",
                snapshot
                  ? `${snapshot.kpis.goals} active goals being tracked`
                  : "Customer retention objective is 78% on track",
              ],
              [
                "Engagement",
                snapshot
                  ? `Check-in coverage is currently ${snapshot.kpis.checkInCoverage}%`
                  : "Two reports have not updated Q2 check-ins",
              ],
            ].map(([title, body]) => (
              <div key={title} className="rounded-lg border bg-muted/25 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{title}</div>
                  <Badge variant="secondary">Actionable</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title="My team" description="Progress by direct report.">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.job_title}</TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell className="min-w-[170px]">
                    <div className="flex items-center gap-2">
                      <Progress value={Number(member.progress ?? 75)} className="h-2" />
                      <span className="w-9 text-xs text-muted-foreground">
                        {Number(member.progress ?? 75)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>

        <SectionCard title="Department analytics">
          <div className="space-y-3">
            <Signal
              label="Approval throughput"
              value={
                snapshot
                  ? `${Math.round((snapshot.kpis.approved / Math.max(1, snapshot.kpis.submitted + snapshot.kpis.approved)) * 100)}%`
                  : "82%"
              }
            />
            <Signal
              label="Check-in coverage"
              value={snapshot ? `${snapshot.kpis.checkInCoverage}%` : "91%"}
            />
            <Signal
              label="Open escalations"
              value={snapshot ? String(snapshot.kpis.openEscalations) : "0"}
            />
            <Button asChild className="w-full" variant="outline">
              <Link to="/manager/analytics">
                <BarChart3 className="mr-1.5 h-4 w-4" /> Open team analytics
              </Link>
            </Button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/25 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
