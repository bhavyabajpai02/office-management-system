
-- =========================================================
-- 1. Shared goals enhancements
-- =========================================================
ALTER TABLE public.shared_goals
  ADD COLUMN IF NOT EXISTS primary_owner_id uuid;

ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS goals_unique_shared_per_employee
  ON public.goals(shared_goal_id, employee_id)
  WHERE shared_goal_id IS NOT NULL;

-- =========================================================
-- 2. Audit logging trigger function
-- =========================================================
CREATE OR REPLACE FUNCTION public.log_goal_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_id, goal_id, action, field, new_value)
    VALUES (_actor, NEW.id, 'goal.created', 'title', NEW.title);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.title IS DISTINCT FROM OLD.title THEN
      INSERT INTO public.audit_logs (actor_id, goal_id, action, field, old_value, new_value)
      VALUES (_actor, NEW.id, 'goal.updated', 'title', OLD.title, NEW.title);
    END IF;
    IF NEW.weightage IS DISTINCT FROM OLD.weightage THEN
      INSERT INTO public.audit_logs (actor_id, goal_id, action, field, old_value, new_value)
      VALUES (_actor, NEW.id, 'goal.weightage_changed', 'weightage', OLD.weightage::text, NEW.weightage::text);
    END IF;
    IF NEW.target IS DISTINCT FROM OLD.target THEN
      INSERT INTO public.audit_logs (actor_id, goal_id, action, field, old_value, new_value)
      VALUES (_actor, NEW.id, 'goal.updated', 'target', OLD.target::text, NEW.target::text);
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.audit_logs (actor_id, goal_id, action, field, old_value, new_value)
      VALUES (_actor, NEW.id, 'goal.status_changed', 'status', OLD.status::text, NEW.status::text);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (actor_id, goal_id, action, field, old_value)
    VALUES (_actor, OLD.id, 'goal.deleted', 'title', OLD.title);
    RETURN OLD;
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_audit_goals ON public.goals;
CREATE TRIGGER trg_audit_goals
AFTER INSERT OR UPDATE OR DELETE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.log_goal_audit();

-- Audit goal sheet status (approval / unlock / submit)
CREATE OR REPLACE FUNCTION public.log_sheet_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
  _action text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    _action := CASE NEW.status::text
      WHEN 'submitted' THEN 'sheet.submitted'
      WHEN 'approved'  THEN 'sheet.approved'
      WHEN 'rejected'  THEN 'sheet.rejected'
      WHEN 'locked'    THEN 'sheet.locked'
      WHEN 'draft'     THEN 'sheet.unlocked'
      ELSE 'sheet.status_changed'
    END;
    INSERT INTO public.audit_logs (actor_id, action, field, old_value, new_value)
    VALUES (_actor, _action, 'status', OLD.status::text, NEW.status::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_goal_sheets ON public.goal_sheets;
CREATE TRIGGER trg_audit_goal_sheets
AFTER UPDATE ON public.goal_sheets
FOR EACH ROW EXECUTE FUNCTION public.log_sheet_audit();

-- Audit check-ins
CREATE OR REPLACE FUNCTION public.log_checkin_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _actor uuid := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (actor_id, goal_id, action, field, new_value)
    VALUES (_actor, NEW.goal_id, 'checkin.created', NEW.quarter::text, COALESCE(NEW.actual::text,''));
  ELSIF TG_OP = 'UPDATE' AND (NEW.actual IS DISTINCT FROM OLD.actual OR NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO public.audit_logs (actor_id, goal_id, action, field, old_value, new_value)
    VALUES (_actor, NEW.goal_id, 'checkin.updated', NEW.quarter::text,
            COALESCE(OLD.actual::text,'') || '|' || OLD.status::text,
            COALESCE(NEW.actual::text,'') || '|' || NEW.status::text);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_audit_checkins ON public.check_ins;
CREATE TRIGGER trg_audit_checkins
AFTER INSERT OR UPDATE ON public.check_ins
FOR EACH ROW EXECUTE FUNCTION public.log_checkin_audit();

-- =========================================================
-- 3. Shared goal achievement sync
-- =========================================================
CREATE OR REPLACE FUNCTION public.sync_shared_checkin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _shared_id uuid;
  _primary_owner uuid;
  _employee uuid;
  _peer_goal record;
BEGIN
  SELECT g.shared_goal_id, g.employee_id INTO _shared_id, _employee
  FROM public.goals g WHERE g.id = NEW.goal_id;

  IF _shared_id IS NULL THEN RETURN NEW; END IF;

  SELECT primary_owner_id INTO _primary_owner
  FROM public.shared_goals WHERE id = _shared_id;

  -- Only sync if this update was made by the primary owner of the shared goal
  IF _primary_owner IS NULL OR _primary_owner <> _employee THEN
    RETURN NEW;
  END IF;

  FOR _peer_goal IN
    SELECT id FROM public.goals
    WHERE shared_goal_id = _shared_id AND id <> NEW.goal_id
  LOOP
    INSERT INTO public.check_ins (goal_id, quarter, actual, status, updated_by)
    VALUES (_peer_goal.id, NEW.quarter, NEW.actual, NEW.status, auth.uid())
    ON CONFLICT DO NOTHING;

    UPDATE public.check_ins
       SET actual = NEW.actual, status = NEW.status, updated_by = auth.uid(), updated_at = now()
     WHERE goal_id = _peer_goal.id AND quarter = NEW.quarter;

    UPDATE public.goals SET last_synced_at = now() WHERE id = _peer_goal.id;
  END LOOP;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_shared_checkin ON public.check_ins;
CREATE TRIGGER trg_sync_shared_checkin
AFTER INSERT OR UPDATE OF actual, status ON public.check_ins
FOR EACH ROW EXECUTE FUNCTION public.sync_shared_checkin();

-- Unique constraint on check_ins (goal_id, quarter) to support ON CONFLICT
CREATE UNIQUE INDEX IF NOT EXISTS check_ins_unique_quarter
  ON public.check_ins(goal_id, quarter);
