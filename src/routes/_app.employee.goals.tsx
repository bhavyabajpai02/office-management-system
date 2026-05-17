import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  CalendarClock,
  CheckCircle2,
  Edit3,
  Filter,
  Loader2,
  Plus,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { THRUST_AREAS, calcProgress, type UomDirection } from "@/lib/progress";
import {
  archiveDemoGoal,
  createDemoGoal,
  getDemoGoalWorkspace,
  submitDemoSheet,
  updateDemoGoal,
  upsertDemoCheckIn,
  type DemoActivity,
  type DemoGoal,
  type DemoSheet,
  type GoalStatus,
  type Priority,
} from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/employee/goals")({
  component: GoalsPage,
});

type Source = "live" | "demo";
type Workspace = {
  source: Source;
  sheet: DemoSheet;
  goals: DemoGoal[];
  activity: DemoActivity[];
};

const currentYear = new Date().getFullYear();
const currentQuarter = "Q2" as const;
const statuses = ["all", "draft", "submitted", "rework_requested", "locked"] as const;
const priorities: Array<Priority | "all"> = ["all", "High", "Medium", "Low"];

const UOM_OPTIONS: { value: DemoGoal["uom_type"]; label: string; direction: UomDirection }[] = [
  { value: "numeric", label: "Numeric", direction: "min" },
  { value: "percentage", label: "Percentage", direction: "min" },
  { value: "timeline", label: "Timeline", direction: "timeline" },
  { value: "zero_based", label: "Zero-based", direction: "zero" },
];

