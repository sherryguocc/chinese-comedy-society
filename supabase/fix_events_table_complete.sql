-- 完整的Events表修复脚本
-- Complete Events table fix script

-- 1. 首先检查当前表状态
SELECT 'Current events table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. 检查是否已有数据
SELECT 'Current events count:' as status;
SELECT COUNT(*) as count FROM events;

-- 3. 备份现有数据（如果有）
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events') THEN
        EXECUTE 'CREATE TABLE events_backup_' || EXTRACT(EPOCH FROM NOW()) || ' AS SELECT * FROM events';
        RAISE NOTICE 'Events table backed up';
    END IF;
END $$;

-- 4. 删除现有表（如果存在）
DROP TABLE IF EXISTS events CASCADE;

-- 5. 创建新的events表
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    location TEXT,
    event_type TEXT DEFAULT 'meetup' CHECK (event_type IN ('show', 'openmic', 'training', 'meetup', 'readingsession')),
    organiser TEXT DEFAULT '华人喜剧协会',
    create_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 添加外键约束（分开添加以便调试）
ALTER TABLE events 
ADD CONSTRAINT events_create_by_fkey 
FOREIGN KEY (create_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- 7. 启用RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- 8. 创建RLS策略
CREATE POLICY "Anyone can view events" ON events
    FOR SELECT USING (true);

CREATE POLICY "Admins can create events" ON events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update events" ON events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete events" ON events
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 9. 验证表结构
SELECT 'New events table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 10. 验证外键约束
SELECT 'Foreign key constraints:' as status;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='events';

-- 11. 验证RLS策略
SELECT 'RLS policies:' as status;
SELECT policyname, cmd, permissive 
FROM pg_policies 
WHERE tablename = 'events';

SELECT 'Events table setup completed successfully!' as status;