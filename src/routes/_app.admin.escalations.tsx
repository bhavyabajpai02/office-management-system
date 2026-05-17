import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Bell, CheckCircle2, Clock, Download, Filter, ShieldAlert, UserRoundCheck } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createDemoEscalation, getDemoEscalations, updateDemoEscalation } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin/escalations")({
  component: EscalationsPage,
});

type Escalation = {
  id: string;
  owner: string;
  department: string;
  type: "approval" | "check-in" | "goal-risk" | "audit";
  severity: "critical" | "high" | "medium";
  age: string;
  summary: string;
  status: "open" | "watching" | "resolved";
};

const demoEscalations: Escalation[] = [
  { id: "ESC-1042", owner: "Sam Carter", department: "Engineering", type: "approval", severity: "high", age: "3d", summary: "Five goal sheets waiting past manager SLA.", status: "open" },
  { id: "ESC-1041", owner: "Maya Patel", department: "Customer Success", type: "check-in", severity: "medium", age: "2d", summary: "Q2 check-in missing for two customer retention goals.", status: "watching" },
  { id: "ESC-1038", owner: "Jordan Lee", department: "People Ops", type: "audit", severity: "critical", age: "6h", summary: "Bulk goal status update requires HR review.", status: "open" },
  { id: "ESC-1035", owner: "Alex Morgan", department: "Engineering", type: "goal-risk", severity: "medium", age: "1d", summary: "Progress under 55% on shared automation objective.", status: "resolved" },
];

function workflowEscalations(): Escalation[] {
  return getDemoEscalations().map((item) => ({
    id: item.id,
    owner: item.owner,
    department: item.department,
    type: item.type === "permission" ? "audit" : item.type,
    severity: item.severity,
    age: relativeAge(item.created_at),
    summary: item.summary,
    status: item.status,
  }));
}

function EscalationsPage() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const rows = useMemo(() => {
    void refreshKey;
    const workflow = workflowEscalations();
    return workflow.length ? workflow : demoEscalations;
  }, [refreshKey]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (severity !== "all" && row.severity !== severity) return false;
      const hay = `${row.id} ${row.owner} ${row.department} ${row.type} ${row.summary}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [rows, search, severity]);

  const updateStatus = (id: string, status: Escalation["status"]) => {
    updateDemoEscalation(id, { status }, `HR marked this escalation ${status}.`);
    setRefreshKey((key) => key + 1);
    toast.success(`Escalation ${id} marked ${status}`);
  };

  const createEscalation = () => {
    createDemoEscalation({
      owner: "Sam Carter",
      department: "Engineering",
      type: "approval",
      severity: "high",
      summary: "Manager review requested for a delayed goal and missing check-in evidence.",
    });
    setRefreshKey((key) => key + 1);
    toast.success("Escalation created and routed to manager activity");
  };

  const exportEscalations = () => {
    const csv = [
      ["ID", "Owner", "Department", "Type", "Severity", "Age", "Status", "Summary"],
      ...filtered.map((row) => [row.id, row.owner, row.department, row.type, row.severity, row.age, row.status, row.summary]),
    ].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `escalations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Escalation report exported");
  };

  const openCount = rows.filter((row) => row.status === "open").length;
  const criticalCount = rows.filter((row) => row.severity === "critical").length;
  const resolvedCount = rows.filter((row) => row.status === "resolved").length;

  return (
    <div>
      <PageHeader
        title="Escalations"
        description="Track overdue submissions, approvals, audit anomalies, and goals needing HR attention."
        actions={
          <>
            <Button variant="outline" onClick={exportEscalations}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button variant="outline" onClick={createEscalation}>
              <ShieldAlert className="mr-1.5 h-4 w-4" /> Create
            </Button>
            <Button onClick={() => toast.success("Escalation digest sent to admins and managers")}>
              <Bell className="mr-1.5 h-4 w-4" /> Send digest
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open escalations" value={openCount} icon={<ShieldAlert className="h-4 w-4" />} />
        <StatCard label="Critical" value={criticalCount} hint="needs same-day review" icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Watching" value={rows.filter((row) => row.status === "watching").length} icon={<Clock className="h-4 w-4" />} />
        <StatCard label="Resolved" value={resolvedCount} icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      <SectionCard>
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search owner, department, type, or summary..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Escalation</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-md">
                  <div className="font-medium">{row.id}</div>
                  <div className="text-sm text-muted-foreground">{row.summary}</div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{row.owner}</div>
                  <div className="text-xs text-muted-foreground">{row.department}</div>
                </TableCell>
                <TableCell><Badge variant="secondary">{row.type}</Badge></TableCell>
                <TableCell><SeverityBadge severity={row.severity} /></TableCell>
                <TableCell>{row.age}</TableCell>
                <TableCell><Badge variant={row.status === "resolved" ? "secondary" : "outline"}>{row.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateStatus(row.id, "watching")}>Watch</Button>
                    <Button size="sm" onClick={() => updateStatus(row.id, "resolved")}>
                      <UserRoundCheck className="mr-1 h-4 w-4" /> Resolve
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          ["Approval SLA", "Review manager SLA breaches", "/admin/analytics"],
          ["Audit logs", "Inspect sensitive changes", "/admin/audit"],
          ["Settings", "Tune escalation policy", "/admin/settings"],
        ].map(([title, body, href]) => (
          <Link key={title} to={href} className="rounded-lg border bg-card p-4 transition hover:bg-muted/40">
            <div className="font-medium">{title}</div>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function relativeAge(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(diff / 3600000));
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

function SeverityBadge({ severity }: { severity: Escalation["severity"] }) {
  if (severity === "critical") return <Badge variant="destructive">Critical</Badge>;
  if (severity === "high") return <Badge className="bg-warning text-warning-foreground hover:bg-warning">High</Badge>;
  return <Badge variant="outline">Medium</Badge>;
}