export function GoalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogGoal, setDialogGoal] = useState<DemoGoal | "new" | null>(null);
  const [progressGoal, setProgressGoal] = useState<DemoGoal | null>(null);
  const [archiveGoal, setArchiveGoal] = useState<DemoGoal | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["goal-workspace", user?.id, currentYear],
    queryFn: async (): Promise<Workspace> => {
      if (!user) return { source: "demo", ...getDemoGoalWorkspace() };
      try {
        const { data: sheet, error: sheetError } = await supabase
          .from("goal_sheets")
          .select("*")
          .eq("employee_id", user.id)
          .eq("year", currentYear)
          .maybeSingle();
        if (sheetError || !sheet) return { source: "demo", ...getDemoGoalWorkspace(user.id) };

        const { data: goals, error: goalsError } = await supabase
          .from("goals")
          .select("*, check_ins(*)")
          .eq("sheet_id", sheet.id)
          .order("created_at", { ascending: false });
        if (goalsError || !goals || goals.length === 0) {
          return { source: "demo", ...getDemoGoalWorkspace(user.id) };
        }

        return {
          source: "live",
          sheet: sheet as DemoSheet,
          goals: goals.map(normalizeGoal).filter((goal) => goal.status !== "archived"),
          activity: [],
        };
      } catch {
        return { source: "demo", ...getDemoGoalWorkspace(user.id) };
      }
    },
    enabled: !!user,
  });

  const workspace = data ?? { source: "demo" as const, ...getDemoGoalWorkspace(user?.id) };
  const goals = workspace.goals;
  const totalWeight = goals.reduce((sum, goal) => sum + Number(goal.weightage), 0);
  const locked = workspace.sheet.status === "approved" || workspace.sheet.status === "locked";
  const averageProgress = goals.length
    ? Math.round(goals.reduce((sum, goal) => sum + progressForGoal(goal), 0) / goals.length)
    : 0;

  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const hay =
        `${goal.title} ${goal.description ?? ""} ${goal.thrust_area} ${goal.priority}`.toLowerCase();
      if (search && !hay.includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && goal.status !== statusFilter) return false;
      if (priorityFilter !== "all" && goal.priority !== priorityFilter) return false;
      return true;
    });
  }, [goals, priorityFilter, search, statusFilter]);

  const saveGoal = useMutation({
    mutationFn: async ({
      goal,
      patch,
    }: {
      goal?: DemoGoal;
      patch: Partial<DemoGoal> &
        Pick<
          DemoGoal,
          | "title"
          | "thrust_area"
          | "target"
          | "weightage"
          | "uom_type"
          | "uom_direction"
          | "priority"
        >;
    }) => {
      if (!user) throw new Error("You must be signed in");
      if (workspace.source === "demo") {
        if (goal) updateDemoGoal(goal.id, patch);
        else {
          createDemoGoal({
            sheet_id: workspace.sheet.id,
            employee_id: user.id,
            title: patch.title,
            description: patch.description ?? null,
            thrust_area: patch.thrust_area,
            target: Number(patch.target),
            weightage: Number(patch.weightage),
            deadline: patch.deadline ?? null,
            uom_type: patch.uom_type,
            uom_direction: patch.uom_direction,
            priority: patch.priority,
            status: "draft",
            is_shared: false,
            shared_goal_id: null,
            q1_planned: Math.round(Number(patch.target) * 0.25),
            q2_planned: Math.round(Number(patch.target) * 0.5),
            q3_planned: Math.round(Number(patch.target) * 0.75),
            q4_planned: Number(patch.target),
          });
        }
        return;
      }

      if (goal) {
        const { error } = await supabase
          .from("goals")
          .update(toGoalPayload(patch))
          .eq("id", goal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("goals").insert({
          ...toGoalPayload(patch),
          sheet_id: workspace.sheet.id,
          employee_id: user.id,
          status: "draft",
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goal-workspace", user?.id, currentYear] });
      toast.success(variables.goal ? "Goal updated" : "Goal created");
      setDialogGoal(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archive = useMutation({
    mutationFn: async (goal: DemoGoal) => {
      if (workspace.source === "demo") {
        archiveDemoGoal(goal.id);
        return;
      }
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-workspace", user?.id, currentYear] });
      toast.success("Goal archived");
      setArchiveGoal(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (goals.length === 0) throw new Error("Add at least one goal before submitting");
      if (goals.length > 8) throw new Error("Maximum 8 goals allowed");
      if (totalWeight !== 100) throw new Error("Total weightage must equal 100%");
      if (goals.some((goal) => Number(goal.weightage) < 10))
        throw new Error("Every goal needs at least 10% weightage");
      if (workspace.source === "demo") {
        submitDemoSheet();
        return;
      }
      const { error: sheetError } = await supabase
        .from("goal_sheets")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", workspace.sheet.id);
      if (sheetError) throw sheetError;
      const { error: goalsError } = await supabase
        .from("goals")
        .update({ status: "submitted" })
        .eq("sheet_id", workspace.sheet.id)
        .eq("status", "draft");
      if (goalsError) throw goalsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-workspace", user?.id, currentYear] });
      toast.success("Goal sheet submitted for manager review");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveProgress = useMutation({
    mutationFn: async ({
      goal,
      actual,
      status,
      comment,
    }: {
      goal: DemoGoal;
      actual: number;
      status: string;
      comment: string;
    }) => {
      const existing = goal.check_ins?.find((checkIn) => checkIn.quarter === currentQuarter);
      if (workspace.source === "demo") {
        upsertDemoCheckIn({
          id: existing?.id,
          goal_id: goal.id,
          quarter: currentQuarter,
          actual,
          status: status as "not_started" | "on_track" | "blocked" | "completed",
          self_comment: comment,
          achievements: existing?.achievements ?? "Progress updated from My Goals.",
          blockers: existing?.blockers ?? "",
          support_needed: existing?.support_needed ?? "",
          rating: existing?.rating ?? 4,
          manager_feedback: existing?.manager_feedback ?? "",
          submitted_at: existing?.submitted_at ?? new Date().toISOString(),
        });
        return;
      }
      const payload = {
        goal_id: goal.id,
        quarter: currentQuarter,
        actual,
        status: status as "not_started" | "on_track" | "completed",
        self_comment: comment,
      };
      const { error } = existing?.id
        ? await supabase.from("check_ins").update(payload).eq("id", existing.id)
        : await supabase.from("check_ins").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-workspace", user?.id, currentYear] });
      toast.success("Progress updated");
      setProgressGoal(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader
        title="My Goals"
        description={`${currentYear} goal sheet · ${workspace.sheet.status} · ${workspace.source === "demo" ? "demo-safe data active" : "live workspace"}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/ai">
                <Sparkles className="mr-1.5 h-4 w-4" /> AI Copilot
              </Link>
            </Button>
            <Button variant="outline" disabled={locked || goals.length >= 8} asChild>
              <Link to="/employee/create-goal">
                <Plus className="mr-1.5 h-4 w-4" /> Create goal
              </Link>
            </Button>
            <Button disabled={locked || submit.isPending} onClick={() => submit.mutate()}>
              {submit.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              Submit
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SectionCard title="Goals">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold tabular-nums">
              {goals.length}
              <span className="text-base text-muted-foreground">/8</span>
            </div>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <Progress value={(goals.length / 8) * 100} className="mt-3 h-2" />
        </SectionCard>
        <SectionCard title="Weightage">
          <div
            className={
              totalWeight === 100
                ? "text-3xl font-semibold text-success"
                : "text-3xl font-semibold text-warning-foreground"
            }
          >
            {totalWeight}%
          </div>
          <Progress value={Math.min(totalWeight, 100)} className="mt-3 h-2" />
        </SectionCard>
        <SectionCard title="Average progress">
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibold tabular-nums">{averageProgress}%</div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <Progress value={averageProgress} className="mt-3 h-2" />
        </SectionCard>
        <SectionCard title="Sheet status">
          <StatusBadge status={workspace.sheet.status} />
          <p className="mt-3 text-sm text-muted-foreground">
            {locked
              ? "Approved sheets are locked for editing."
              : "Edit, balance, and submit when ready."}
          </p>
        </SectionCard>
      </div>

      <SectionCard
        title="Goal workspace"
        description="Search, filter, edit, archive, and update progress from one place."
        actions={
          <Button size="sm" variant="outline" disabled={locked} asChild>
            <Link to="/employee/create-goal">
              <Plus className="mr-1 h-4 w-4" /> Add
            </Link>
          </Button>
        }
      >
        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search goals, thrust areas, priorities..."
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="lg:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === "all" ? "All statuses" : status.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
          >
            <SelectTrigger className="lg:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority === "all" ? "All priorities" : priority}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState
            icon={<Target className="h-8 w-8" />}
            title="No matching goals"
            description="Clear filters or create a new goal with the AI Copilot."
            action={
              <Button asChild>
                <Link to="/employee/create-goal">
                  <Plus className="mr-1.5 h-4 w-4" /> Create goal
                </Link>
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Goal</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGoals.map((goal) => {
                const pct = progressForGoal(goal);
                return (
                  <TableRow key={goal.id}>
                    <TableCell className="max-w-md">
                      <div className="flex flex-wrap items-center gap-2 font-medium">
                        {goal.title}
                        {goal.is_shared && <Badge variant="secondary">Shared</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {goal.thrust_area} · Target {goal.target}
                      </div>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={goal.priority} />
                    </TableCell>
                    <TableCell className="min-w-[180px]">
                      <button className="w-full text-left" onClick={() => setProgressGoal(goal)}>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2" />
                          <span className="w-9 text-xs tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="tabular-nums">{goal.weightage}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" /> {goal.deadline ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={goal.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setProgressGoal(goal)}
                          aria-label="Update progress"
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={locked || goal.is_shared}
                          onClick={() => setDialogGoal(goal)}
                          aria-label="Edit goal"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={locked || goal.is_shared}
                          onClick={() => setArchiveGoal(goal)}
                          aria-label="Archive goal"
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard
          title="Activity history"
          description="Recent workflow events in this goal sheet."
        >
          <div className="space-y-3">
            {(workspace.activity.length
              ? workspace.activity
              : [
                  {
                    id: "empty",
                    created_at: new Date().toISOString(),
                    actor: "Momentum AI",
                    action: "Workspace ready",
                    detail: "Create or update goals to build activity history.",
                  },
                ]
            ).map((item) => (
              <div key={item.id} className="rounded-lg border bg-muted/25 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{item.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {item.actor} · {item.detail}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Submission readiness">
          <div className="space-y-3 text-sm">
            <ReadinessRow done={goals.length > 0} label="At least one goal exists" />
            <ReadinessRow done={goals.length <= 8} label="No more than 8 goals" />
            <ReadinessRow done={totalWeight === 100} label="Weightage totals 100%" />
            <ReadinessRow
              done={goals.every((goal) => Number(goal.weightage) >= 10)}
              label="Every goal has at least 10%"
            />
            <Button
              className="w-full"
              disabled={locked || submit.isPending}
              onClick={() => submit.mutate()}
            >
              <Send className="mr-1.5 h-4 w-4" /> Submit for approval
            </Button>
          </div>
        </SectionCard>
      </div>

      <GoalDialog
        open={!!dialogGoal}
        goal={dialogGoal === "new" ? null : dialogGoal}
        suggestedWeight={Math.max(10, 100 - totalWeight)}
        onOpenChange={(open) => !open && setDialogGoal(null)}
        onSave={(goal, patch) => saveGoal.mutate({ goal: goal ?? undefined, patch })}
        saving={saveGoal.isPending}
      />

      <ProgressDialog
        goal={progressGoal}
        onOpenChange={(open) => !open && setProgressGoal(null)}
        onSave={(payload) => saveProgress.mutate(payload)}
        saving={saveProgress.isPending}
      />

      <ConfirmDialog
        open={!!archiveGoal}
        onOpenChange={(open) => !open && setArchiveGoal(null)}
        title="Archive this goal?"
        description="The goal will leave your active workspace, but the action is recorded in activity history."
        confirmLabel="Archive"
        destructive
        onConfirm={() => archiveGoal && archive.mutate(archiveGoal)}
      />
    </div>
  );
}

function GoalDialog({
  open,
  goal,
  suggestedWeight,
  saving,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  goal: DemoGoal | null;
  suggestedWeight: number;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    goal: DemoGoal | null,
    patch: Partial<DemoGoal> &
      Pick<
        DemoGoal,
        "title" | "thrust_area" | "target" | "weightage" | "uom_type" | "uom_direction" | "priority"
      >,
  ) => void;
}) {
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [thrustArea, setThrustArea] = useState(goal?.thrust_area ?? THRUST_AREAS[0]);
  const [uom, setUom] = useState<DemoGoal["uom_type"]>(goal?.uom_type ?? "percentage");
  const [target, setTarget] = useState(String(goal?.target ?? 100));
  const [weightage, setWeightage] = useState(String(goal?.weightage ?? suggestedWeight));
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [priority, setPriority] = useState<Priority>(goal?.priority ?? "Medium");

  useEffect(() => {
    if (!open) return;
    setTitle(goal?.title ?? "");
    setDescription(goal?.description ?? "");
    setThrustArea(goal?.thrust_area ?? THRUST_AREAS[0]);
    setUom(goal?.uom_type ?? "percentage");
    setTarget(String(goal?.target ?? 100));
    setWeightage(String(goal?.weightage ?? suggestedWeight));
    setDeadline(goal?.deadline ?? "");
    setPriority(goal?.priority ?? "Medium");
  }, [goal, open, suggestedWeight]);

  const selectedUom = UOM_OPTIONS.find((option) => option.value === uom) ?? UOM_OPTIONS[0];
  const invalid =
    !title.trim() || Number(weightage) < 10 || Number(weightage) > 100 || Number(target) <= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{goal ? "Edit goal" : "Create goal"}</DialogTitle>
          <DialogDescription>
            Use a measurable outcome, clear owner behavior, weightage, and due date.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Goal title</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Improve enterprise onboarding completion"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Thrust area</Label>
              <Select value={thrustArea} onValueChange={setThrustArea}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THRUST_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["High", "Medium", "Low"] as const).map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Unit of measure</Label>
              <Select value={uom} onValueChange={(value) => setUom(value as DemoGoal["uom_type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UOM_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Target</Label>
              <Input
                type="number"
                min={1}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Weightage (%)</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={weightage}
                onChange={(event) => setWeightage(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={invalid || saving}
            onClick={() =>
              onSave(goal, {
                title: title.trim(),
                description: description.trim() || null,
                thrust_area: thrustArea,
                target: Number(target),
                weightage: Number(weightage),
                deadline: deadline || null,
                uom_type: uom,
                uom_direction: selectedUom.direction,
                priority,
              })
            }
          >
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {goal ? "Save changes" : "Create goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgressDialog({
  goal,
  saving,
  onOpenChange,
  onSave,
}: {
  goal: DemoGoal | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { goal: DemoGoal; actual: number; status: string; comment: string }) => void;
}) {
  const existing = goal?.check_ins?.find((checkIn) => checkIn.quarter === currentQuarter);
  const [actual, setActual] = useState(existing?.actual ?? 0);
  const [status, setStatus] = useState(existing?.status ?? "on_track");
  const [comment, setComment] = useState(existing?.self_comment ?? "");

  useEffect(() => {
    if (!goal) return;
    const next = goal.check_ins?.find((checkIn) => checkIn.quarter === currentQuarter);
    setActual(Number(next?.actual ?? 0));
    setStatus(next?.status ?? "on_track");
    setComment(next?.self_comment ?? "");
  }, [goal]);

  if (!goal) return null;
  const progress = calcProgress({
    direction: goal.uom_direction,
    target: Number(goal.target),
    actual: Number(actual),
  });

  return (
    <Dialog open={!!goal} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update progress</DialogTitle>
          <DialogDescription>{goal.title}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="rounded-lg border bg-muted/25 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Current progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          <div className="grid gap-2">
            <Label>Actual value</Label>
            <Slider
              value={[Number(actual)]}
              min={0}
              max={Math.max(Number(goal.target), 100)}
              step={1}
              onValueChange={([value]) => setActual(value ?? 0)}
            />
            <Input
              type="number"
              value={actual}
              onChange={(event) => setActual(Number(event.target.value))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as "not_started" | "on_track" | "blocked" | "completed")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not started</SelectItem>
                <SelectItem value="on_track">On track</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Progress note</Label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Summarize progress, risks, or manager decisions needed."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={() => onSave({ goal, actual: Number(actual), status, comment })}
          >
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            )}
            Save progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "High")
    return (
      <Badge className="bg-destructive text-destructive-foreground hover:bg-destructive">
        High
      </Badge>
    );
  if (priority === "Medium")
    return <Badge className="bg-warning text-warning-foreground hover:bg-warning">Medium</Badge>;
  return <Badge variant="outline">Low</Badge>;
}

function ReadinessRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
      <span>{label}</span>
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-success" />
      ) : (
        <span className="h-2.5 w-2.5 rounded-full bg-warning" />
      )}
    </div>
  );
}

function normalizeGoal(goal: any): DemoGoal {
  return {
    ...goal,
    description: goal.description ?? null,
    target: Number(goal.target ?? 100),
    weightage: Number(goal.weightage ?? 10),
    priority:
      (goal.priority as Priority | undefined) ?? inferPriority(Number(goal.weightage ?? 10)),
    status: goal.status as GoalStatus,
    is_shared: Boolean(goal.is_shared),
    shared_goal_id: goal.shared_goal_id ?? null,
    uom_direction: goal.uom_direction as UomDirection,
    check_ins: goal.check_ins ?? [],
  };
}

function inferPriority(weight: number): Priority {
  if (weight >= 30) return "High";
  if (weight >= 20) return "Medium";
  return "Low";
}

function progressForGoal(goal: DemoGoal) {
  const actual = (goal.check_ins ?? []).reduce(
    (sum, checkIn) => sum + Number(checkIn.actual ?? 0),
    0,
  );
  return calcProgress({
    direction: goal.uom_direction,
    target: Number(goal.target),
    actual,
    deadline: goal.deadline,
  });
}

function toGoalPayload(patch: Partial<DemoGoal>) {
  return {
    title: patch.title,
    description: patch.description,
    thrust_area: patch.thrust_area,
    target: patch.target,
    weightage: patch.weightage,
    deadline: patch.deadline,
    uom_type: patch.uom_type,
    uom_direction: patch.uom_direction,
  };
}
