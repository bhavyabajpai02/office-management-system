import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, SectionCard } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDemoPermissions,
  updateDemoPermission,
  type DemoPermissionRole,
} from "@/lib/demo-workflows";

export const Route = createFileRoute("/_app/admin/security")({
  component: SecurityPermissionsPage,
});

const permissionDetails: Record<string, { label: string; description: string }> = {
  create_goals: { label: "Create goals", description: "Allow creating new goals and objectives." },
  submit_checkins: {
    label: "Submit check-ins",
    description: "Allow submitting quarterly progress check-ins.",
  },
  approve_goals: {
    label: "Approve goals",
    description: "Allow reviewing and approving team goal sheets.",
  },
  manage_users: { label: "Manage users", description: "Allow inviting and editing user profiles." },
  view_audit: {
    label: "View audit logs",
    description: "Allow access to the organization's activity audit logs.",
  },
  configure_platform: {
    label: "Configure platform",
    description: "Allow modifying settings and permissions.",
  },
};

function SecurityPermissionsPage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<string | null>(null);

  const { data: permissions = [] } = useQuery({
    queryKey: ["demo-permissions"],
    queryFn: async () => getDemoPermissions(),
  });

  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    permissions.forEach((r) => Object.keys(r.permissions).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [permissions]);

  const togglePermission = async (
    role: DemoPermissionRole["role"],
    permission: string,
    current: boolean,
  ) => {
    setSaving(`${role}-${permission}`);
    try {
      // Simulate network delay for realism
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateDemoPermission(role, permission, !current);
      queryClient.invalidateQueries({ queryKey: ["demo-permissions"] });
      toast.success(`${role} permission updated`);
    } catch (error) {
      toast.error("Failed to update permission");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Security & Permissions"
        description="Configure role-based access control (RBAC) and feature availability across the organization."
      />

      <div className="grid gap-6">
        <SectionCard
          title="Role Permissions Matrix"
          description="Toggle access for Employee, Manager, and Admin roles."
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Permission / Feature</TableHead>
                  {permissions.map((p) => (
                    <TableHead key={p.role} className="capitalize text-center">
                      {p.role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {allKeys.map((key) => {
                  const details = permissionDetails[key] || { label: key, description: "" };
                  return (
                    <TableRow key={key}>
                      <TableCell>
                        <div className="font-medium">{details.label}</div>
                        <div className="text-xs text-muted-foreground">{details.description}</div>
                      </TableCell>
                      {permissions.map((p) => {
                        const enabled = p.permissions[key] ?? false;
                        const isSaving = saving === `${p.role}-${key}`;
                        return (
                          <TableCell key={p.role} className="text-center">
                            <div className="flex justify-center items-center">
                              {isSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : (
                                <Switch
                                  checked={enabled}
                                  onCheckedChange={() => togglePermission(p.role, key, enabled)}
                                />
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
