import type { UomDirection } from "@/lib/progress";

export type GoalStatus = "draft" | "submitted" | "rework_requested" | "approved" | "locked" | "archived";
export type CheckInStatus = "not_started" | "on_track" | "blocked" | "completed";
export type Priority = "High" | "Medium" | "Low";
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export type DemoCheckIn = {
  id: string;
  goal_id: string;
  quarter: Quarter;
  actual: number | null;
  status: CheckInStatus;
  self_comment: string;
  achievements: string;
  blockers: string;
  support_needed: string;
  rating: number;
  manager_feedback: string;
  submitted_at: string | null;
};

export type DemoGoal = {
  id: string;
  sheet_id: string;
  employee_id: string;
  thrust_area: string;
  title: string;
  description: string | null;
  uom_type: "numeric" | "percentage" | "timeline" | "zero_based";
  uom_direction: UomDirection;
  target: number;
  weightage: number;
  deadline: string | null;
  status: GoalStatus;
  priority: Priority;
  is_shared: boolean;
  shared_goal_id: string | null;
  created_at: string;
  q1_planned?: number;
  q2_planned?: number;
  q3_planned?: number;
  q4_planned?: number;
  check_ins?: DemoCheckIn[];
};

export type DemoSheet = {
  id: string;
  employee_id: string;
  year: number;
  status: GoalStatus;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rework_comment: string | null;
};

export type DemoActivity = {
  id: string;
  created_at: string;
  actor: string;
  action: string;
  detail: string;
  role?: "employee" | "manager" | "admin" | "system";
  entity?: string;
  entity_id?: string;
};

export type DemoNotification = {
  id: string;
  role: "employee" | "manager" | "admin";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  href: string;
  severity: "info" | "success" | "warning" | "critical";
  entity?: string;
  entity_id?: string;
};

export type DemoUser = {
  id: string;
  full_name: string;
  email: string;
  department: string;
  job_title: string;
  manager_id: string | null;
  role: "employee" | "manager" | "admin";
  status: "active" | "invited" | "deactivated";
  created_at: string;
};

export type DemoEscalation = {
  id: string;
  owner: string;
  department: string;
  type: "approval" | "check-in" | "goal-risk" | "audit" | "permission";
  severity: "critical" | "high" | "medium";
  created_at: string;
  summary: string;
  status: "open" | "watching" | "resolved";
  comments: Array<{ id: string; author: string; body: string; created_at: string }>;
  history: Array<{ id: string; action: string; created_at: string }>;
};

export type DemoOrgSettings = {
  orgName: string;
  cycle: string;
  timezone: string;
  approvalSlaDays: number;
  mfaRequired: boolean;
  aiSummaries: boolean;
  weeklyDigest: boolean;
  announcement: string;
};

export type DemoPermissionRole = {
  role: "employee" | "manager" | "admin";
  permissions: Record<string, boolean>;
};

type DemoState = {
  sheet: DemoSheet;
  goals: DemoGoal[];
  checkIns: DemoCheckIn[];
  activity: DemoActivity[];
  notifications: DemoNotification[];
  users: DemoUser[];
  escalations: DemoEscalation[];
  orgSettings: DemoOrgSettings;
  permissions: DemoPermissionRole[];
};

const STORE_KEY = "momentum-demo-workflows-v2";
const demoEmployeeId = "demo-employee";

function nowIso() {
  return new Date().toISOString();
}

function futureDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function seededUsers(createdAt = nowIso()): DemoUser[] {
  return [
    {
      id: "u-admin",
      full_name: "Jordan Lee",
      email: "jordan.admin@momentum.ai",
      department: "People Ops",
      job_title: "HR Administrator",
      manager_id: null,
      role: "admin",
      status: "active",
      created_at: createdAt,
    },
    {
      id: "u-manager",
      full_name: "Sam Carter",
      email: "sam.manager@momentum.ai",
      department: "Engineering",
      job_title: "Engineering Manager",
      manager_id: null,
      role: "manager",
      status: "active",
      created_at: createdAt,
    },
    {
      id: "demo-employee",
      full_name: "Alex Morgan",
      email: "alex.employee@momentum.ai",
      department: "Engineering",
      job_title: "Software Engineer",
      manager_id: "u-manager",
      role: "employee",
      status: "active",
      created_at: createdAt,
    },
    {
      id: "demo-employee-2",
      full_name: "Maya Patel",
      email: "maya@momentum.ai",
      department: "Customer Success",
      job_title: "Success Lead",
      manager_id: "u-manager",
      role: "employee",
      status: "active",
      created_at: createdAt,
    },
    {
      id: "demo-employee-3",
      full_name: "Jordan Kim",
      email: "jordan@momentum.ai",
      department: "Engineering",
      job_title: "QA Analyst",
      manager_id: "u-manager",
      role: "employee",
      status: "active",
      created_at: createdAt,
    },
  ];
}

