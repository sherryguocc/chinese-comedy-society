-- 紧急修复：临时禁用RLS测试插入
-- Emergency fix: Temporarily disable RLS for testing

-- 1. 检查events表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'events'
) as events_table_exists;

-- 2. 如果存在，检查结构
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 3. 临时禁用RLS（仅用于测试）
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- 4. 尝试简单插入测试
-- 注意：需要替换create_by为你的实际用户ID
INSERT INTO events (
    title, 
    description, 
    start_time, 
    event_type, 
    organiser, 
    create_by
) VALUES (
    'SQL测试活动', 
    '通过SQL直接插入的测试活动', 
    NOW() + INTERVAL '1 day', 
    'meetup', 
    '测试组织者', 
    'f48a7c5d-18a1-4ce6-af31-3ec1273d27e7'  -- 替换为你的用户ID
);

-- 5. 查看插入的数据
SELECT * FROM events ORDER BY created_at DESC LIMIT 5;

-- 6. 重新启用RLS（测试完成后）
-- ALTER TABLE events ENABLE ROW LEVEL SECURITY;