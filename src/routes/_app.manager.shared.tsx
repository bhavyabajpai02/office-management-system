import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/Skeletons";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Share2, Plus, Users, Trash2, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { THRUST_AREAS, calcProgress } from "@/lib/progress";

export const Route = createFileRoute("/_app/manager/shared")({
  component: SharedGoalsPage,
});

type SharedGoal = {
  id: string;
  manager_id: string;
  department: string | null;
  thrust_area: string;
  title: string;
  description: string | null;
  uom_type: "numeric" | "percentage" | "timeline" | "zero_based";
  uom_direction: "min" | "max" | "timeline" | "zero";
  target: number;
  default_weightage: number;
  deadline: string | null;
  assigned_employee_ids: string[];
  primary_owner_id: string | null;
  created_at: string;
};

const UOM_OPTIONS = [
  { value: "numeric", label: "Numeric", direction: "min" as const },
  { value: "percentage", label: "Percentage", direction: "min" as const },
  { value: "timeline", label: "Timeline", direction: "timeline" as const },
  { value: "zero_based", label: "Zero-based", direction: "zero" as const },
];

const fallbackEmployees = [
  {
    id: "demo-employee",
    full_name: "Alex Morgan",
    email: "alex@momentum.ai",
    department: "Engineering",
    job_title: "Software Engineer",
  },
  {
    id: "demo-employee-2",
    full_name: "Maya Patel",
    email: "maya@momentum.ai",
    department: "Customer Success",
    job_title: "Success Lead",
  },
  {
    id: "demo-employee-3",
    full_name: "Jordan Kim",
    email: "jordan@momentum.ai",
    department: "Engineering",
    job_title: "QA Analyst",
  },
];

function SharedGoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<SharedGoal | null>(null);
  const [toDelete, setToDelete] = useState<SharedGoal | null>(null);
  const [demoSharedGoals, setDemoSharedGoals] = useState<SharedGoal[]>([]);

  const { data: sharedGoals = [], isLoading } = useQuery({
    queryKey: ["shared-goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_goals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SharedGoal[];
    },
    enabled: !!user,
  });
  const visibleSharedGoals = sharedGoals.length ? sharedGoals : demoSharedGoals;

  const { data: employees = [] } = useQuery({
    queryKey: ["all-employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, department, job_title");
      if (error || !data || data.length === 0) return fallbackEmployees;
      return data;
    },
  });

  const deleteShared = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("demo-")) {
        setDemoSharedGoals((current) => current.filter((goal) => goal.id !== id));
        return;
      }
      // unlink child goals first
      await supabase
        .from("goals")
        .update({ shared_goal_id: null, is_shared: false })
        .eq("shared_goal_id", id);
      const { error } = await supabase.from("shared_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-goals"] });
      toast.success("Shared goal removed");
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Shared Department Goals"
        description="Create departmental KPIs and assign them to multiple employees. Achievement syncs from the primary owner."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> New shared goal
          </Button>
        }
      />

      <SectionCard>
        {isLoading ? (
          <TableSkeleton />
        ) : visibleSharedGoals.length === 0 ? (
          <EmptyState
            icon={<Share2 className="h-8 w-8" />}
            title="No shared goals yet"
            description="Create a department-wide KPI to assign to your team."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> New shared goal
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Thrust area</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Primary owner</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSharedGoals.map((sg) => {
                const owner = employees.find((e) => e.id === sg.primary_owner_id);
                return (
                  <TableRow key={sg.id} className="cursor-pointer" onClick={() => setSelected(sg)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {sg.title}
                        <Badge variant="secondary" className="text-[10px]">
                          <Share2 className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      </div>
                      {sg.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {sg.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{sg.thrust_area}</TableCell>
                    <TableCell className="tabular-nums">{Number(sg.target)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {sg.assigned_employee_ids.length}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{owner?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {sg.deadline ?? "—"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => setToDelete(sg)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <CreateSharedGoalDialog
        open={open}
        onOpenChange={setOpen}
        managerId={user!.id}
        employees={employees}
        onDemoCreate={(goal) => setDemoSharedGoals((current) => [goal, ...current])}
      />

      <SharedGoalDrawer
        sharedGoal={selected}
        onClose={() => setSelected(null)}
        employees={employees}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(b) => !b && setToDelete(null)}
        title="Remove shared goal?"
        description="This will unlink the goal from all assigned employees. Their individual goal records remain but become standalone."
        confirmLabel="Remove"
        destructive
        onConfirm={() => toDelete && deleteShared.mutate(toDelete.id)}
      />
    </div>
  );
}

function CreateSharedGoalDialog({
  open,
  onOpenChange,
  managerId,
  employees,
  onDemoCreate,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  managerId: string;
  employees: Array<{ id: string; full_name: string; department: string | null }>;
  onDemoCreate: (goal: SharedGoal) => void;
}) {
  const qc = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thrustArea, setThrustArea] = useState(THRUST_AREAS[0]);
  const [department, setDepartment] = useState("");
  const [uom, setUom] = useState("numeric");
  const [target, setTarget] = useState("100");
  const [weight, setWeight] = useState("15");
  const [deadline, setDeadline] = useState("");
  const [assigned, setAssigned] = useState<string[]>([]);
  const [primaryOwner, setPrimaryOwner] = useState<string>("");

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[],
    [employees],
  );

  const filtered = useMemo(
    () => (department ? employees.filter((e) => e.department === department) : employees),
    [department, employees],
  );

  const toggle = (id: string) => {
    setAssigned((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setTarget("100");
    setWeight("15");
    setDeadline("");
    setAssigned([]);
    setPrimaryOwner("");
  };

  const create = useMutation({
    mutationFn: async () => {
      if (assigned.length === 0) throw new Error("Assign at least one employee");
      if (!primaryOwner || !assigned.includes(primaryOwner)) {
        throw new Error("Select a primary owner from assigned employees");
      }
      const uomOpt = UOM_OPTIONS.find((u) => u.value === uom)!;
      if (assigned.some((id) => id.startsWith("demo-"))) {
        onDemoCreate({
          id: `demo-shared-${Date.now()}`,
          manager_id: managerId,
          department: department || null,
          title,
          description,
          thrust_area: thrustArea,
          uom_type: uom as "numeric" | "percentage" | "timeline" | "zero_based",
          uom_direction: uomOpt.direction,
          target: Number(target),
          default_weightage: Number(weight),
          deadline: deadline || null,
          assigned_employee_ids: assigned,
          primary_owner_id: primaryOwner,
          created_at: new Date().toISOString(),
        });
        return;
      }

      // 1. Create shared goal
      const { data: sg, error: e1 } = await supabase
        .from("shared_goals")
        .insert({
          manager_id: managerId,
          department: department || null,
          title,
          description,
          thrust_area: thrustArea,
          uom_type: uom as "numeric" | "percentage" | "timeline" | "zero_based",
          uom_direction: uomOpt.direction,
          target: Number(target),
          default_weightage: Number(weight),
          deadline: deadline || null,
          assigned_employee_ids: assigned,
          primary_owner_id: primaryOwner,
        })
        .select()
        .single();
      if (e1) throw e1;

      // 2. Ensure each employee has a goal sheet and create linked goal
      for (const empId of assigned) {
        let { data: sheet } = await supabase
          .from("goal_sheets")
          .select("id")
          .eq("employee_id", empId)
          .eq("year", currentYear)
          .maybeSingle();
        if (!sheet) {
          const { data: created } = await supabase
            .from("goal_sheets")
            .insert({ employee_id: empId, year: currentYear })
            .select("id")
            .single();
          sheet = created;
        }
        // Check for existing link
        const { data: existing } = await supabase
          .from("goals")
          .select("id")
          .eq("shared_goal_id", sg.id)
          .eq("employee_id", empId)
          .maybeSingle();
        if (existing) continue;

        await supabase.from("goals").insert({
          sheet_id: sheet!.id,
          employee_id: empId,
          thrust_area: thrustArea,
          title,
          description,
          uom_type: uom as "numeric" | "percentage" | "timeline" | "zero_based",
          uom_direction: uomOpt.direction,
          target: Number(target),
          weightage: Number(weight),
          deadline: deadline || null,
          is_shared: true,
          shared_goal_id: sg.id,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shared-goals"] });
      toast.success(`Shared goal assigned to ${assigned.length} employee(s)`);
      reset();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New shared goal</DialogTitle>
          <DialogDescription>
            Create a department KPI and assign it to multiple employees. Achievement entered by the
            primary owner syncs to all assigned goals.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Goal title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 customer NPS target"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Thrust area</Label>
              <Select value={thrustArea} onValueChange={setThrustArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THRUST_AREAS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Department filter</Label>
              <Select
                value={department || "__all"}
                onValueChange={(v) => setDepartment(v === "__all" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>UoM</Label>
              <Select value={uom} onValueChange={setUom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Target</Label>
              <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Default weightage (%)</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Employees may adjust their own weightage.
              </p>
            </div>
            <div className="grid gap-1.5">
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2 pt-2 border-t">
            <Label>Assign employees ({assigned.length} selected)</Label>
            <div className="max-h-44 overflow-y-auto rounded-md border divide-y">
              {filtered.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
                  No employees match this department.
                </div>
              ) : (
                filtered.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={assigned.includes(emp.id)}
                      onCheckedChange={() => toggle(emp.id)}
                    />
                    <div className="flex-1 text-sm">
                      <div>{emp.full_name}</div>
                      <div className="text-xs text-muted-foreground">{emp.department ?? "—"}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          {assigned.length > 0 && (
            <div className="grid gap-1.5">
              <Label>Primary owner (their actuals sync to peers)</Label>
              <Select value={primaryOwner} onValueChange={setPrimaryOwner}>
                <SelectTrigger>
                  <SelectValue placeholder="Select primary owner" />
                </SelectTrigger>
                <SelectContent>
                  {assigned.map((id) => {
                    const emp = employees.find((e) => e.id === id);
                    return (
                      <SelectItem key={id} value={id}>
                        {emp?.full_name ?? id}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => create.mutate()} disabled={!title || create.isPending}>
            {create.isPending ? "Creating..." : "Create & assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SharedGoalDrawer({
  sharedGoal,
  onClose,
  employees,
}: {
  sharedGoal: SharedGoal | null;
  onClose: () => void;
  employees: Array<{ id: string; full_name: string; department: string | null }>;
}) {
  const { data: linkedGoals = [], isLoading } = useQuery({
    queryKey: ["linked-goals", sharedGoal?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*, check_ins(*)")
        .eq("shared_goal_id", sharedGoal!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sharedGoal,
  });

  if (!sharedGoal) return null;

  return (
    <Sheet open={!!sharedGoal} onOpenChange={(b) => !b && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> {sharedGoal.title}
          </SheetTitle>
          <SheetDescription>
            {sharedGoal.thrust_area} · Target {Number(sharedGoal.target)} · Default weight{" "}
            {Number(sharedGoal.default_weightage)}%
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Department</div>
            <div>{sharedGoal.department ?? "All"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deadline</div>
            <div>{sharedGoal.deadline ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Primary owner</div>
            <div>
              {employees.find((e) => e.id === sharedGoal.primary_owner_id)?.full_name ?? "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Assigned</div>
            <div>{sharedGoal.assigned_employee_ids.length} employees</div>
          </div>
        </div>

        {sharedGoal.description && (
          <p className="mt-4 text-sm text-muted-foreground">{sharedGoal.description}</p>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Linked employees</h3>
            <Badge variant="outline" className="gap-1">
              <Link2 className="h-3 w-3" /> Sync from primary owner
            </Badge>
          </div>
          {isLoading ? (
            <TableSkeleton rows={3} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Sync</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedGoals.map((g: any) => {
                  const emp = employees.find((e) => e.id === g.employee_id);
                  const isPrimary = g.employee_id === sharedGoal.primary_owner_id;
                  const totalActual = (g.check_ins ?? []).reduce(
                    (s: number, c: any) => s + (Number(c.actual) || 0),
                    0,
                  );
                  const pct = calcProgress({
                    direction: g.uom_direction,
                    target: Number(g.target),
                    actual: totalActual,
                  });
                  return (
                    <TableRow key={g.id}>
                      <TableCell>
                        <div className="text-sm">{emp?.full_name ?? "—"}</div>
                        {isPrimary && <Badge className="text-[10px] mt-0.5">Primary</Badge>}
                      </TableCell>
                      <TableCell className="tabular-nums">{Number(g.weightage)}%</TableCell>
                      <TableCell className="min-w-[120px]">
                        <Progress value={pct} className="h-2" />
                        <div className="text-[11px] text-muted-foreground mt-1">{pct}%</div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {g.last_synced_at ? (
                          <span className="inline-flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            {new Date(g.last_synced_at).toLocaleDateString()}
                          </span>
                        ) : isPrimary ? (
                          "Source"
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