function seededOrgSettings(): DemoOrgSettings {
  return {
    orgName: "Momentum AI Demo Company",
    cycle: `FY${String(new Date().getFullYear()).slice(2)} Q2`,
    timezone: "Asia/Calcutta",
    approvalSlaDays: 2,
    mfaRequired: true,
    aiSummaries: true,
    weeklyDigest: true,
    announcement: "Q2 check-ins are open. Managers should complete reviews within two business days.",
  };
}

function seededPermissions(): DemoPermissionRole[] {
  return [
    {
      role: "employee",
      permissions: {
        create_goals: true,
        submit_checkins: true,
        approve_goals: false,
        manage_users: false,
        view_audit: false,
        configure_platform: false,
      },
    },
    {
      role: "manager",
      permissions: {
        create_goals: true,
        submit_checkins: true,
        approve_goals: true,
        manage_users: false,
        view_audit: false,
        configure_platform: false,
      },
    },
    {
      role: "admin",
      permissions: {
        create_goals: true,
        submit_checkins: true,
        approve_goals: true,
        manage_users: true,
        view_audit: true,
        configure_platform: true,
      },
    },
  ];
}

function seededNotifications(createdAt = nowIso()): DemoNotification[] {
  return [
    {
      id: "notif-manager-approval",
      role: "manager",
      title: "Approval queue needs attention",
      message: "Alex Morgan has a submitted goal sheet waiting for manager review.",
      read: false,
      created_at: createdAt,
      href: "/manager/approvals",
      severity: "warning",
      entity: "goal_sheet",
      entity_id: "demo-pending-sheet",
    },
    {
      id: "notif-admin-risk",
      role: "admin",
      title: "Engineering review SLA risk",
      message: "A submitted goal sheet is approaching the organization approval SLA.",
      read: false,
      created_at: createdAt,
      href: "/admin/escalations",
      severity: "warning",
      entity: "escalation",
      entity_id: "ESC-1042",
    },
    {
      id: "notif-employee-ai",
      role: "employee",
      title: "AI goal recommendations are ready",
      message: "Momentum AI generated KPI suggestions for your quarterly performance workflow.",
      read: false,
      created_at: createdAt,
      href: "/ai",
      severity: "info",
      entity: "ai",
    },
  ];
}

function seededEscalations(createdAt = nowIso()): DemoEscalation[] {
  return [
    {
      id: "ESC-1042",
      owner: "Sam Carter",
      department: "Engineering",
      type: "approval",
      severity: "high",
      created_at: createdAt,
      summary: "Goal sheet review is close to the two-day manager SLA.",
      status: "open",
      comments: [
        { id: "esc-comment-1", author: "Momentum AI", body: "SLA timer started after employee submission.", created_at: createdAt },
      ],
      history: [{ id: "esc-history-1", action: "Escalation opened", created_at: createdAt }],
    },
    {
      id: "ESC-1038",
      owner: "Jordan Lee",
      department: "People Ops",
      type: "audit",
      severity: "critical",
      created_at: createdAt,
      summary: "Bulk workflow configuration changes require HR review.",
      status: "watching",
      comments: [],
      history: [{ id: "esc-history-2", action: "Monitoring started", created_at: createdAt }],
    },
    {
      id: "ESC-1035",
      owner: "Alex Morgan",
      department: "Engineering",
      type: "goal-risk",
      severity: "medium",
      created_at: createdAt,
      summary: "Automation objective is under target and has a dependency blocker.",
      status: "resolved",
      comments: [],
      history: [{ id: "esc-history-3", action: "Resolved after manager coaching", created_at: createdAt }],
    },
  ];
}

