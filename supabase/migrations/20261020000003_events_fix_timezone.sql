-- 修复已有活动的时间（只能执行一次！）
--
-- 原因：旧的创建活动页面把 "2026-10-25T19:30"（新西兰时间，不带时区）直接存进
-- timestamptz 字段，数据库按 UTC 解释，结果存成了 19:30 UTC（= 新西兰次日 08:30）。
-- 修复：把旧数据的"UTC 墙上时间"重新按新西兰时间解释。
--
-- 执行时机：在部署新代码【之前】执行，且两者之间不要新建活动。

-- 1) 先预览：old_* 是现在存的值，new_*_nz 是修复后在新西兰显示的时间，
--    new_*_nz 应该等于你当初填写的时间。
SELECT id, title,
       start_time AS old_start,
       ((start_time AT TIME ZONE 'UTC') AT TIME ZONE 'Pacific/Auckland') AT TIME ZONE 'Pacific/Auckland' AS new_start_nz,
       end_time AS old_end,
       ((end_time AT TIME ZONE 'UTC') AT TIME ZONE 'Pacific/Auckland') AT TIME ZONE 'Pacific/Auckland' AS new_end_nz
FROM public.events
ORDER BY start_time;

-- 2) 确认无误后执行
BEGIN;
UPDATE public.events
SET start_time = (start_time AT TIME ZONE 'UTC') AT TIME ZONE 'Pacific/Auckland',
    end_time   = CASE WHEN end_time IS NULL THEN NULL
                      ELSE (end_time AT TIME ZONE 'UTC') AT TIME ZONE 'Pacific/Auckland' END;
COMMIT;
