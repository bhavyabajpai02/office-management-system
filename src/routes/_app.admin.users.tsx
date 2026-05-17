import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, MailPlus, Search, UserCog, Users } from "lucide-react";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getDemoUsers, inviteDemoUser, updateDemoUser } from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin/users")({
  component: UsersPage,
});

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  department: string | null;
  job_title: string | null;
  manager_id: string | null;
  created_at?: string | null;
  status?: "active" | "invited" | "deactivated";
  user_roles?: Array<{ role: string }>;
};

const demoToUserRow = (user: ReturnType<typeof getDemoUsers>[number]): UserRow => ({
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  department: user.department,
  job_title: user.job_title,
  manager_id: user.manager_id,
  status: user.status,
  created_at: user.created_at,
  user_roles: [{ role: user.role }],
});

function UsersPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: users = getDemoUsers().map(demoToUserRow), isLoading } = useQuery({
    queryKey: ["all-users", refreshKey],
    queryFn: async () => {
      const [{ data: profiles, error }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (error || !profiles || profiles.length === 0) return getDemoUsers().map(demoToUserRow);
      return profiles.map((profile) => ({
        ...profile,
        status: "active",
        user_roles: (roles ?? []).filter((role) => role.user_id === profile.id).map((role) => ({ role: role.role })),
      })) as UserRow[];
    },
  });

  const visibleUsers = users;

  const filtered = useMemo(() => {
    return visibleUsers.filter((user) => {
      const hay = `${user.full_name ?? ""} ${user.email ?? ""} ${user.department ?? ""} ${user.job_title ?? ""} ${user.user_roles?.[0]?.role ?? ""}`.toLowerCase();
      return hay.includes(search.toLowerCase());
    });
  }, [visibleUsers, search]);

  const exportUsers = () => {
    const csv = [
      ["Name", "Email", "Department", "Title", "Role"],
      ...filtered.map((user) => [user.full_name ?? "", user.email ?? "", user.department ?? "", user.job_title ?? "", user.user_roles?.[0]?.role ?? "employee"]),
    ].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Users exported");
  };

  const roleCount = (role: string) => visibleUsers.filter((user) => user.user_roles?.[0]?.role === role).length;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage employees, managers, admins, departments, and reporting visibility."
        actions={
          <>
            <Button variant="outline" onClick={exportUsers}><Download className="mr-1.5 h-4 w-4" /> Export</Button>
            <Button onClick={() => setInviteOpen(true)}>
              <MailPlus className="mr-1.5 h-4 w-4" /> Invite user
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={visibleUsers.length} icon={<Users className="h-4 w-4" />} />
        <StatCard label="Employees" value={roleCount("employee")} icon={<UserCog className="h-4 w-4" />} />
        <StatCard label="Managers" value={roleCount("manager")} icon={<UserCog className="h-4 w-4" />} />
        <StatCard label="Admins" value={roleCount("admin")} icon={<UserCog className="h-4 w-4" />} />
      </div>

      <SectionCard>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users, departments, titles, or roles..." />
        </div>

        {isLoading && <div className="mb-3 rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">Loading users...</div>}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.id} className="cursor-pointer" onClick={() => setSelected(user)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-accent text-xs text-accent-foreground">
                        {initials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.full_name ?? "Unnamed user"}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email ?? "-"}</TableCell>
                <TableCell><Badge variant="outline">{user.department ?? "Unassigned"}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{user.job_title ?? "-"}</TableCell>
                <TableCell><RoleBadge role={user.user_roles?.[0]?.role ?? "employee"} /></TableCell>
                <TableCell><StatusBadge status={user.status ?? "active"} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selected?.full_name ?? "User profile"}</SheetTitle>
            <SheetDescription>{selected?.email}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              {[
                ["Department", selected.department ?? "Unassigned"],
                ["Title", selected.job_title ?? "-"],
                ["Role", selected.user_roles?.[0]?.role ?? "employee"],
                ["Manager ID", selected.manager_id ?? "None"],
                ["Status", selected.status ?? "active"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border bg-muted/25 p-3">
                  <div className="text-xs text-muted-foreground">{label}</div>
                  <div className="mt-1 font-medium capitalize">{value}</div>
                </div>
              ))}
              <Button className="w-full" onClick={() => toast.success("Role review request created")}>
                Request role review
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextRole = selected.user_roles?.[0]?.role === "employee" ? "manager" : "employee";
                    updateDemoUser(selected.id, { role: nextRole as "employee" | "manager" });
                    setRefreshKey((key) => key + 1);
                    setSelected({ ...selected, user_roles: [{ role: nextRole }] });
                    toast.success("Role updated and notification sent");
                  }}
                >
                  Toggle role
                </Button>
                <Button
                  variant={selected.status === "deactivated" ? "outline" : "destructive"}
                  onClick={() => {
                    const nextStatus = selected.status === "deactivated" ? "active" : "deactivated";
                    updateDemoUser(selected.id, { status: nextStatus });
                    setRefreshKey((key) => key + 1);
                    setSelected({ ...selected, status: nextStatus });
                    toast.success(nextStatus === "active" ? "User reactivated" : "User deactivated");
                  }}
                >
                  {selected.status === "deactivated" ? "Reactivate" : "Deactivate"}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={(user) => {
          inviteDemoUser({
            full_name: user.full_name ?? "New user",
            email: user.email ?? "new.user@momentum.ai",
            department: user.department ?? "Unassigned",
            job_title: user.job_title ?? "Team member",
            manager_id: user.manager_id,
            role: (user.user_roles?.[0]?.role ?? "employee") as "employee" | "manager" | "admin",
          });
          setRefreshKey((key) => key + 1);
          setInviteOpen(false);
          toast.success("User invite created");
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: UserRow["status"] }) {
  if (status === "deactivated") return <Badge variant="destructive">Deactivated</Badge>;
  if (status === "invited") return <Badge variant="outline">Invited</Badge>;
  return <Badge variant="secondary">Active</Badge>;
}

function InviteDialog({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (user: UserRow) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Engineering");
  const [title, setTitle] = useState("Team member");
  const [role, setRole] = useState("employee");

  const submit = () => {
    if (!name.trim() || !email.includes("@")) {
      toast.error("Add a valid name and email");
      return;
    }
    onInvite({
      id: `invite-${Date.now()}`,
      full_name: name.trim(),
      email: email.trim(),
      department,
      job_title: title,
      manager_id: null,
      user_roles: [{ role }],
    });
    setName("");
    setEmail("");
    setTitle("Team member");
    setRole("employee");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>Create a visible pending user record for HR review and onboarding.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Full name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Department</Label>
              <Input value={department} onChange={(event) => setDepartment(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Create invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function initials(name: string | null) {
  return (name ?? "U")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  if (role === "admin") return <Badge>Admin</Badge>;
  if (role === "manager") return <Badge className="bg-info text-info-foreground hover:bg-info">Manager</Badge>;
  return <Badge variant="secondary">Employee</Badge>;
}
