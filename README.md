# Chinese Comedy Society - Next.js Project
# 华人喜剧协会 - Next.js 项目

A bilingual (Chinese/English) comedy community platform built with Next.js 14, Supabase, and Tailwind CSS.

一个使用 Next.js 14、Supabase 和 Tailwind CSS 构建的双语（中英文）喜剧社区平台。

## Features | 功能特点

### Authentication & Membership | 认证与会员制
- Supabase Auth for user registration and login | 使用 Supabase 认证进行用户注册和登录
- Role-based access control (guest, member, admin) | 基于角色的访问控制（访客、会员、管理员）
- Member-only features for downloads and comments | 会员专享的下载和评论功能

### Content Management | 内容管理
- **Posts**: Article system with comments | 文章系统带评论功能
- **Library**: PDF document downloads (members only) | PDF 文档下载（仅限会员）
- **Events**: Calendar view with FullCalendar | 使用 FullCalendar 的日历视图
- **Comments**: Discussion system for members | 会员讨论系统

### UI/UX | 用户界面/用户体验
- Fully bilingual interface (Chinese/English) | 完全双语界面（中英文）
- Responsive design with Tailwind CSS + daisyUI | 使用 Tailwind CSS + daisyUI 的响应式设计
- Dark/light theme support | 支持深色/浅色主题

## Tech Stack | 技术栈

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Supabase (Database, Auth, Storage)
- **Styling**: Tailwind CSS, daisyUI
- **Calendar**: FullCalendar React
- **Deployment**: Vercel (recommended) | 部署：Vercel（推荐）

## Project Structure | 项目结构

```
chinese-comedy-society/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── comments/             # Comments API
│   │   └── sign-download-url/    # PDF download URLs
│   ├── auth/                     # Authentication pages
│   │   ├── login/                # Login page
│   │   └── register/             # Registration page
│   ├── events/                   # Events calendar page
│   ├── library/                  # PDF library (members only)
│   ├── posts/                    # Posts and post details
│   │   └── [id]/                 # Dynamic post detail page
│   ├── profile/                  # User profile page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # Reusable components
│   └── Navbar.tsx                # Navigation component
├── contexts/                     # React contexts
│   └── AuthContext.tsx           # Authentication context
├── lib/                          # Utility libraries
│   └── supabase.ts               # Supabase client configuration
├── supabase/                     # Database schema
│   └── schema.sql                # Database tables and RLS policies
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database entity types
└── ...config files
```

## Database Schema | 数据库架构

### Tables | 数据表

1. **profiles** - User profiles with roles | 用户档案表（含角色）
2. **posts** - Article content | 文章内容
3. **files** - PDF documents | PDF 文档
4. **events** - Activity calendar | 活动日历
5. **comments** - Post discussions | 帖子讨论

### Row Level Security (RLS) | 行级安全策略

- Guests can view posts and events | 访客可查看帖子和活动
- Members can download files and comment | 会员可下载文件和评论
- Admins have full access | 管理员拥有完全访问权限

## Getting Started | 快速开始

### Prerequisites | 前置要求

- Node.js 18+ 
- Supabase account | Supabase 账户
- Vercel account (for deployment) | Vercel 账户（用于部署）

### Installation | 安装

1. **Clone the repository | 克隆仓库**
   ```bash
   git clone <repository-url>
   cd chinese-comedy-society
   ```

2. **Install dependencies | 安装依赖**
   ```bash
   npm install
   ```

3. **Setup environment variables | 设置环境变量**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials | 填入您的 Supabase 凭据:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Setup Supabase database | 设置 Supabase 数据库**
   - Create a new Supabase project | 创建新的 Supabase 项目
   - Run the SQL from `supabase/schema.sql` in the SQL editor | 在 SQL 编辑器中运行 `supabase/schema.sql`
   - Create a storage bucket named "files" for PDF uploads | 创建名为 "files" 的存储桶用于 PDF 上传

5. **Run the development server | 运行开发服务器**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser | 在浏览器中打开 [http://localhost:3000]

## Usage | 使用说明

### User Roles | 用户角色

1. **Guest | 访客**
   - View posts and events | 查看帖子和活动
   - Register for membership | 注册成为会员

2. **Member | 会员**
   - All guest permissions | 所有访客权限
   - Download PDF files | 下载 PDF 文件
   - Post comments | 发表评论

3. **Admin | 管理员**
   - All member permissions | 所有会员权限
   - Manage content and users | 管理内容和用户
   - Upload files and create events | 上传文件和创建活动

### Key Features | 主要功能

- **Bilingual Interface**: All content displays in both Chinese and English | 双语界面：所有内容都显示中英文
- **Member-only Downloads**: PDF files require member status | 会员专属下载：PDF 文件需要会员身份
- **Comment System**: Only members can participate in discussions | 评论系统：仅会员可参与讨论
- **Event Calendar**: Interactive calendar with event details | 活动日历：带事件详情的交互式日历

##  Deployment | 部署

### Vercel Deployment | Vercel 部署

1. Connect your GitHub repository to Vercel | 将 GitHub 仓库连接到 Vercel
2. Set environment variables in Vercel dashboard | 在 Vercel 控制台设置环境变量
3. Deploy automatically on push | 推送时自动部署

### Environment Variables for Production | 生产环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_production_secret
```

##  Development Notes | 开发说明

### Adding New Features | 添加新功能

- Follow the existing bilingual pattern | 遵循现有的双语模式
- Use TypeScript for type safety | 使用 TypeScript 确保类型安全
- Implement proper RLS policies in Supabase | 在 Supabase 中实现适当的 RLS 策略
- Test with different user roles | 使用不同用户角色进行测试

### File Upload Setup | 文件上传设置

To enable PDF uploads | 启用 PDF 上传:
1. Create storage bucket "files" in Supabase | 在 Supabase 中创建存储桶 "files"
2. Set appropriate bucket policies | 设置适当的存储桶策略
3. Configure file size limits | 配置文件大小限制

##  License | 许可证

This project is licensed under the MIT License | 本项目采用 MIT 许可证

##  Contributing | 贡献

1. Fork the repository | Fork 仓库
2. Create a feature branch | 创建功能分支
3. Follow bilingual conventions | 遵循双语约定
4. Submit a pull request | 提交拉取请求

##  Support | 支持

For questions or support, please contact the development team | 如有问题或需要支持，请联系开发团队

---

Built with ❤️ for the Chinese Comedy Society | 为中国喜剧社用爱构建