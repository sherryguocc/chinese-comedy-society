-- 迁移Events表以匹配代码结构
-- Migration script to update Events table structure

-- 1. 首先备份现有数据（如果有的话）
CREATE TABLE IF NOT EXISTS events_backup AS SELECT * FROM events;

-- 2. 删除现有的events表
DROP TABLE IF EXISTS events CASCADE;

-- 3. 创建新的events表结构
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  event_type TEXT DEFAULT 'meetup' CHECK (event_type IN ('show', 'openmic', 'training', 'meetup', 'readingsession')),
  organiser TEXT DEFAULT '华人喜剧协会',
  create_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 启用行级安全
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 5. 创建RLS策略
-- 策略：任何人都可以查看事件
CREATE POLICY "Anyone can view events" ON events
  FOR SELECT USING (true);

-- 策略：只有管理员可以创建、更新、删除事件
CREATE POLICY "Admins can manage events" ON events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- 6. 如果备份表中有数据，尝试迁移（需要手动调整字段映射）
-- 注意：这个部分需要根据实际的备份数据结构进行调整
-- INSERT INTO events (title, description, start_time, end_time, location, create_by, created_at)
-- SELECT title, description, start_date, end_date, location, created_by, created_at
-- FROM events_backup;

-- 7. 删除备份表（确认迁移成功后）
-- DROP TABLE events_backup;