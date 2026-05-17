import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Check, CheckCheck, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getDemoNotifications, markAllDemoNotificationsRead, markDemoNotificationRead } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [localRead, setLocalRead] = useState<string[]>([]);

  const { data: liveItems = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const demoItems = getDemoNotifications(role);
  const items = (liveItems.length ? liveItems : demoItems).map((item) => ({
    ...item,
    read: item.read || localRead.includes(item.id),
  }));

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith("demo") || id.startsWith("notif-")) {
        markDemoNotificationRead(id);
        return;
      }
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      setLocalRead((current) => [...new Set([...current, id])]);
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      toast.success("Notification marked as read");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const markAllRead = () => {
    markAllDemoNotificationsRead(role);
    setLocalRead(items.map((item) => item.id));
    toast.success("All visible notifications marked as read");
  };

  const unreadCount = items.filter((item) => !item.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Goal submissions, approvals, reminders, AI insights, and escalation updates."
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
          </Button>
        }
      />

      <SectionCard
        title="Momentum AI activity"
        description={`${unreadCount} unread update${unreadCount === 1 ? "" : "s"} across your workspace.`}
      >
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Bell className="h-8 w-8" />}
            title="All caught up"
            description="Momentum AI will surface approvals, reminders, and AI recommendations here."
          />
        ) : (
          <ul className="divide-y overflow-hidden rounded-lg border">
            {items.map((notification) => (
              <li
                key={notification.id}
                className="flex flex-col gap-3 bg-card p-4 transition hover:bg-muted/35 sm:flex-row sm:items-start"
              >
                <div
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    notification.read ? "bg-muted" : "bg-accent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium text-sm">{notification.title}</div>
                    {!notification.read && <Badge variant="secondary">New</Badge>}
                  </div>
                  {notification.message && (
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                      {notification.message}
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(notification.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 sm:justify-end">
                  {"href" in notification && notification.href && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={notification.href as string}>
                        <Sparkles className="mr-1 h-4 w-4" /> Open
                      </Link>
                    </Button>
                  )}
                  {!notification.read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(notification.id)}
                    >
                      <Check className="mr-1 h-4 w-4" /> Mark read
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
