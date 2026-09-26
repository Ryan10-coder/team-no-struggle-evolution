-- CRITICAL SECURITY FIX: Create proper user roles architecture
-- This prevents privilege escalation attacks by separating role assignment from user data

-- Step 1: Create role enum
CREATE TYPE public.app_role AS ENUM (
  'admin',
  'treasurer', 
  'auditor',
  'secretary',
  'area_coordinator',
  'general_coordinator',
  'customer_service'
);

-- Step 2: Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Policy: Only admins can assign roles (will use has_role function once created)
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'::app_role
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  )
);

-- Step 3: Create Security Definer Function to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Step 4: Update all RLS policies to use has_role function

-- Contributions policies
DROP POLICY IF EXISTS "Staff can view all contributions" ON contributions;
DROP POLICY IF EXISTS "Treasurers and Admins can create contributions" ON contributions;
DROP POLICY IF EXISTS "Area coordinators can view area contributions" ON contributions;
DROP POLICY IF EXISTS "Customer service can view all contributions" ON contributions;

CREATE POLICY "Staff can view all contributions"
ON contributions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
  OR has_role(auth.uid(), 'customer_service'::app_role)
  OR has_role(auth.uid(), 'area_coordinator'::app_role)
);

CREATE POLICY "Staff can create contributions"
ON contributions FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

-- Disbursements policies
DROP POLICY IF EXISTS "Staff can view all disbursements" ON disbursements;
DROP POLICY IF EXISTS "Auditors and Admins can create disbursements" ON disbursements;
DROP POLICY IF EXISTS "Area coordinators can view area disbursements" ON disbursements;

CREATE POLICY "Staff can view all disbursements"
ON disbursements FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Staff can create disbursements"
ON disbursements FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

-- Monthly expenses policies
DROP POLICY IF EXISTS "Staff can view all expenses" ON monthly_expenses;
DROP POLICY IF EXISTS "Auditors and Admins can create expenses" ON monthly_expenses;

CREATE POLICY "Staff can view all expenses"
ON monthly_expenses FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Staff can create expenses"
ON monthly_expenses FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

-- MPesa payments policies
DROP POLICY IF EXISTS "Admins and Treasurers can view all mpesa payments" ON mpesa_payments;
DROP POLICY IF EXISTS "Treasurers and Admins can create mpesa payments" ON mpesa_payments;
DROP POLICY IF EXISTS "Area coordinators can view area mpesa payments" ON mpesa_payments;

CREATE POLICY "Staff can view mpesa payments"
ON mpesa_payments FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

CREATE POLICY "Staff can create mpesa payments"
ON mpesa_payments FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
);

-- Member balances policies
DROP POLICY IF EXISTS "Area coordinators can view area balances" ON member_balances;
DROP POLICY IF EXISTS "Customer service can view all balances" ON member_balances;

CREATE POLICY "Staff can view member balances"
ON member_balances FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'treasurer'::app_role)
  OR has_role(auth.uid(), 'auditor'::app_role)
  OR has_role(auth.uid(), 'customer_service'::app_role)
  OR has_role(auth.uid(), 'area_coordinator'::app_role)
);

-- Documents policies
DROP POLICY IF EXISTS "Secretaries can view all documents" ON documents;
DROP POLICY IF EXISTS "Secretaries can create documents" ON documents;
DROP POLICY IF EXISTS "Secretaries can update documents" ON documents;
DROP POLICY IF EXISTS "Secretaries can delete documents" ON documents;

CREATE POLICY "Secretaries can view documents"
ON documents FOR SELECT
USING (has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Secretaries can create documents"
ON documents FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'secretary'::app_role)
  AND created_by = auth.uid()
);

CREATE POLICY "Secretaries can update documents"
ON documents FOR UPDATE
USING (has_role(auth.uid(), 'secretary'::app_role));

CREATE POLICY "Secretaries can delete documents"
ON documents FOR DELETE
USING (has_role(auth.uid(), 'secretary'::app_role));

-- Tasks policies
DROP POLICY IF EXISTS "General coordinators can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Staff can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Staff can create tasks" ON tasks;

CREATE POLICY "Coordinators can view all tasks"
ON tasks FOR SELECT
USING (has_role(auth.uid(), 'general_coordinator'::app_role));

CREATE POLICY "Staff can view own tasks"
ON tasks FOR SELECT
USING (submitted_by = auth.uid());

CREATE POLICY "Staff can create tasks"
ON tasks FOR INSERT
WITH CHECK (submitted_by = auth.uid());

-- Membership registrations policies
DROP POLICY IF EXISTS "General coordinators can view all members" ON membership_registrations;
DROP POLICY IF EXISTS "Area coordinators can view members in their area" ON membership_registrations;

CREATE POLICY "Coordinators can view members"
ON membership_registrations FOR SELECT
USING (
  has_role(auth.uid(), 'general_coordinator'::app_role)
  OR has_role(auth.uid(), 'area_coordinator'::app_role)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Staff registrations - CRITICAL: Remove self-update capability
DROP POLICY IF EXISTS "Users can update their own staff registrations" ON staff_registrations;

CREATE POLICY "Only admins can update staff registrations"
ON staff_registrations FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 5: Migrate existing roles to user_roles table
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT 
  user_id,
  CASE staff_role
    WHEN 'Admin' THEN 'admin'::app_role
    WHEN 'Treasurer' THEN 'treasurer'::app_role
    WHEN 'Auditor' THEN 'auditor'::app_role
    WHEN 'Secretary' THEN 'secretary'::app_role
    WHEN 'Area Coordinator' THEN 'area_coordinator'::app_role
    WHEN 'General Coordinator' THEN 'general_coordinator'::app_role
    WHEN 'Customer Service' THEN 'customer_service'::app_role
  END,
  created_at
FROM staff_registrations
WHERE user_id IS NOT NULL
  AND pending = 'approved'
  AND staff_role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;