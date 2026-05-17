import {
  createFileRoute,
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bell, Loader2, Search, Settings } from "lucide-react";
import { toast } from "sonner";
import { useAuth, roleDashboardPath, type AppRole } from "@/lib/auth-context";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getDemoNotifications } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { loading, user, role } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (loading || !user || !role) return;
    const rolePrefixes = {
      admin: "/admin",
      manager: "/manager",
      employee: "/employee",
    } as const;
    const wrongRolePath = Object.entries(rolePrefixes).some(
      ([prefixRole, prefix]) => prefixRole !== role && pathname.startsWith(prefix),
    );
    if (wrongRolePath) {
      navigate({ to: roleDashboardPath(role), replace: true });
      toast.info("Opened your authorized workspace");
    }
  }, [loading, navigate, pathname, role, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const runSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const query = search.trim().toLowerCase();
    if (!query) return;

    if (query.includes("approval")) {
      navigate({ to: role === "manager" ? "/manager/approvals" : "/admin/analytics" });
    } else if (query.includes("audit")) {
      navigate({ to: role === "admin" ? "/admin/audit" : "/notifications" });
    } else if (query.includes("team")) {
      navigate({ to: role === "manager" ? "/manager/team" : roleDashboardPath(role) });
    } else if (query.includes("ai")) {
      navigate({ to: "/ai" });
    } else if (query.includes("goal")) {
      navigate({
        to:
          role === "employee"
            ? "/employee/goals"
            : role === "manager"
              ? "/manager/shared"
              : "/admin/analytics",
      });
    } else {
      navigate({ to: roleDashboardPath(role) });
    }

    toast.success(`Opened best match for "${search.trim()}"`);
    setSearch("");
  };

  const unreadCount = getDemoNotifications(role).filter((item) => !item.read).length;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[linear-gradient(180deg,var(--background),var(--muted))]">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b bg-background/85 px-4 sticky top-0 z-30 backdrop-blur-xl">
            <SidebarTrigger />
            <form onSubmit={runSearch} className="hidden md:flex items-center flex-1 max-w-md ml-2">
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search goals, employees, departments..."
                  className="pl-8 h-9 bg-muted/45 border-transparent shadow-none focus-visible:bg-background"
                />
              </div>
            </form>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link to="/notifications">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background" />
                  )}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="icon">
                <Link to="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
              <RoleBadge role={role} />
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function RoleBadge({ role }: { role: AppRole | null }) {
  if (!role) return null;
  const label = role === "admin" ? "HR / Admin" : role === "manager" ? "Manager" : "Employee";
  return (
    <Link
      to={roleDashboardPath(role)}
      className="hidden sm:inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground capitalize"
    >
      {label}
    </Link>
  );
}
