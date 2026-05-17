import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronRight, Loader2, ArrowLeft, Target, AlignLeft, BarChart } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
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
import { THRUST_AREAS, type UomDirection } from "@/lib/progress";
import {
  createDemoGoal,
  getDemoGoalWorkspace,
  type DemoGoal,
  type Priority,
} from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/employee/create-goal")({
  component: CreateGoalWizard,
});

const UOM_OPTIONS: { value: DemoGoal["uom_type"]; label: string; direction: UomDirection }[] = [
  { value: "numeric", label: "Numeric", direction: "min" },
  { value: "percentage", label: "Percentage", direction: "min" },
  { value: "timeline", label: "Timeline", direction: "timeline" },
  { value: "zero_based", label: "Zero-based", direction: "zero" },
];

function CreateGoalWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thrustArea, setThrustArea] = useState(THRUST_AREAS[0]);
  const [priority, setPriority] = useState<Priority>("Medium");
  const [uom, setUom] = useState<DemoGoal["uom_type"]>("percentage");
  const [target, setTarget] = useState("100");
  const [weightage, setWeightage] = useState("20");
  const [deadline, setDeadline] = useState("");

  const { data: workspace } = useQuery({
    queryKey: ["goal-workspace", user?.id, currentYear],
    queryFn: async () => {
      if (!user) return { source: "demo", ...getDemoGoalWorkspace() };
      const { data: sheet } = await supabase
        .from("goal_sheets")
        .select("*")
        .eq("employee_id", user.id)
        .eq("year", currentYear)
        .maybeSingle();
      if (!sheet) return { source: "demo", ...getDemoGoalWorkspace(user.id) };
      return { source: "live", sheet };
    },
    enabled: !!user,
  });

  const saveGoal = useMutation({
    mutationFn: async () => {
      if (!user || !workspace) throw new Error("Workspace not ready");
      const patch = {
        title: title.trim(),
        description: description.trim() || null,
        thrust_area: thrustArea,
        target: Number(target),
        weightage: Number(weightage),
        deadline: deadline || null,
        uom_type: uom,
        uom_direction: UOM_OPTIONS.find((o) => o.value === uom)?.direction ?? "min",
        priority,
      };

      if (workspace.source === "demo") {
        createDemoGoal({
          sheet_id: workspace.sheet.id,
          employee_id: user.id,
          title: patch.title,
          description: patch.description,
          thrust_area: patch.thrust_area,
          target: patch.target,
          weightage: patch.weightage,
          deadline: patch.deadline,
          uom_type: patch.uom_type,
          uom_direction: patch.uom_direction,
          priority: patch.priority,
          status: "draft",
          is_shared: false,
          shared_goal_id: null,
          q1_planned: Math.round(patch.target * 0.25),
          q2_planned: Math.round(patch.target * 0.5),
          q3_planned: Math.round(patch.target * 0.75),
          q4_planned: patch.target,
        });
        return;
      }

      const { error } = await supabase.from("goals").insert({
        ...patch,
        sheet_id: workspace.sheet.id,
        employee_id: user.id,
        status: "draft",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goal-workspace"] });
      toast.success("Goal created successfully");
      navigate({ to: "/employee/goals" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const canProceedStep1 = title.trim().length > 3;
  const canProceedStep2 = thrustArea && priority;
  const canProceedStep3 = Number(target) > 0 && Number(weightage) >= 10 && Number(weightage) <= 100;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/employee/goals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <PageHeader
            title="Create New Goal"
            description="Define a measurable outcome, alignment, and tracking metrics."
          />
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <StepIndicator
          step={1}
          current={step}
          label="Details"
          icon={<AlignLeft className="h-4 w-4" />}
        />
        <div className="h-px flex-1 bg-border mx-4" />
        <StepIndicator
          step={2}
          current={step}
          label="Alignment"
          icon={<Target className="h-4 w-4" />}
        />
        <div className="h-px flex-1 bg-border mx-4" />
        <StepIndicator
          step={3}
          current={step}
          label="Metrics"
          icon={<BarChart className="h-4 w-4" />}
        />
      </div>

      <SectionCard>
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-2">
              <Label>What do you want to achieve?</Label>
              <Input
                placeholder="e.g. Improve enterprise onboarding completion rate"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                className="text-lg py-6"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Textarea
                placeholder="Add context, expected outcomes, or specific deliverables..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button disabled={!canProceedStep1} onClick={() => setStep(2)}>
                Continue <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Strategic Thrust Area</Label>
                <Select value={thrustArea} onValueChange={setThrustArea}>
                  <SelectTrigger className="h-12">
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
                <p className="text-xs text-muted-foreground mt-1">
                  Which company objective does this align with?
                </p>
              </div>
              <div className="space-y-2">
                <Label>Priority Level</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button disabled={!canProceedStep2} onClick={() => setStep(3)}>
                Continue <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <Select value={uom} onValueChange={(v) => setUom(v as DemoGoal["uom_type"])}>
                  <SelectTrigger className="h-12">
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
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  min={1}
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="h-12 text-lg tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label>Weightage (%)</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={weightage}
                  onChange={(e) => setWeightage(e.target.value)}
                  className="h-12 text-lg tabular-nums"
                />
                <p className="text-xs text-muted-foreground mt-1">Minimum 10% per goal</p>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="h-12"
                />
              </div>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                disabled={!canProceedStep3 || saveGoal.isPending}
                onClick={() => saveGoal.mutate()}
              >
                {saveGoal.isPending ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-1.5 h-4 w-4" />
                )}
                Create Goal
              </Button>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function StepIndicator({
  step,
  current,
  label,
  icon,
}: {
  step: number;
  current: number;
  label: string;
  icon: React.ReactNode;
}) {
  const isCompleted = current > step;
  const isCurrent = current === step;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${isCurrent || isCompleted ? "text-primary" : "text-muted-foreground"}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors
        ${
          isCompleted
            ? "bg-primary border-primary text-primary-foreground"
            : isCurrent
              ? "border-primary text-primary bg-primary/10"
              : "border-muted-foreground/30 bg-muted/20"
        }`}
      >
        {isCompleted ? <Check className="h-5 w-5" /> : icon}
      </div>
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
  );
}
