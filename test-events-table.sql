-- 测试Events表结构
-- Test Events table structure

-- 1. 检查events表是否存在以及其结构
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
ORDER BY ordinal_position;

-- 2. 检查events表的约束
SELECT 
    constraint_name, 
    constraint_type, 
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'events';

-- 3. 检查RLS策略
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'events';

-- 4. 测试插入一条记录（注意：需要替换create_by为实际的用户ID）
/*
INSERT INTO events (
    title, 
    description, 
    start_time, 
    end_time, 
    location, 
    event_type, 
    organiser, 
    create_by
) VALUES (
    '测试活动', 
    '这是一个测试活动', 
    NOW() + INTERVAL '1 day', 
    NOW() + INTERVAL '1 day 2 hours', 
    '测试地点', 
    'meetup', 
    '华人喜剧协会', 
    'YOUR_USER_ID_HERE'
);
*/