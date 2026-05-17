import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function StatCard({ label, value, hint, icon, trend, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group overflow-hidden border-border/70 bg-card/95 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        {icon && (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-3 flex min-h-4 items-center justify-between gap-2 text-xs">
        {hint && <span className="text-muted-foreground">{hint}</span>}
        {trend && (
          <span className={cn("font-medium", trend.positive ? "text-success" : "text-destructive")}>
            {trend.value}
          </span>
        )}
      </div>
    </Card>
  );
}
