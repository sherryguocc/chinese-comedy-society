-- 彻底修复 profiles 表的 RLS 策略
-- Complete fix for profiles table RLS policies

-- 1. 首先查看所有现有策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. 强制删除 profiles 表的所有策略（更彻底的方式）
DO $$ 
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.policyname);
    END LOOP;
END $$;

-- 3. 临时禁用 RLS 来确保可以操作
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 4. 清理并重新创建 profiles 表结构（如果需要）
-- 注意：这会保留数据，只是确保没有隐藏的策略问题

-- 5. 手动插入/更新您的管理员账户
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    'f48a7c5d-18a1-4ce6-af31-3ec1273d27e7'::uuid,
    'sherryguocc@gmail.com',
    'Sherry Guo',
    'admin',
    NOW(),
    NOW()
) 
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    email = 'sherryguocc@gmail.com',
    updated_at = NOW();

-- 6. 验证数据是否正确插入
SELECT id, email, role, created_at FROM public.profiles 
WHERE id = 'f48a7c5d-18a1-4ce6-af31-3ec1273d27e7';

-- 7. 重新启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 8. 创建最简单的策略（逐步添加）
-- 先只添加 SELECT 策略
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- 验证 SELECT 策略是否工作
-- 在执行完上面的策略后，可以测试一下查询

-- 9. 如果 SELECT 正常，再添加其他策略
-- CREATE POLICY "profiles_insert_policy" ON public.profiles
--     FOR INSERT 
--     WITH CHECK (auth.uid() = id);

-- CREATE POLICY "profiles_update_policy" ON public.profiles
--     FOR UPDATE 
--     USING (auth.uid() = id);

-- 10. 最后检查策略是否正确创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';