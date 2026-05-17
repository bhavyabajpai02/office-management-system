import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Bot, CalendarClock, CheckCircle2, Loader2, MessageSquareText, Save, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { calcProgress } from "@/lib/progress";
import {
  getDemoGoalWorkspace,
  upsertDemoCheckIn,
  type CheckInStatus,
  type DemoCheckIn,
  type DemoGoal,
  type Quarter,
} from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/employee/checkins")({
  component: CheckInsPage,
});

const QUARTERS: Quarter[] = ["Q1", "Q2", "Q3", "Q4"];
const activeQuarter: Quarter = "Q2";

type Workspace = {
  source: "live" | "demo";
  goals: DemoGoal[];
};

function CheckInsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quarter, setQuarter] = useState<Quarter>(activeQuarter);

  const { data, isLoading } = useQuery({
    queryKey: ["checkin-workspace", user?.id],
    queryFn: async (): Promise<Workspace> => {
      if (!user) return { source: "demo", goals: getDemoGoalWorkspace().goals };
      try {
        const { data: goals, error } = await supabase
          .from("goals")
          .select("*, check_ins(*)")
          .eq("employee_id", user.id)
          .order("created_at", { ascending: false });
        if (error || !goals || goals.length === 0) {
          return { source: "demo", goals: getDemoGoalWorkspace(user.id).goals };
        }
        return { source: "live", goals: goals.map(normalizeGoal).filter((goal) => goal.status !== "archived") };
      } catch {
        return { source: "demo", goals: getDemoGoalWorkspace(user.id).goals };
      }
    },
    enabled: !!user,
  });

  const workspace = data ?? { source: "demo" as const, goals: getDemoGoalWorkspace(user?.id).goals };
  const submittedCount = workspace.goals.filter((goal) => goal.check_ins?.some((checkIn) => checkIn.quarter === quarter && checkIn.submitted_at)).length;
  const coverage = workspace.goals.length ? Math.round((submittedCount / workspace.goals.length) * 100) : 0;

  const saveCheckIn = useMutation({
    mutationFn: async ({ goal, checkIn }: { goal: DemoGoal; checkIn: Omit<DemoCheckIn, "id" | "goal_id" | "quarter"> & { submit: boolean } }) => {
      const submitted_at = checkIn.submit ? new Date().toISOString() : null;
      const existing = goal.check_ins?.find((row) => row.quarter === quarter);
      if (workspace.source === "demo") {
        upsertDemoCheckIn({
          id: existing?.id,
          goal_id: goal.id,
          quarter,
          actual: checkIn.actual,
          status: checkIn.status,
          self_comment: checkIn.self_comment,
          achievements: checkIn.achievements,
          blockers: checkIn.blockers,
          support_needed: checkIn.support_needed,
          rating: checkIn.rating,
          manager_feedback: existing?.manager_feedback ?? buildManagerFeedback(checkIn.status, checkIn.rating),
          submitted_at,
        });
        return;
      }

      const payload = {
        goal_id: goal.id,
        quarter,
        actual: checkIn.actual,
        status: checkIn.status === "blocked" ? "not_started" : checkIn.status,
        self_comment: [
          checkIn.self_comment,
          `Achievements: ${checkIn.achievements}`,
          `Blockers: ${checkIn.blockers || "None"}`,
          `Support needed: ${checkIn.support_needed || "None"}`,
          `Self rating: ${checkIn.rating}/5`,
        ].join("\n\n"),
      };
      const { error } = existing?.id
        ? await supabase.from("check_ins").update(payload).eq("id", existing.id)
        : await supabase.from("check_ins").insert(payload);
      if (error) throw error;
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["checkin-workspace", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["goal-workspace", user?.id] });
      toast.success(variables.checkIn.submit ? `${quarter} check-in submitted` : `${quarter} draft saved`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const quarterGoals = useMemo(() => workspace.goals, [workspace.goals]);

  return (
    <div>
      <PageHeader
        title="Quarterly Check-Ins"
        description="Complete self-review questions, update actuals, identify blockers, and prepare manager feedback."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/ai"><Sparkles className="mr-1.5 h-4 w-4" /> Check-in help</Link>
            </Button>
            <Badge variant="secondary">{workspace.source === "demo" ? "Demo-safe workflow" : "Live workflow"}</Badge>
          </>
        }
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <SectionCard title="Review cycle" description="Switch quarters and track completion coverage.">
          <Tabs value={quarter} onValueChange={(value) => setQuarter(value as Quarter)}>
            <TabsList>
              {QUARTERS.map((item) => <TabsTrigger key={item} value={item}>{item}</TabsTrigger>)}
            </TabsList>
          </Tabs>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Goals in scope" value={quarterGoals.length} />
            <Metric label="Submitted" value={submittedCount} />
            <Metric label="Coverage" value={`${coverage}%`} />
          </div>
          <div className="mt-4">
            <Progress value={coverage} className="h-2" />
          </div>
        </SectionCard>

        <SectionCard title="Review questions">
          <div className="space-y-3 text-sm">
            {[
              "What measurable progress did you make?",
              "What achievements should your manager know about?",
              "What blockers or risks need attention?",
              "What support would improve next-quarter delivery?",
            ].map((question) => (
              <div key={question} className="flex gap-2 rounded-lg border bg-muted/25 p-3">
                <MessageSquareText className="mt-0.5 h-4 w-4 text-accent" />
                <span>{question}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {isLoading ? (
        <Card className="p-6"><div className="h-28 animate-pulse rounded-lg bg-muted/40" /></Card>
      ) : quarterGoals.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<CalendarClock className="h-8 w-8" />}
            title="No goals to review"
            description="Create goals first, then return here to complete your quarterly check-ins."
            action={<Button asChild><Link to="/employee/goals">Create goals</Link></Button>}
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {quarterGoals.map((goal) => (
            <CheckInForm
              key={`${goal.id}-${quarter}`}
              goal={goal}
              quarter={quarter}
              saving={saveCheckIn.isPending}
              onSave={(checkIn) => saveCheckIn.mutate({ goal, checkIn })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CheckInForm({
  goal,
  quarter,
  saving,
  onSave,
}: {
  goal: DemoGoal;
  quarter: Quarter;
  saving: boolean;
  onSave: (checkIn: Omit<DemoCheckIn, "id" | "goal_id" | "quarter"> & { submit: boolean }) => void;
}) {
  const existing = goal.check_ins?.find((checkIn) => checkIn.quarter === quarter);
  const planned = Number(goal[`${quarter.toLowerCase()}_planned` as keyof DemoGoal] ?? Number(goal.target) / 4);
  const [actual, setActual] = useState(Number(existing?.actual ?? 0));
  const [status, setStatus] = useState<CheckInStatus>(existing?.status ?? "on_track");
  const [selfComment, setSelfComment] = useState(existing?.self_comment ?? "");
  const [achievements, setAchievements] = useState(existing?.achievements ?? "");
  const [blockers, setBlockers] = useState(existing?.blockers ?? "");
  const [supportNeeded, setSupportNeeded] = useState(existing?.support_needed ?? "");
  const [rating, setRating] = useState(existing?.rating ?? 4);

  useEffect(() => {
    setActual(Number(existing?.actual ?? 0));
    setStatus(existing?.status ?? "on_track");
    setSelfComment(existing?.self_comment ?? "");
    setAchievements(existing?.achievements ?? "");
    setBlockers(existing?.blockers ?? "");
    setSupportNeeded(existing?.support_needed ?? "");
    setRating(existing?.rating ?? 4);
  }, [existing?.actual, existing?.achievements, existing?.blockers, existing?.rating, existing?.self_comment, existing?.status, existing?.support_needed]);

  const progress = calcProgress({
    direction: goal.uom_direction,
    target: Number(planned) || Number(goal.target),
    actual,
  });
  const ready = selfComment.trim().length > 12 && achievements.trim().length > 8;
  const submitted = Boolean(existing?.submitted_at);

  const payload = (submit: boolean) => ({
    actual,
    status,
    self_comment: selfComment,
    achievements,
    blockers,
    support_needed: supportNeeded,
    rating,
    manager_feedback: existing?.manager_feedback ?? "",
    submitted_at: submit ? new Date().toISOString() : existing?.submitted_at ?? null,
    submit,
  });

  return (
    <SectionCard
      title={goal.title}
      description={`${goal.thrust_area} · Planned ${planned} · Target ${goal.target} · Weight ${goal.weightage}%`}
      actions={
        <div className="flex items-center gap-2">
          {submitted && <Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3" /> Submitted</Badge>}
          <StatusBadge status={status} />
        </div>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>Actual achieved</Label>
              <Input type="number" value={actual} onChange={(event) => setActual(Number(event.target.value))} />
            </div>
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as CheckInStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="on_track">On track</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Progress rating</Label>
              <div className="rounded-md border px-3 py-2">
                <Slider value={[rating]} min={1} max={5} step={1} onValueChange={([value]) => setRating(value ?? 4)} />
                <div className="mt-2 text-xs text-muted-foreground">{rating}/5 self rating</div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Self-review summary</Label>
              <Textarea rows={4} value={selfComment} onChange={(event) => setSelfComment(event.target.value)} placeholder="Summarize progress, decisions, and confidence." />
            </div>
            <div className="grid gap-1.5">
              <Label>Achievement highlights</Label>
              <Textarea rows={4} value={achievements} onChange={(event) => setAchievements(event.target.value)} placeholder="List the outcomes, shipped work, or measurable wins." />
            </div>
            <div className="grid gap-1.5">
              <Label>Blockers and challenges</Label>
              <Textarea rows={3} value={blockers} onChange={(event) => setBlockers(event.target.value)} placeholder="Name risks, dependencies, or missed assumptions." />
            </div>
            <div className="grid gap-1.5">
              <Label>Support requested</Label>
              <Textarea rows={3} value={supportNeeded} onChange={(event) => setSupportNeeded(event.target.value)} placeholder="Ask for manager decisions, resources, or alignment." />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" disabled={saving} onClick={() => onSave(payload(false))}>
              <Save className="mr-1.5 h-4 w-4" /> Save draft
            </Button>
            <Button disabled={saving || !ready} onClick={() => onSave(payload(true))}>
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
              Submit check-in
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/25 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>Planned vs actual</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Progress uses the quarter plan when available, otherwise the annual target is split evenly.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Bot className="h-4 w-4 text-accent" /> Copilot prompt
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Ask Momentum AI Copilot to turn this check-in into a manager-ready weekly summary with wins, blockers, and next actions.
            </p>
            <Button asChild className="mt-3 w-full" variant="outline">
              <Link to="/ai"><Sparkles className="mr-1.5 h-4 w-4" /> Open Copilot</Link>
            </Button>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="mb-2 text-sm font-medium">Manager feedback</div>
            <p className="text-sm leading-6 text-muted-foreground">
              {existing?.manager_feedback || "Feedback will appear here after your manager reviews this check-in."}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function normalizeGoal(goal: any): DemoGoal {
  return {
    ...goal,
    target: Number(goal.target ?? 100),
    weightage: Number(goal.weightage ?? 10),
    priority: goal.priority ?? "Medium",
    description: goal.description ?? null,
    is_shared: Boolean(goal.is_shared),
    shared_goal_id: goal.shared_goal_id ?? null,
    check_ins: (goal.check_ins ?? []).map((checkIn: any) => ({
      id: checkIn.id,
      goal_id: checkIn.goal_id,
      quarter: checkIn.quarter,
      actual: checkIn.actual,
      status: checkIn.status === "completed" ? "completed" : checkIn.status === "on_track" ? "on_track" : "not_started",
      self_comment: checkIn.self_comment ?? "",
      achievements: "",
      blockers: "",
      support_needed: "",
      rating: 4,
      manager_feedback: "",
      submitted_at: checkIn.created_at ?? null,
    })),
  };
}

function buildManagerFeedback(status: CheckInStatus, rating: number) {
  if (status === "blocked") return "Thanks for naming the blocker. Please add the decision needed and owner for next review.";
  if (rating >= 5) return "Excellent progress. Capture the pattern so the team can reuse it.";
  if (rating <= 2) return "Let's schedule coaching time and identify the smallest recovery action.";
  return "Solid update. Keep the next milestone and dependency owner visible.";
}
