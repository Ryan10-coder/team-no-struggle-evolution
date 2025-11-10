-- Fix critical RLS policy bypass by removing 'OR true' conditions
-- This secures contributions, disbursements, monthly_expenses, and mpesa_payments tables

-- Fix mpesa_payments policy
DROP POLICY IF EXISTS "Admins and Treasurers can view all mpesa payments" ON mpesa_payments;
CREATE POLICY "Admins and Treasurers can view all mpesa payments"
ON mpesa_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
);

-- Fix contributions policy
DROP POLICY IF EXISTS "Staff can view all contributions" ON contributions;
CREATE POLICY "Staff can view all contributions"
ON contributions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
);

-- Fix disbursements policy
DROP POLICY IF EXISTS "Staff can view all disbursements" ON disbursements;
CREATE POLICY "Staff can view all disbursements"
ON disbursements
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
);

-- Fix monthly_expenses policy
DROP POLICY IF EXISTS "Staff can view all expenses" ON monthly_expenses;
CREATE POLICY "Staff can view all expenses"
ON monthly_expenses
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM staff_registrations sr
    WHERE sr.user_id = auth.uid()
      AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin'])
      AND sr.pending = 'approved'
  )
);