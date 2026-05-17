import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, ClipboardCheck, MessageSquareText, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
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
import { decideDemoSheet, getDemoApprovalSheets } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/manager/approvals")({
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ["all-pending-sheets", user?.id],
    queryFn: async () => {
      try {
        const { data: team } = await supabase
          .from("profiles")
          .select("id, full_name, department")
          .eq("manager_id", user!.id);
        const ids = (team ?? []).map((member) => member.id);
        if (ids.length === 0) return getDemoApprovalSheets();
        const { data } = await supabase
          .from("goal_sheets")
          .select("*, profiles!goal_sheets_employee_id_fkey(full_name, department), goals(*)")
          .in("employee_id", ids)
          .eq("status", "submitted");
        return data && data.length > 0 ? data : getDemoApprovalSheets();
      } catch {
        return getDemoApprovalSheets();
      }
    },
    enabled: !!user,
  });

  const decision = useMutation({
    mutationFn: async ({
      sheetId,
      action,
    }: {
      sheetId: string;
      action: "approve" | "reject" | "rework";
    }) => {
      if (sheetId.startsWith("demo")) {
        decideDemoSheet(action);
        return;
      }
      if (action === "approve") {
        const { error } = await supabase
          .from("goal_sheets")
          .update({
            status: "approved",
            approved_at: new Date().toISOString(),
            approved_by: user!.id,
            locked_at: new Date().toISOString(),
          })
          .eq("id", sheetId);
        if (error) throw error;
        await supabase.from("goals").update({ status: "locked" }).eq("sheet_id", sheetId);
      } else if (action === "rework") {
        await supabase
          .from("goal_sheets")
          .update({
            status: "draft",
            rework_comment: "Please sharpen KPIs and confirm quarterly milestones.",
          })
          .eq("id", sheetId);
        await supabase.from("goals").update({ status: "rework_requested" }).eq("sheet_id", sheetId);
      } else {
        await supabase.from("goal_sheets").update({ status: "draft" }).eq("id", sheetId);
        await supabase.from("goals").update({ status: "draft" }).eq("sheet_id", sheetId);
      }
    },
    onSuccess: (_result, variables) => {
      const label =
        variables.action === "approve"
          ? "approved"
          : variables.action === "rework"
            ? "sent back for rework"
            : "rejected";
      toast.success(`Goal sheet ${label}`);
      queryClient.invalidateQueries({ queryKey: ["all-pending-sheets", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["goal-workspace"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <PageHeader
        title="Approval Queue"
        description="Review, approve, reject, or request rework on submitted goal sheets."
        actions={<Badge variant="secondary">{sheets.length} ready for review</Badge>}
      />

      {isLoading ? (
        <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
      ) : sheets.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<ClipboardCheck className="h-8 w-8" />}
            title="Nothing to approve"
            description="No goal sheets are awaiting review."
          />
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {sheets.map((sheet: any) => {
            const totalWeight = (sheet.goals ?? []).reduce(
              (sum: number, goal: any) => sum + Number(goal.weightage ?? 0),
              0,
            );
            return (
              <SectionCard
                key={sheet.id}
                title={sheet.profiles?.full_name ?? "Alex Morgan"}
                description={`${sheet.profiles?.department ?? "Engineering"} · ${sheet.goals?.length ?? 0} goals submitted`}
                actions={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decision.isPending}
                      onClick={() => decision.mutate({ sheetId: sheet.id, action: "rework" })}
                    >
                      <Undo2 className="mr-1 h-4 w-4" /> Rework
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decision.isPending}
                      onClick={() => decision.mutate({ sheetId: sheet.id, action: "reject" })}
                    >
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      disabled={decision.isPending}
                      onClick={() => decision.mutate({ sheetId: sheet.id, action: "approve" })}
                    >
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                  </div>
                }
              >
                <div className="mb-4 grid gap-3 md:grid-cols-3">
                  <ReviewSignal
                    icon={<ClipboardCheck className="h-4 w-4" />}
                    label="Goals submitted"
                    value={sheet.goals?.length ?? 0}
                  />
                  <ReviewSignal
                    icon={<AlertTriangle className="h-4 w-4" />}
                    label="Weightage balance"
                    value={`${totalWeight}%`}
                    progress={Math.min(totalWeight, 100)}
                  />
                  <ReviewSignal
                    icon={<MessageSquareText className="h-4 w-4" />}
                    label="Review note"
                    value={totalWeight === 100 ? "Ready to approve" : "Needs rework"}
                  />
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal</TableHead>
                      <TableHead>Thrust</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sheet.goals?.map((goal: any) => (
                      <TableRow key={goal.id}>
                        <TableCell className="max-w-md">
                          <div className="font-medium">{goal.title}</div>
                          {goal.description && (
                            <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                              {goal.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{goal.thrust_area}</TableCell>
                        <TableCell>{Number(goal.target)}</TableCell>
                        <TableCell>{Number(goal.weightage)}%</TableCell>
                        <TableCell>
                          <StatusBadge status={goal.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewSignal({
  icon,
  label,
  value,
  progress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  progress?: number;
}) {
  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="mb-2 text-accent">{icon}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
      {typeof progress === "number" && <Progress value={progress} className="mt-2 h-2" />}
    </div>
  );
}
