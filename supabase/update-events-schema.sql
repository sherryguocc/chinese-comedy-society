-- 更新events表，添加新字段
-- Update events table with new fields

-- 添加event_type字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_type TEXT CHECK (event_type IN ('show', 'openmic', 'training', 'meetup', 'readingsession')) DEFAULT 'meetup';

-- 添加organiser字段
ALTER TABLE events ADD COLUMN IF NOT EXISTS organiser TEXT;

-- 添加end_time字段（可选）
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- 为了兼容性，检查并更新现有字段
-- 确保start_date字段存在（如果使用的是start_time）
DO $$
BEGIN
    -- 检查是否存在start_date字段，如果不存在则重命名start_time
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'events' AND column_name = 'start_time' 
               AND table_schema = 'public') THEN
        -- 重命名字段以保持一致性
        ALTER TABLE events RENAME COLUMN start_time TO start_date;
    END IF;
EXCEPTION
    WHEN duplicate_column THEN
        -- 字段已存在，跳过
        NULL;
END $$;

-- 更新现有记录的默认值
UPDATE events SET event_type = 'meetup' WHERE event_type IS NULL;
UPDATE events SET organiser = '华人喜剧协会' WHERE organiser IS NULL;

-- 添加注释
COMMENT ON COLUMN events.event_type IS '活动类型：show(演出), openmic(开放麦), training(培训), meetup(聚会), readingsession(读稿会)';
COMMENT ON COLUMN events.organiser IS '活动组织者';
COMMENT ON COLUMN events.end_time IS '活动结束时间（可选）';