-- Allow service role to update MPESA payment status (for callbacks)
CREATE POLICY "Service role can update mpesa payments"
ON public.mpesa_payments
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow service role to insert mpesa payments
CREATE POLICY "Service role can insert mpesa payments"
ON public.mpesa_payments
FOR INSERT
WITH CHECK (true);

-- Ensure contributions table has a trigger to update member_balances
-- First check if trigger exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_member_balance_trigger'
  ) THEN
    CREATE TRIGGER update_member_balance_trigger
    AFTER INSERT ON public.contributions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_member_balance();
  END IF;
END $$;

-- Add policy for coordinators and secretaries to view contributions
CREATE POLICY "Coordinators and secretaries can view contributions"
ON public.contributions
FOR SELECT
USING (
  has_role(auth.uid(), 'secretary'::app_role) OR 
  has_role(auth.uid(), 'general_coordinator'::app_role)
);

-- Add policy for coordinators and secretaries to view mpesa_payments
CREATE POLICY "Coordinators and secretaries can view mpesa payments"
ON public.mpesa_payments
FOR SELECT
USING (
  has_role(auth.uid(), 'secretary'::app_role) OR 
  has_role(auth.uid(), 'general_coordinator'::app_role)
);

-- Add policy for coordinators and secretaries to view member_balances
CREATE POLICY "Coordinators and secretaries can view member balances"
ON public.member_balances
FOR SELECT
USING (
  has_role(auth.uid(), 'secretary'::app_role) OR 
  has_role(auth.uid(), 'general_coordinator'::app_role)
);