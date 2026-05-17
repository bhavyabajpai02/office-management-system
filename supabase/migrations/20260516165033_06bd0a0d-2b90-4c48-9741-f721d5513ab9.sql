
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE public.uom_type AS ENUM ('numeric', 'percentage', 'timeline', 'zero_based');
CREATE TYPE public.uom_direction AS ENUM ('min', 'max', 'timeline', 'zero');
CREATE TYPE public.goal_status AS ENUM ('draft', 'submitted', 'rework_requested', 'approved', 'locked');
CREATE TYPE public.sheet_status AS ENUM ('draft', 'submitted', 'approved', 'locked');
CREATE TYPE public.checkin_status AS ENUM ('not_started', 'on_track', 'completed');
CREATE TYPE public.quarter_label AS ENUM ('Q1','Q2','Q3','Q4');
CREATE TYPE public.notification_type AS ENUM ('goal_submitted','goal_approved','rework_requested','quarterly_reminder','escalation');
CREATE TYPE public.escalation_type AS ENUM ('goals_not_submitted','approval_pending','checkin_incomplete');

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  job_title TEXT,
  avatar_url TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'manager' THEN 2
    WHEN 'employee' THEN 3
  END
  LIMIT 1;
$$;

-- ===== GOAL SHEETS =====
CREATE TABLE public.goal_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  year INT NOT NULL,
  status sheet_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  locked_at TIMESTAMPTZ,
  rework_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, year)
);
ALTER TABLE public.goal_sheets ENABLE ROW LEVEL SECURITY;

-- ===== GOALS =====
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID NOT NULL REFERENCES public.goal_sheets(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  thrust_area TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  uom_type uom_type NOT NULL,
  uom_direction uom_direction NOT NULL DEFAULT 'max',
  target NUMERIC NOT NULL DEFAULT 0,
  weightage NUMERIC NOT NULL DEFAULT 10,
  deadline DATE,
  status goal_status NOT NULL DEFAULT 'draft',
  q1_planned NUMERIC,
  q2_planned NUMERIC,
  q3_planned NUMERIC,
  q4_planned NUMERIC,
  shared_goal_id UUID,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- ===== CHECK INS =====
CREATE TABLE public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  quarter quarter_label NOT NULL,
  actual NUMERIC,
  status checkin_status NOT NULL DEFAULT 'not_started',
  self_comment TEXT,
  manager_comment TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (goal_id, quarter)
);
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- ===== SHARED GOALS =====
CREATE TABLE public.shared_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT,
  thrust_area TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  uom_type uom_type NOT NULL,
  uom_direction uom_direction NOT NULL DEFAULT 'max',
  target NUMERIC NOT NULL DEFAULT 0,
  default_weightage NUMERIC NOT NULL DEFAULT 10,
  deadline DATE,
  assigned_employee_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shared_goals ENABLE ROW LEVEL SECURITY;

-- ===== NOTIFICATIONS =====
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===== AUDIT LOGS =====
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id),
  goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ===== ESCALATIONS =====
CREATE TABLE public.escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  escalation_type escalation_type NOT NULL,
  level INT NOT NULL DEFAULT 1,
  resolved BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_goal_sheets_updated BEFORE UPDATE ON public.goal_sheets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_check_ins_updated BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_shared_goals_updated BEFORE UPDATE ON public.shared_goals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ===== NEW USER TRIGGER =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, department, job_title)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    COALESCE(NEW.raw_user_meta_data->>'job_title', 'Employee')
  );

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'employee');
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'manager'));
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin insert profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles
CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- goal_sheets
CREATE POLICY "view own or reports sheets" ON public.goal_sheets FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  );
CREATE POLICY "employee insert own sheet" ON public.goal_sheets FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());
CREATE POLICY "update own or manager/admin" ON public.goal_sheets FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  );
CREATE POLICY "admin delete sheets" ON public.goal_sheets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- goals
CREATE POLICY "view own or reports goals" ON public.goals FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  );
CREATE POLICY "employee manage own draft goals" ON public.goals FOR INSERT TO authenticated
  WITH CHECK (employee_id = auth.uid());
CREATE POLICY "update goals own or manager/admin" ON public.goals FOR UPDATE TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  );
CREATE POLICY "delete goals own or admin" ON public.goals FOR DELETE TO authenticated
  USING (employee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- check_ins
CREATE POLICY "view check_ins" ON public.check_ins FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (
      g.employee_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = g.employee_id AND p.manager_id = auth.uid())
    ))
  );
CREATE POLICY "manage own check_ins" ON public.check_ins FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (
      g.employee_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = g.employee_id AND p.manager_id = auth.uid())
    ))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (
      g.employee_id = auth.uid()
      OR public.has_role(auth.uid(),'admin')
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = g.employee_id AND p.manager_id = auth.uid())
    ))
  );

-- shared_goals
CREATE POLICY "view shared goals" ON public.shared_goals FOR SELECT TO authenticated
  USING (
    manager_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR auth.uid() = ANY (assigned_employee_ids)
  );
CREATE POLICY "manager admin manage shared goals" ON public.shared_goals FOR ALL TO authenticated
  USING (manager_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (manager_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- notifications
CREATE POLICY "view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "anyone insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- audit_logs
CREATE POLICY "view audit logs scoped" ON public.audit_logs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.goals g WHERE g.id = goal_id AND (
      g.employee_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = g.employee_id AND p.manager_id = auth.uid())
    ))
  );
CREATE POLICY "insert audit logs" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- escalations
CREATE POLICY "view escalations scoped" ON public.escalations FOR SELECT TO authenticated
  USING (
    employee_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  );
CREATE POLICY "manage escalations admin manager" ON public.escalations FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = employee_id AND p.manager_id = auth.uid())
  );
