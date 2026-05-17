interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-8">
        {icon && (
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-card text-muted-foreground shadow-sm">
            {icon}
          </div>
        )}
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
