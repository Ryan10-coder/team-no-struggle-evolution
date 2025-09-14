-- Link staff record for auditor@gmail.com to its auth user id
UPDATE public.staff_registrations sr
SET user_id = au.id,
    updated_at = now()
FROM auth.users au
WHERE sr.email = 'auditor@gmail.com'
  AND sr.user_id IS NULL
  AND lower(au.email) = lower(sr.email);

-- Verify result
-- (No-op select to help confirm after this step)
