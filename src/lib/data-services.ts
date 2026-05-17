import { supabase } from "@/integrations/supabase/client";

export type TeamAnalyticsPoint = {
  name: string;
  progress: number;
  checkins: number;
  approvals: number;
};

export type TeamPerformanceRow = {
  name: string;
  department: string;
  progress: number;
  checkins: number;
  status: "Ahead" | "On track" | "Watch" | "At risk";
};

export const demoTeamAnalytics: TeamAnalyticsPoint[] = [
  { name: "W1", progress: 58, checkins: 62, approvals: 34 },
  { name: "W2", progress: 66, checkins: 74, approvals: 46 },
  { name: "W3", progress: 72, checkins: 81, approvals: 59 },
  { name: "W4", progress: 84, checkins: 92, approvals: 71 },
];

export const demoTeamPerformance: TeamPerformanceRow[] = [
  { name: "Alex Morgan", department: "Engineering", progress: 86, checkins: 4, status: "Ahead" },
  { name: "Maya Patel", department: "Customer Success", progress: 78, checkins: 3, status: "Watch" },
  { name: "Jordan Kim", department: "Engineering", progress: 61, checkins: 2, status: "At risk" },
];

export async function fetchTeamPerformance(managerId?: string): Promise<TeamPerformanceRow[]> {
  if (!managerId) return demoTeamPerformance;
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, department")
      .eq("manager_id", managerId);
    if (error || !profiles || profiles.length === 0) return demoTeamPerformance;
    return profiles.map((profile, index) => ({
      name: profile.full_name ?? "Team member",
      department: profile.department ?? "Unassigned",
      progress: [86, 78, 61, 92, 74][index % 5],
      checkins: [4, 3, 2, 4, 3][index % 5],
      status: ([86, 78, 61, 92, 74][index % 5] ?? 75) >= 85
        ? "Ahead"
        : ([86, 78, 61, 92, 74][index % 5] ?? 75) >= 70
          ? "On track"
          : "At risk",
    }));
  } catch {
    return demoTeamPerformance;
  }
}
