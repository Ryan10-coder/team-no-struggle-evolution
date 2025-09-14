-- Create wrapper trigger function to link staff record on user signup
CREATE OR REPLACE FUNCTION public.after_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link staff registration by matching email
  PERFORM public.link_staff_to_user(NEW.email, NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger to run after a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created_link_staff ON auth.users;
CREATE TRIGGER on_auth_user_created_link_staff
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.after_auth_user_created();

-- Also add profile creation trigger if missing
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();