-- 1. Update is_admin to also recognize treasurers
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
 RETURNS boolean
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.staff_registrations 
    WHERE user_id = user_id_param 
      AND staff_role IN ('Admin', 'Treasurer')
      AND pending = 'approved'
  );
$$;

-- 2. membership_registrations: add DELETE for admin/treasurer
CREATE POLICY "Admins and treasurers can delete members"
  ON public.membership_registrations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- Allow treasurer to update members (admin already can via is_admin which now includes treasurer)
DROP POLICY IF EXISTS "Admins can update membership registrations" ON public.membership_registrations;
CREATE POLICY "Admins and treasurers can update membership registrations"
  ON public.membership_registrations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 3. staff_registrations: let treasurer also view/update all staff
DROP POLICY IF EXISTS "Admins can view all staff registrations" ON public.staff_registrations;
CREATE POLICY "Admins and treasurers can view all staff"
  ON public.staff_registrations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

DROP POLICY IF EXISTS "Admins can update staff registrations" ON public.staff_registrations;
CREATE POLICY "Admins and treasurers can update staff"
  ON public.staff_registrations FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

DROP POLICY IF EXISTS "Only admins can update staff registrations" ON public.staff_registrations;

-- Allow admin/treasurer to delete staff
CREATE POLICY "Admins and treasurers can delete staff"
  ON public.staff_registrations FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 4. contributions: add UPDATE and DELETE for admin/treasurer
CREATE POLICY "Admins and treasurers can update contributions"
  ON public.contributions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can delete contributions"
  ON public.contributions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 5. disbursements: add UPDATE and DELETE for admin/treasurer
CREATE POLICY "Admins and treasurers can update disbursements"
  ON public.disbursements FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can delete disbursements"
  ON public.disbursements FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 6. monthly_expenses: add UPDATE and DELETE for admin/treasurer
CREATE POLICY "Admins and treasurers can update expenses"
  ON public.monthly_expenses FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can delete expenses"
  ON public.monthly_expenses FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 7. member_balances: add DELETE for admin/treasurer
CREATE POLICY "Admins and treasurers can delete member balances"
  ON public.member_balances FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 8. mpesa_payments: add DELETE for admin/treasurer
CREATE POLICY "Admins and treasurers can delete mpesa payments"
  ON public.mpesa_payments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 9. documents: let admin/treasurer also manage documents
CREATE POLICY "Admins and treasurers can view documents"
  ON public.documents FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can create documents"
  ON public.documents FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can update documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can delete documents"
  ON public.documents FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 10. tasks: let admin/treasurer manage all tasks
CREATE POLICY "Admins and treasurers can view all tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 11. user_roles: let treasurer also manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins and treasurers can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

-- 12. contact_submissions: let admin/treasurer read and manage
CREATE POLICY "Admins and treasurers can view contacts"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can update contacts"
  ON public.contact_submissions FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));

CREATE POLICY "Admins and treasurers can delete contacts"
  ON public.contact_submissions FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'treasurer'::app_role));