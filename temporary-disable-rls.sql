-- 临时解决方案：禁用 RLS 来快速解决问题
-- Temporary solution: Disable RLS to quickly resolve the issue

-- 警告：这会临时移除安全限制，仅用于调试！
-- Warning: This temporarily removes security restrictions, for debugging only!

-- 1. 禁用 posts 表的 RLS (主要问题)
ALTER TABLE public.posts DISABLE ROW LEVEL SECURITY;

-- 2. 禁用 profiles 表的 RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. 确保您的管理员账户存在
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

-- 4. 验证数据
SELECT id, email, role FROM public.profiles 
WHERE id = 'f48a7c5d-18a1-4ce6-af31-3ec1273d27e7';

-- 注意：测试完成后，请重新启用 RLS 并正确配置策略
-- 重新启用的命令（测试完成后执行）：
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
-- CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (true);
-- CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (author_id = auth.uid());