function seedState(employeeId = demoEmployeeId): DemoState {
  const year = new Date().getFullYear();
  const sheetId = `demo-sheet-${employeeId}-${year}`;
  const goals: DemoGoal[] = [
    {
      id: "demo-goal-support",
      sheet_id: sheetId,
      employee_id: employeeId,
      thrust_area: "Customer Experience",
      title: "Reduce enterprise support response time",
      description: "Improve first response speed for priority support cases while maintaining quality targets.",
      uom_type: "percentage",
      uom_direction: "min",
      target: 100,
      weightage: 30,
      deadline: futureDate(58),
      status: "draft",
      priority: "High",
      is_shared: false,
      shared_goal_id: null,
      created_at: nowIso(),
      q1_planned: 20,
      q2_planned: 50,
      q3_planned: 78,
      q4_planned: 100,
    },
    {
      id: "demo-goal-automation",
      sheet_id: sheetId,
      employee_id: employeeId,
      thrust_area: "Digital Transformation",
      title: "Automate recurring performance reports",
      description: "Publish reliable weekly reporting automation for goals, check-ins, and manager approvals.",
      uom_type: "numeric",
      uom_direction: "min",
      target: 12,
      weightage: 25,
      deadline: futureDate(74),
      status: "draft",
      priority: "Medium",
      is_shared: true,
      shared_goal_id: "demo-shared-ops",
      created_at: nowIso(),
      q1_planned: 3,
      q2_planned: 6,
      q3_planned: 9,
      q4_planned: 12,
    },
    {
      id: "demo-goal-quality",
      sheet_id: sheetId,
      employee_id: employeeId,
      thrust_area: "Quality & Compliance",
      title: "Improve release readiness quality",
      description: "Reduce review rework by introducing pre-release acceptance checks and better documentation.",
      uom_type: "percentage",
      uom_direction: "min",
      target: 100,
      weightage: 25,
      deadline: futureDate(93),
      status: "draft",
      priority: "Medium",
      is_shared: false,
      shared_goal_id: null,
      created_at: nowIso(),
      q1_planned: 25,
      q2_planned: 55,
      q3_planned: 80,
      q4_planned: 100,
    },
    {
      id: "demo-goal-collaboration",
      sheet_id: sheetId,
      employee_id: employeeId,
      thrust_area: "People & Culture",
      title: "Strengthen cross-functional delivery rhythm",
      description: "Run consistent stakeholder reviews and reduce unresolved blockers across product initiatives.",
      uom_type: "numeric",
      uom_direction: "min",
      target: 8,
      weightage: 20,
      deadline: futureDate(105),
      status: "draft",
      priority: "Low",
      is_shared: false,
      shared_goal_id: null,
      created_at: nowIso(),
      q1_planned: 2,
      q2_planned: 4,
      q3_planned: 6,
      q4_planned: 8,
    },
  ];

  const checkIns: DemoCheckIn[] = [
    {
      id: "demo-checkin-support-q1",
      goal_id: "demo-goal-support",
      quarter: "Q1",
      actual: 24,
      status: "on_track",
      self_comment: "Priority queue review is running weekly and first response variance is lower.",
      achievements: "Published response-time dashboard and coached two handoff patterns.",
      blockers: "Automation rules need final support operations approval.",
      support_needed: "Manager decision on escalation categories.",
      rating: 4,
      manager_feedback: "Strong progress. Keep the operational metric visible in weekly reviews.",
      submitted_at: nowIso(),
    },
    {
      id: "demo-checkin-automation-q1",
      goal_id: "demo-goal-automation",
      quarter: "Q1",
      actual: 4,
      status: "completed",
      self_comment: "Built the first reporting template and automated the weekly snapshot.",
      achievements: "Three reports are running without manual edits.",
      blockers: "Need analytics owner to confirm export format.",
      support_needed: "Review data quality exceptions.",
      rating: 5,
      manager_feedback: "This is ahead of plan. Document the repeatable setup steps.",
      submitted_at: nowIso(),
    },
  ];

  return {
    sheet: {
      id: sheetId,
      employee_id: employeeId,
      year,
      status: "draft",
      submitted_at: null,
      approved_at: null,
      approved_by: null,
      rework_comment: null,
    },
    goals,
    checkIns,
    activity: [
      {
        id: "demo-act-1",
        created_at: nowIso(),
        actor: "Momentum AI",
        action: "Seeded workspace",
        detail: "Demo goals, check-ins, notifications, and review history are ready.",
        role: "system",
        entity: "workspace",
      },
    ],
    notifications: seededNotifications(),
    users: seededUsers(),
    escalations: seededEscalations(),
    orgSettings: seededOrgSettings(),
    permissions: seededPermissions(),
  };
}

