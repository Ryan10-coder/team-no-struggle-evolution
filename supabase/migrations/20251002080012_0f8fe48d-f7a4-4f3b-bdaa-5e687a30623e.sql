-- Add MPESA payment reference column to membership_registrations table
ALTER TABLE public.membership_registrations 
ADD COLUMN mpesa_payment_reference TEXT;