-- files 表上已有一个 BEFORE UPDATE 触发器会设置 NEW.updated_at，
-- 但表里缺少这一列，导致任何 UPDATE（如修改文件标题）都报错：
--   record "new" has no field "updated_at"
-- 补上这一列即可，触发器会自动维护"最后修改时间"。

ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