function readState(employeeId?: string): DemoState {
  if (typeof window === "undefined") return seedState(employeeId);
  const raw = window.localStorage.getItem(STORE_KEY);
  if (!raw) {
    const seeded = seedState(employeeId);
    writeState(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(raw) as DemoState;
    const seeded = seedState(employeeId);
    return {
      ...seeded,
      ...parsed,
      goals: parsed.goals?.length ? parsed.goals : seeded.goals,
      checkIns: parsed.checkIns ?? [],
      activity: parsed.activity ?? [],
      notifications: parsed.notifications ?? seeded.notifications,
      users: parsed.users ?? seeded.users,
      escalations: parsed.escalations ?? seeded.escalations,
      orgSettings: parsed.orgSettings ?? seeded.orgSettings,
      permissions: parsed.permissions ?? seeded.permissions,
    };
  } catch {
    const seeded = seedState(employeeId);
    writeState(seeded);
    return seeded;
  }
}

function writeState(state: DemoState) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }
}

function addNotification(
  state: DemoState,
  notification: Omit<DemoNotification, "id" | "created_at" | "read"> & Partial<Pick<DemoNotification, "read" | "created_at">>,
) {
  state.notifications = [
    {
      id: makeId("notif"),
      read: false,
      created_at: nowIso(),
      ...notification,
    },
    ...state.notifications,
  ].slice(0, 80);
}

function addActivity(
  state: DemoState,
  action: string,
  detail: string,
  actor = "You",
  role: DemoActivity["role"] = "employee",
  entity?: string,
  entity_id?: string,
) {
  state.activity = [
    { id: makeId("act"), created_at: nowIso(), actor, action, detail, role, entity, entity_id },
    ...state.activity,
  ].slice(0, 120);
}

function recordWorkflow(
  state: DemoState,
  event: {
    action: string;
    detail: string;
    actor?: string;
    role?: DemoActivity["role"];
    entity?: string;
    entity_id?: string;
    notifications?: Array<Omit<DemoNotification, "id" | "created_at" | "read">>;
  },
) {
  addActivity(state, event.action, event.detail, event.actor ?? "You", event.role ?? "employee", event.entity, event.entity_id);
  event.notifications?.forEach((notification) => addNotification(state, notification));
}

export function getDemoGoalWorkspace(employeeId?: string) {
  const state = readState(employeeId);
  const goals = state.goals
    .filter((goal) => goal.status !== "archived")
    .map((goal) => ({
      ...goal,
      check_ins: state.checkIns.filter((checkIn) => checkIn.goal_id === goal.id),
    }));
  return { sheet: state.sheet, goals, activity: state.activity };
}

export function createDemoGoal(input: Omit<DemoGoal, "id" | "created_at" | "check_ins">) {
  const state = readState(input.employee_id);
  const goal: DemoGoal = {
    ...input,
    id: makeId("goal"),
    created_at: nowIso(),
  };
  state.goals = [goal, ...state.goals];
  recordWorkflow(state, {
    action: "Goal created",
    detail: goal.title,
    actor: "Alex Morgan",
    role: "employee",
    entity: "goal",
    entity_id: goal.id,
    notifications: [
      {
        role: "manager",
        title: "New employee goal created",
        message: `${goal.title} is ready to include in review planning.`,
        href: "/manager/activity",
        severity: "info",
        entity: "goal",
        entity_id: goal.id,
      },
    ],
  });
  writeState(state);
  return goal;
}

