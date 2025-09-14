-- Update RLS policies to ensure Admin role has all Treasurer privileges

-- Update disbursements policies to include Admin
DROP POLICY IF EXISTS "Auditors can create disbursements" ON disbursements;
CREATE POLICY "Auditors and Admins can create disbursements" 
ON disbursements 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin']) 
    AND sr.pending = 'approved'
));

DROP POLICY IF EXISTS "Auditors can view all disbursements" ON disbursements;
CREATE POLICY "Auditors and Admins can view all disbursements" 
ON disbursements 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin']) 
    AND sr.pending = 'approved'
));

-- Update contributions policies to include Admin
DROP POLICY IF EXISTS "Auditors can view all contributions" ON contributions;
CREATE POLICY "Auditors and Admins can view all contributions" 
ON contributions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin']) 
    AND sr.pending = 'approved'
));

-- Update monthly_expenses policies to include Admin
DROP POLICY IF EXISTS "Auditors can create expenses" ON monthly_expenses;
CREATE POLICY "Auditors and Admins can create expenses" 
ON monthly_expenses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin']) 
    AND sr.pending = 'approved'
));

DROP POLICY IF EXISTS "Auditors can view all expenses" ON monthly_expenses;
CREATE POLICY "Auditors and Admins can view all expenses" 
ON monthly_expenses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM staff_registrations sr 
  WHERE sr.user_id = auth.uid() 
    AND sr.staff_role = ANY(ARRAY['Auditor', 'Treasurer', 'Admin']) 
    AND sr.pending = 'approved'
));