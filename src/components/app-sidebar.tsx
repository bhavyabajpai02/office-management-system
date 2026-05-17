import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bell,
  Bot,
  CalendarClock,
  CheckSquare,
  ClipboardCheck,
  FileText,
  FileSearch,
  LayoutDashboard,
  LineChart,
  LogOut,
  PanelsTopLeft,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Target,
  Users,
  Activity,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { getDemoPermissions } from "@/lib/demo-workflows";
import { Logo } from "@/components/Logo";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
};

const sharedAccountItems: NavItem[] = [
  { title: "AI Copilot", url: "/ai", icon: Bot },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Settings", url: "/settings", icon: Settings },
];

const navByRole: Record<AppRole, { label: string; items: NavItem[] }[]> = {
  employee: [
    {
      label: "Workspace",
      items: [
        { title: "Dashboard", url: "/employee", icon: LayoutDashboard },
        { title: "My Goals", url: "/employee/goals", icon: Target },
        {
          title: "Create Goal",
          url: "/employee/create-goal",
          icon: ClipboardCheck,
          requiredPermission: "create_goals",
        },
        {
          title: "Quarterly Check-Ins",
          url: "/employee/checkins",
          icon: CheckSquare,
          requiredPermission: "submit_checkins",
        },
        { title: "Activity History", url: "/employee/activity", icon: Activity },
      ],
    },
    { label: "Account", items: sharedAccountItems },
  ],
  manager: [
    {
      label: "Team",
      items: [
        { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
        { title: "Team Overview", url: "/manager", icon: Users },
        { title: "Team Analytics", url: "/manager/analytics", icon: BarChart3 },
        { title: "Team Check-Ins", url: "/manager/team", icon: Users },
        { title: "Shared Goals", url: "/manager/shared", icon: Share2 },
        {
          title: "Goal Approvals",
          url: "/manager/approvals",
          icon: ClipboardCheck,
          requiredPermission: "approve_goals",
        },
        { title: "Activity Feed", url: "/manager/activity", icon: Activity },
      ],
    },
    { label: "Account", items: sharedAccountItems },
  ],
  admin: [
    {
      label: "Organization",
      items: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
        {
          title: "User Management",
          url: "/admin/users",
          icon: Users,
          requiredPermission: "manage_users",
        },
        {
          title: "Audit Logs",
          url: "/admin/audit",
          icon: FileSearch,
          requiredPermission: "view_audit",
        },
        { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
        { title: "Escalations", url: "/admin/escalations", icon: ShieldAlert },
        { title: "Organization Activity", url: "/admin/activity", icon: Activity },
        {
          title: "Platform Settings",
          url: "/admin/settings",
          icon: Settings,
          requiredPermission: "configure_platform",
        },
        {
          title: "Security & Permissions",
          url: "/admin/security",
          icon: ShieldCheck,
          requiredPermission: "configure_platform",
        },
      ],
    },
    { label: "Account", items: sharedAccountItems },
  ],
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile, role, signOut } = useAuth();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const { data: allPermissions = [] } = useQuery({
    queryKey: ["demo-permissions"],
    queryFn: async () => getDemoPermissions(),
  });

  const userPermissions = allPermissions.find((p) => p.role === role)?.permissions ?? {};

  const sections = role
    ? navByRole[role]
        .map((section) => ({
          ...section,
          items: section.items.filter(
            (item) => !item.requiredPermission || userPermissions[item.requiredPermission],
          ),
        }))
        .filter((section) => section.items.length > 0)
    : [];

  const initials = (profile?.full_name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border/70">
      <SidebarHeader className="border-b border-sidebar-border/60">
        <Link to="/" className="flex items-center gap-2 px-2 py-2 hover:opacity-80 transition-opacity outline-none">
          {collapsed ? (
            <Logo variant="icon" className="text-accent" />
          ) : (
            <div className="flex flex-col">
              <Logo />
              <div className="text-[11px] font-medium tracking-wide capitalize text-sidebar-foreground/50 mt-1 pl-1">
                {role ?? "workspace"} portal
              </div>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1 py-2">
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active =
                    pathname === item.url ||
                    (item.url !== `/${role}` && pathname.startsWith(`${item.url}/`));
                  return (
                    <SidebarMenuItem key={`${section.label}-${item.title}-${item.url}`}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to={item.url} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60">
        <div className="flex items-center gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-white text-xs text-slate-950">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                {profile?.full_name ?? "Momentum user"}
              </div>
              <div className="truncate text-[11px] text-sidebar-foreground/60">
                {profile?.email}
              </div>
            </div>
          )}
          {!collapsed && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-sidebar-foreground/70 hover:bg-white/10 hover:text-sidebar-foreground"
              onClick={() => signOut()}
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