export function updateDemoGoal(id: string, patch: Partial<DemoGoal>) {
  const state = readState();
  state.goals = state.goals.map((goal) => (goal.id === id ? { ...goal, ...patch } : goal));
  const updated = state.goals.find((goal) => goal.id === id);
  recordWorkflow(state, {
    action: "Goal updated",
    detail: updated?.title ?? id,
    actor: "Alex Morgan",
    role: "employee",
    entity: "goal",
    entity_id: id,
    notifications: [
      {
        role: "manager",
        title: "Goal progress or details changed",
        message: `${updated?.title ?? "A goal"} was updated by the employee.`,
        href: "/manager/activity",
        severity: "info",
        entity: "goal",
        entity_id: id,
      },
    ],
  });
  writeState(state);
  return updated;
}

export function archiveDemoGoal(id: string) {
  const state = readState();
  const goal = state.goals.find((item) => item.id === id);
  state.goals = state.goals.map((item) => (item.id === id ? { ...item, status: "archived" } : item));
  recordWorkflow(state, {
    action: "Goal archived",
    detail: goal?.title ?? id,
    actor: "Alex Morgan",
    role: "employee",
    entity: "goal",
    entity_id: id,
  });
  writeState(state);
}

export function submitDemoSheet() {
  const state = readState();
  state.sheet = { ...state.sheet, status: "submitted", submitted_at: nowIso() };
  state.goals = state.goals.map((goal) =>
    goal.status === "draft" ? { ...goal, status: "submitted" } : goal,
  );
  recordWorkflow(state, {
    action: "Goal sheet submitted",
    detail: "Sent to manager approval queue",
    actor: "Alex Morgan",
    role: "employee",
    entity: "goal_sheet",
    entity_id: state.sheet.id,
    notifications: [
      {
        role: "manager",
        title: "Goal sheet ready for review",
        message: "Alex Morgan submitted goals for approval.",
        href: "/manager/approvals",
        severity: "warning",
        entity: "goal_sheet",
        entity_id: state.sheet.id,
      },
      {
        role: "admin",
        title: "Manager approval workflow started",
        message: "Engineering has a new submitted goal sheet in the approval queue.",
        href: "/admin/audit",
        severity: "info",
        entity: "goal_sheet",
        entity_id: state.sheet.id,
      },
    ],
  });
  writeState(state);
  return state.sheet;
}

export function decideDemoSheet(action: "approve" | "reject" | "rework") {
  const state = readState();
  if (action === "approve") {
    state.sheet = { ...state.sheet, status: "approved", approved_at: nowIso(), approved_by: "demo-manager" };
    state.goals = state.goals.map((goal) => (goal.status === "archived" ? goal : { ...goal, status: "locked" }));
    recordWorkflow(state, {
      action: "Goal sheet approved",
      detail: "Manager approved and locked the submitted goals",
      actor: "Sam Carter",
      role: "manager",
      entity: "goal_sheet",
      entity_id: state.sheet.id,
      notifications: [
        {
          role: "employee",
          title: "Your goals were approved",
          message: "Sam Carter approved your goal sheet and locked it for the cycle.",
          href: "/employee/goals",
          severity: "success",
          entity: "goal_sheet",
          entity_id: state.sheet.id,
        },
        {
          role: "admin",
          title: "Engineering goal sheet approved",
          message: "Manager approval updated organization analytics and audit history.",
          href: "/admin/analytics",
          severity: "success",
          entity: "goal_sheet",
          entity_id: state.sheet.id,
        },
      ],
    });
  }
  if (action === "reject") {
    state.sheet = { ...state.sheet, status: "draft", rework_comment: "Rejected in demo review" };
    state.goals = state.goals.map((goal) => (goal.status === "archived" ? goal : { ...goal, status: "draft" }));
    recordWorkflow(state, {
      action: "Goal sheet rejected",
      detail: "Returned to draft for correction",
      actor: "Sam Carter",
      role: "manager",
      entity: "goal_sheet",
      entity_id: state.sheet.id,
      notifications: [
        {
          role: "employee",
          title: "Goal sheet needs revision",
          message: "Sam Carter rejected the submission and returned it to draft.",
          href: "/employee/goals",
          severity: "warning",
          entity: "goal_sheet",
          entity_id: state.sheet.id,
        },
      ],
    });
  }
  if (action === "rework") {
    state.sheet = { ...state.sheet, status: "draft", rework_comment: "Please sharpen KPIs and confirm owner milestones." };
    state.goals = state.goals.map((goal) =>
      goal.status === "archived" ? goal : { ...goal, status: "rework_requested" },
    );
    recordWorkflow(state, {
      action: "Rework requested",
      detail: "Manager asked for clearer KPIs and milestones",
      actor: "Sam Carter",
      role: "manager",
      entity: "goal_sheet",
      entity_id: state.sheet.id,
      notifications: [
        {
          role: "employee",
          title: "Rework requested",
          message: "Please sharpen KPIs and confirm owner milestones before resubmitting.",
          href: "/employee/goals",
          severity: "warning",
          entity: "goal_sheet",
          entity_id: state.sheet.id,
        },
        {
          role: "admin",
          title: "Rework event recorded",
          message: "A manager requested rework on an Engineering goal sheet.",
          href: "/admin/audit",
          severity: "info",
          entity: "goal_sheet",
          entity_id: state.sheet.id,
        },
      ],
    });
  }
  writeState(state);
}

