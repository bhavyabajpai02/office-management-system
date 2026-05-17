import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const map: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-info/15 text-info border-info/20",
  rework_requested: "bg-warning/15 text-warning-foreground border-warning/30",
  approved: "bg-success/15 text-success border-success/20",
  locked: "bg-primary/10 text-primary border-primary/20",
  not_started: "bg-muted text-muted-foreground",
  on_track: "bg-info/15 text-info border-info/20",
  completed: "bg-success/15 text-success border-success/20",
};

const labels: Record<string, string> = {
  rework_requested: "Rework",
  not_started: "Not started",
  on_track: "On track",
};

export function StatusBadge({ status }: { status: string }) {
  const className = map[status] ?? "bg-muted text-muted-foreground";
  const label = labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge variant="outline" className={cn("font-medium border", className)}>
      {label}
    </Badge>
  );
}
