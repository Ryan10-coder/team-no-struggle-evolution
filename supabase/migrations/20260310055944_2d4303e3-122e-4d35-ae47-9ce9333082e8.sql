
-- 1. Backfill: Link existing auth users to their staff_registrations by matching email
UPDATE public.staff_registrations sr
SET user_id = au.id, updated_at = now()
FROM auth.users au
WHERE lower(trim(sr.email)) = lower(trim(au.email))
  AND sr.user_id IS NULL
  AND sr.pending = 'approved';

-- 2. Now backfill user_roles from all linked staff
INSERT INTO public.user_roles (user_id, role)
SELECT sr.user_id, public.map_staff_role_to_app_role(sr.staff_role)
FROM public.staff_registrations sr
WHERE sr.pending = 'approved'
  AND sr.user_id IS NOT NULL
  AND public.map_staff_role_to_app_role(sr.staff_role) IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Update sync_staff_to_user_roles trigger to also try linking user_id from auth.users when approved
CREATE OR REPLACE FUNCTION public.sync_staff_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  mapped_role app_role;
  found_user_id uuid;
BEGIN
  -- When staff is approved, try to link user_id if not already set
  IF NEW.pending = 'approved' AND NEW.user_id IS NULL THEN
    SELECT id INTO found_user_id FROM auth.users WHERE lower(trim(email)) = lower(trim(NEW.email)) LIMIT 1;
    IF found_user_id IS NOT NULL THEN
      NEW.user_id := found_user_id;
    END IF;
  END IF;

  -- Sync role to user_roles if approved and linked
  IF NEW.pending = 'approved' AND NEW.user_id IS NOT NULL THEN
    mapped_role := public.map_staff_role_to_app_role(NEW.staff_role);
    IF mapped_role IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.user_id, mapped_role)
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 4. Change trigger to BEFORE so we can modify NEW.user_id
DROP TRIGGER IF EXISTS trg_sync_staff_user_roles ON public.staff_registrations;
CREATE TRIGGER trg_sync_staff_user_roles
  BEFORE INSERT OR UPDATE ON public.staff_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_staff_to_user_roles();

-- 5. Add admin role check to member_balances INSERT/UPDATE so admins can manage balances
CREATE POLICY "Admins can insert member balances"
  ON public.member_balances FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins can update member balances"
  ON public.member_balances FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 6. Add SELECT policy for membership_registrations for treasurer/secretary/auditor roles
CREATE POLICY "Staff can view membership registrations"
  ON public.membership_registrations FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'treasurer'::app_role) OR
    has_role(auth.uid(), 'secretary'::app_role) OR
    has_role(auth.uid(), 'auditor'::app_role) OR
    has_role(auth.uid(), 'customer_service'::app_role)
  );
