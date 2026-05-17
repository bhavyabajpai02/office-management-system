import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileSearch, Filter, Download, ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDemoAuditLogs } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin/audit")({
  component: AuditPage,
});

type AuditLog = {
  id: string;
  created_at: string;
  actor_id: string | null;
  goal_id: string | null;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
};

const ACTION_CATEGORIES = [
  { value: "all", label: "All actions" },
  { value: "goal", label: "Goal changes" },
  { value: "sheet", label: "Goal sheet" },
  { value: "checkin", label: "Check-ins" },
];

const RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last quarter" },
  { value: "365", label: "Last year" },
  { value: "all", label: "All time" },
];

const demoAuditLogs: AuditLog[] = [
  {
    id: "AUD-DEMO-1007",
    created_at: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    actor_id: null,
    goal_id: "GOAL-RETENTION-Q2",
    action: "goal_updated",
    field: "target",
    old_value: "75",
    new_value: "82",
  },
  {
    id: "AUD-DEMO-1006",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actor_id: null,
    goal_id: "SHEET-ENG-Q2",
    action: "sheet_approved",
    field: "status",
    old_value: "submitted",
    new_value: "approved",
  },
  {
    id: "AUD-DEMO-1005",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actor_id: null,
    goal_id: "CHECKIN-Q2",
    action: "checkin_created",
    field: "actual",
    old_value: null,
    new_value: "68",
  },
];

function actionColor(action: string): "default" | "secondary" | "destructive" | "outline" {
  if (action.includes("deleted") || action.includes("rejected")) return "destructive";
  if (action.includes("approved") || action.includes("created")) return "default";
  if (action.includes("updated") || action.includes("changed")) return "secondary";
  return "outline";
}

function AuditPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState("30");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", range],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (range !== "all") {
        const since = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();
        q = q.gte("created_at", since);
      }
      const { data } = await q;
      const workflowLogs = getDemoAuditLogs() as AuditLog[];
      return data && data.length > 0
        ? [...workflowLogs, ...((data ?? []) as AuditLog[])]
        : [...workflowLogs, ...demoAuditLogs];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-min"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email");
      return data ?? [];
    },
  });
  const nameOf = (id: string | null) =>
    id ? (profiles.find((p) => p.id === id)?.full_name ?? id) : "System";

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (category !== "all" && !l.action.startsWith(category)) return false;
      if (search) {
        const hay =
          `${l.action} ${l.field ?? ""} ${l.old_value ?? ""} ${l.new_value ?? ""} ${nameOf(l.actor_id)}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, category, search, profiles]);

  const exportCsv = () => {
    const header = "timestamp,actor,action,field,old_value,new_value\n";
    const body = filtered
      .map((l) =>
        [
          l.created_at,
          nameOf(l.actor_id),
          l.action,
          l.field ?? "",
          l.old_value ?? "",
          l.new_value ?? "",
        ]
          .map((s) => `"${String(s).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Complete activity history with filters and export"
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
        }
      />

      <SectionCard>
        <div className="flex flex-col md:flex-row gap-2 md:items-center mb-4">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search by user, action, field or value..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-4">
            {isLoading ? (
              <TableSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<FileSearch className="h-8 w-8" />}
                title="No audit events"
                description="Adjust filters or expand the date range."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((l) => (
                    <Fragment key={l.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                      >
                        <TableCell>
                          {expanded === l.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(l.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm">{nameOf(l.actor_id)}</TableCell>
                        <TableCell>
                          <Badge variant={actionColor(l.action)} className="font-mono text-[10px]">
                            {l.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.field ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {l.old_value ? (
                            <span className="text-muted-foreground line-through mr-1.5">
                              {l.old_value}
                            </span>
                          ) : null}
                          {l.new_value ?? "—"}
                        </TableCell>
                      </TableRow>
                      {expanded === l.id && (
                        <TableRow key={l.id + "-detail"} className="bg-muted/30">
                          <TableCell></TableCell>
                          <TableCell colSpan={5}>
                            <div className="grid grid-cols-2 gap-4 py-2 text-xs">
                              <div>
                                <div className="text-muted-foreground mb-1">Old value</div>
                                <pre className="bg-background border rounded p-2 whitespace-pre-wrap">
                                  {l.old_value ?? "—"}
                                </pre>
                              </div>
                              <div>
                                <div className="text-muted-foreground mb-1">New value</div>
                                <pre className="bg-background border rounded p-2 whitespace-pre-wrap">
                                  {l.new_value ?? "—"}
                                </pre>
                              </div>
                              <div className="col-span-2 text-muted-foreground">
                                Goal ref: {l.goal_id ?? "—"} · Event ID: {l.id}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            {isLoading ? (
              <TableSkeleton />
            ) : (
              <ol className="relative border-l ml-2 space-y-4 pl-6">
                {filtered.slice(0, 100).map((l) => (
                  <li key={l.id} className="relative">
                    <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleString()}
                    </div>
                    <div className="text-sm mt-0.5">
                      <span className="font-medium">{nameOf(l.actor_id)}</span>{" "}
                      <Badge variant={actionColor(l.action)} className="font-mono text-[10px] mx-1">
                        {l.action}
                      </Badge>
                      {l.field && <span className="text-muted-foreground">on {l.field}</span>}
                      {l.old_value && l.new_value && (
                        <span className="text-muted-foreground">
                          {" "}
                          · <span className="line-through">{l.old_value}</span> →{" "}
                          <span className="text-foreground">{l.new_value}</span>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      </SectionCard>
    </div>
  );
}
