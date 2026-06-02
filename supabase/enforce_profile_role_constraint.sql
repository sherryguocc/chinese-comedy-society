-- Enforce 3-level DB role model: guest/member/admin.
-- super_admin is resolved in application logic by email and is NOT stored in profiles.role.

BEGIN;

-- Normalize existing bad data before applying the stricter check.
UPDATE public.profiles
SET role = 'guest'
WHERE role IS NULL OR role NOT IN ('guest', 'member', 'admin');

-- Recreate role check constraint idempotently.
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('guest', 'member', 'admin'));

COMMIT;
