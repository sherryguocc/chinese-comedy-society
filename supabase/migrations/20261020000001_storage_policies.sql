-- =====================================================================
-- Storage 策略 (20/10/2026) —— 在 security_baseline 之后执行
--   files 桶：私有，member 可下载，admin 可上传 / 删除
--   images 桶：文章配图，公开可读，admin 可上传 / 删除
--
-- 会删除 storage.objects 上【所有】现有策略后重建（本项目只用这两个桶）。
-- 如果 SQL Editor 报 "must be owner of table objects"，说明当前项目不允许
-- 用 SQL 改 storage 策略，请改到 Dashboard → Storage → Policies 手动配置同样的规则。
-- =====================================================================

BEGIN;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

UPDATE storage.buckets SET public = false WHERE id = 'files';

CREATE POLICY storage_files_member_read ON storage.objects FOR SELECT
  USING (bucket_id = 'files' AND public.is_member());
CREATE POLICY storage_images_public_read ON storage.objects FOR SELECT
  USING (bucket_id = 'images');
CREATE POLICY storage_admin_insert ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('files', 'images') AND public.is_admin());
CREATE POLICY storage_admin_update ON storage.objects FOR UPDATE
  USING (bucket_id IN ('files', 'images') AND public.is_admin());
CREATE POLICY storage_admin_delete ON storage.objects FOR DELETE
  USING (bucket_id IN ('files', 'images') AND public.is_admin());

COMMIT;
