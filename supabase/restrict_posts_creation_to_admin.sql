-- Restrict post creation to admin role only.
-- Keep super_admin as application-level email override; DB role model remains guest/member/admin.

BEGIN;

DROP POLICY IF EXISTS "Members can create posts" ON public.posts;
DROP POLICY IF EXISTS "Admins can create posts" ON public.posts;

CREATE POLICY "Admins can create posts" ON public.posts
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

COMMIT;
