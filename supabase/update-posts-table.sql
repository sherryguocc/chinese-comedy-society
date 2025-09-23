-- 更新 posts 表结构
-- Update posts table structure

-- 添加缺失的字段
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS excerpt TEXT,
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT false;

-- 更新现有的帖子为已发布状态
UPDATE posts SET published = true WHERE published IS NULL;

-- 为现有帖子生成摘要（如果没有的话）
UPDATE posts 
SET excerpt = LEFT(content, 200) || '...'
WHERE excerpt IS NULL AND LENGTH(content) > 200;

UPDATE posts 
SET excerpt = content
WHERE excerpt IS NULL AND LENGTH(content) <= 200;

-- 验证表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;