export function upsertDemoCheckIn(input: Omit<DemoCheckIn, "id"> & { id?: string }) {
  const state = readState();
  const existing = state.checkIns.find(
    (checkIn) => checkIn.goal_id === input.goal_id && checkIn.quarter === input.quarter,
  );
  const next: DemoCheckIn = {
    ...input,
    id: existing?.id ?? input.id ?? makeId("checkin"),
  };
  state.checkIns = existing
    ? state.checkIns.map((checkIn) => (checkIn.id === existing.id ? next : checkIn))
    : [next, ...state.checkIns];
  const goal = state.goals.find((item) => item.id === input.goal_id);
  recordWorkflow(state, {
    action: input.submitted_at ? "Check-in submitted" : "Check-in draft saved",
    detail: `${input.quarter} update recorded${goal ? ` for ${goal.title}` : ""}`,
    actor: "Alex Morgan",
    role: "employee",
    entity: "check_in",
    entity_id: next.id,
    notifications: [
      {
        role: "manager",
        title: input.submitted_at ? "Check-in submitted" : "Check-in draft updated",
        message: `${goal?.title ?? "A goal"} has a ${input.quarter} update from Alex Morgan.`,
        href: "/manager/team",
        severity: input.status === "blocked" ? "warning" : "info",
        entity: "check_in",
        entity_id: next.id,
      },
    ],
  });
  writeState(state);
  return next;
}

export function getDemoApprovalSheets() {
  const state = readState();
  if (state.sheet.status !== "submitted") {
    const demoSubmitted = seedState().goals.map((goal) => ({ ...goal, status: "submitted" as GoalStatus }));
    return [
      {
        ...state.sheet,
        id: "demo-pending-sheet",
        status: "submitted" as GoalStatus,
        profiles: { full_name: "Alex Morgan", department: "Engineering" },
        goals: demoSubmitted,
      },
    ];
  }
  return [
    {
      ...state.sheet,
      profiles: { full_name: "Alex Morgan", department: "Engineering" },
      goals: state.goals.filter((goal) => goal.status !== "archived"),
    },
  ];
}

export function getDemoUsers() {
  return readState().users;
}

export function inviteDemoUser(input: Omit<DemoUser, "id" | "created_at" | "status"> & Partial<Pick<DemoUser, "status">>) {
  const state = readState();
  const user: DemoUser = {
    ...input,
    id: makeId("user"),
    status: input.status ?? "invited",
    created_at: nowIso(),
  };
  state.users = [user, ...state.users];
  recordWorkflow(state, {
    action: "User invited",
    detail: `${user.full_name} invited as ${user.role}`,
    actor: "Jordan Lee",
    role: "admin",
    entity: "user",
    entity_id: user.id,
    notifications: [
      {
        role: "admin",
        title: "User invite created",
        message: `${user.full_name} is pending onboarding in ${user.department}.`,
        href: "/admin/users",
        severity: "success",
        entity: "user",
        entity_id: user.id,
      },
    ],
  });
  writeState(state);
  return user;
}

