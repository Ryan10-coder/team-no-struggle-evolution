
-- Function to map staff_role text to app_role enum
CREATE OR REPLACE FUNCTION public.map_staff_role_to_app_role(staff_role text)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE lower(trim(staff_role))
    WHEN 'admin' THEN 'admin'::app_role
    WHEN 'treasurer' THEN 'treasurer'::app_role
    WHEN 'secretary' THEN 'secretary'::app_role
    WHEN 'auditor' THEN 'auditor'::app_role
    WHEN 'area coordinator' THEN 'area_coordinator'::app_role
    WHEN 'general coordinator' THEN 'general_coordinator'::app_role
    WHEN 'customer service' THEN 'customer_service'::app_role
    ELSE NULL
  END;
END;
$$;

-- Function to sync staff registration to user_roles
CREATE OR REPLACE FUNCTION public.sync_staff_to_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mapped_role app_role;
BEGIN
  -- Only act when staff is approved and has a user_id
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

-- Trigger: fire on INSERT or UPDATE of staff_registrations
DROP TRIGGER IF EXISTS trg_sync_staff_user_roles ON public.staff_registrations;
CREATE TRIGGER trg_sync_staff_user_roles
  AFTER INSERT OR UPDATE ON public.staff_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_staff_to_user_roles();

-- Backfill: insert user_roles for all existing approved staff with user_ids
INSERT INTO public.user_roles (user_id, role)
SELECT sr.user_id, public.map_staff_role_to_app_role(sr.staff_role)
FROM public.staff_registrations sr
WHERE sr.pending = 'approved'
  AND sr.user_id IS NOT NULL
  AND public.map_staff_role_to_app_role(sr.staff_role) IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update the link_staff_to_user function to sync roles when user is linked
CREATE OR REPLACE FUNCTION public.link_staff_to_user(staff_email text, auth_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_record RECORD;
BEGIN
  -- Update staff registration to link to the auth user
  UPDATE public.staff_registrations
  SET user_id = auth_user_id, updated_at = now()
  WHERE email = staff_email AND user_id IS NULL
  RETURNING * INTO staff_record;
  
  -- If a record was updated and it's approved, sync the role
  IF FOUND AND staff_record.pending = 'approved' THEN
    DECLARE
      mapped_role app_role;
    BEGIN
      mapped_role := public.map_staff_role_to_app_role(staff_record.staff_role);
      IF mapped_role IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (auth_user_id, mapped_role)
        ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
    END;
  END IF;
END;
$$;