export function updateDemoUser(id: string, patch: Partial<DemoUser>) {
  const state = readState();
  state.users = state.users.map((user) => (user.id === id ? { ...user, ...patch } : user));
  const updated = state.users.find((user) => user.id === id);
  recordWorkflow(state, {
    action: "User updated",
    detail: `${updated?.full_name ?? id} profile, role, or department changed`,
    actor: "Jordan Lee",
    role: "admin",
    entity: "user",
    entity_id: id,
    notifications: [
      {
        role: updated?.role === "manager" ? "manager" : updated?.role === "admin" ? "admin" : "employee",
        title: "Workspace access updated",
        message: "HR updated your role, department, or account status.",
        href: "/settings",
        severity: "info",
        entity: "user",
        entity_id: id,
      },
    ],
  });
  writeState(state);
  return updated;
}

export function getDemoNotifications(role?: "employee" | "manager" | "admin" | null) {
  const state = readState();
  return state.notifications
    .filter((notification) => !role || notification.role === role)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function markDemoNotificationRead(id: string, read = true) {
  const state = readState();
  state.notifications = state.notifications.map((notification) =>
    notification.id === id ? { ...notification, read } : notification,
  );
  writeState(state);
}

export function markAllDemoNotificationsRead(role?: "employee" | "manager" | "admin" | null) {
  const state = readState();
  state.notifications = state.notifications.map((notification) =>
    !role || notification.role === role ? { ...notification, read: true } : notification,
  );
  writeState(state);
}

export function getDemoAuditLogs() {
  return readState().activity.map((item) => ({
    id: item.id,
    created_at: item.created_at,
    actor_id: item.actor,
    goal_id: item.entity_id ?? null,
    action: item.action.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    field: item.entity ?? "workflow",
    old_value: null,
    new_value: item.detail,
  }));
}

export function getDemoEscalations() {
  return readState().escalations;
}

export function createDemoEscalation(input: Pick<DemoEscalation, "owner" | "department" | "type" | "severity" | "summary">) {
  const state = readState();
  const escalation: DemoEscalation = {
    ...input,
    id: `ESC-${Math.floor(1000 + Math.random() * 9000)}`,
    created_at: nowIso(),
    status: "open",
    comments: [],
    history: [{ id: makeId("esc-history"), action: "Escalation opened", created_at: nowIso() }],
  };
  state.escalations = [escalation, ...state.escalations];
  recordWorkflow(state, {
    action: "Escalation created",
    detail: escalation.summary,
    actor: "Jordan Lee",
    role: "admin",
    entity: "escalation",
    entity_id: escalation.id,
    notifications: [
      {
        role: "manager",
        title: "HR escalation assigned",
        message: `${escalation.summary} (${escalation.department})`,
        href: "/manager/activity",
        severity: escalation.severity === "critical" ? "critical" : "warning",
        entity: "escalation",
        entity_id: escalation.id,
      },
      {
        role: "admin",
        title: "Escalation opened",
        message: escalation.summary,
        href: "/admin/escalations",
        severity: escalation.severity === "critical" ? "critical" : "warning",
        entity: "escalation",
        entity_id: escalation.id,
      },
    ],
  });
  writeState(state);
  return escalation;
}

export function updateDemoEscalation(id: string, patch: Partial<DemoEscalation>, comment?: string) {
  const state = readState();
  state.escalations = state.escalations.map((escalation) => {
    if (escalation.id !== id) return escalation;
    const next: DemoEscalation = {
      ...escalation,
      ...patch,
      comments: comment
        ? [
            { id: makeId("esc-comment"), author: "Jordan Lee", body: comment, created_at: nowIso() },
            ...escalation.comments,
          ]
        : escalation.comments,
      history: [
        { id: makeId("esc-history"), action: patch.status ? `Status changed to ${patch.status}` : "Escalation updated", created_at: nowIso() },
        ...escalation.history,
      ],
    };
    return next;
  });
  const updated = state.escalations.find((item) => item.id === id);
  recordWorkflow(state, {
    action: "Escalation updated",
    detail: `${id} marked ${updated?.status ?? "updated"}`,
    actor: "Jordan Lee",
    role: "admin",
    entity: "escalation",
    entity_id: id,
  });
  writeState(state);
  return updated;
}

export function getDemoOrgSettings() {
  return readState().orgSettings;
}

export function updateDemoOrgSettings(patch: Partial<DemoOrgSettings>) {
  const state = readState();
  state.orgSettings = { ...state.orgSettings, ...patch };
  recordWorkflow(state, {
    action: "Platform settings updated",
    detail: Object.keys(patch).join(", "),
    actor: "Jordan Lee",
    role: "admin",
    entity: "settings",
    notifications: [
      {
        role: "manager",
        title: "Organization settings changed",
        message: "HR updated workflow policy or notification rules.",
        href: "/settings",
        severity: "info",
        entity: "settings",
      },
      {
        role: "employee",
        title: "Workspace settings changed",
        message: "Your Momentum AI workspace preferences or policy defaults were updated.",
        href: "/settings",
        severity: "info",
        entity: "settings",
      },
    ],
  });
  writeState(state);
  return state.orgSettings;
}

export function getDemoPermissions() {
  return readState().permissions;
}

export function updateDemoPermission(role: DemoPermissionRole["role"], permission: string, enabled: boolean) {
  const state = readState();
  state.permissions = state.permissions.map((item) =>
    item.role === role ? { ...item, permissions: { ...item.permissions, [permission]: enabled } } : item,
  );
  recordWorkflow(state, {
    action: "Permission updated",
    detail: `${role}.${permission} set to ${enabled ? "enabled" : "disabled"}`,
    actor: "Jordan Lee",
    role: "admin",
    entity: "permission",
    notifications: [
      {
        role,
        title: "Permission updated",
        message: `HR ${enabled ? "enabled" : "disabled"} ${permission.replace(/_/g, " ")} for your role.`,
        href: "/settings",
        severity: "warning",
        entity: "permission",
      },
    ],
  });
  writeState(state);
}

export function getEnterpriseSnapshot() {
  const state = readState();
  const activeGoals = state.goals.filter((goal) => goal.status !== "archived");
  const submitted = activeGoals.filter((goal) => goal.status === "submitted").length;
  const approved = activeGoals.filter((goal) => goal.status === "approved" || goal.status === "locked").length;
  const checkInsSubmitted = state.checkIns.filter((checkIn) => Boolean(checkIn.submitted_at)).length;
  const departments = Array.from(new Set(state.users.map((user) => user.department)));
  const departmentData = departments.map((department) => {
    const employees = state.users.filter((user) => user.department === department && user.role === "employee").length;
    const progress = department === "Engineering" ? (approved ? 88 : 76) : department === "People Ops" ? 91 : 79;
    return {
      department,
      employees,
      progress,
      approvals: department === "Engineering" ? Math.max(1, submitted) : Math.max(1, Math.round(employees / 2)),
      escalations: state.escalations.filter((item) => item.department === department && item.status !== "resolved").length,
    };
  });
  return {
    users: state.users,
    goals: activeGoals,
    checkIns: state.checkIns,
    sheet: state.sheet,
    activity: state.activity,
    notifications: state.notifications,
    escalations: state.escalations,
    settings: state.orgSettings,
    permissions: state.permissions,
    kpis: {
      employees: state.users.filter((user) => user.role === "employee" && user.status !== "deactivated").length,
      managers: state.users.filter((user) => user.role === "manager" && user.status !== "deactivated").length,
      admins: state.users.filter((user) => user.role === "admin" && user.status !== "deactivated").length,
      goals: activeGoals.length,
      submitted,
      approved,
      checkInCoverage: activeGoals.length ? Math.round((checkInsSubmitted / activeGoals.length) * 100) : 0,
      openEscalations: state.escalations.filter((item) => item.status !== "resolved").length,
      unreadNotifications: state.notifications.filter((item) => !item.read).length,
    },
    departmentData,
  };
}
