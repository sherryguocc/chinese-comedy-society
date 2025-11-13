// 严格的小写角色类型 - profiles 表包括三种role
export type ProfileRole = 'guest' | 'member' | 'admin'
// Admin 相关类型
export type AdminPermissions = {
  manage_users?: boolean
  manage_posts?: boolean
  manage_events?: boolean
  manage_files?: boolean
  manage_admins?: boolean
  system_settings?: boolean
}

export interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  phone_number?: string
  role: ProfileRole
  created_at: string
}

export interface Admin {
  id: string // 只存储 super admin 的 UUID
}

// 扩展的用户角色类型，比ProfileRole多了 super_admin
export type UserRole = ProfileRole | 'super_admin'

export interface Post {
  id: string
  title: string
  content: string
  excerpt?: string // 文章摘要
  author_id: string
  author?: Profile
  published: boolean // 是否已发布
  created_at: string
}

export interface File {
  id: string
  title: string
  description?: string
  path: string
  file_name: string
  file_size: number
  file_type: string
  uploader_id: string
  uploader?: Profile
  created_at: string
}

// 活动类型
export type EventType = 'show' | 'openmic' | 'training' | 'meetup' | 'readingsession'

export interface Event {
  id: string
  title: string
  description: string
  start_time: string
  end_time?: string  // 可选的结束时间
  location?: string
  event_type: EventType
  organiser?: string
  create_by: string
  author?: Profile
  created_at: string
}

export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  author?: Profile
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'> & { id?: string }  // 插入时 id 可选
        Update: Partial<Profile>
      }
      admins: {
        Row: Admin
        Insert: {
          id: string
        }
        Update: {
          id?: string
        }
      }
      posts: {
        Row: Post
        Insert: Omit<Post, 'id' | 'created_at'>
        Update: Partial<Post>
      }
      files: {
        Row: File
        Insert: Omit<File, 'id' | 'created_at'>
        Update: Partial<File>
      }
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Event>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'id' | 'created_at'>
        Update: Partial<Comment>
      }
    }
  }
}

// ============================================
// Helper Types - 从 Database 派生的类型
// ============================================
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
export type AdminRow = Database['public']['Tables']['admins']['Row']
export type PostRow = Database['public']['Tables']['posts']['Row']
export type FileRow = Database['public']['Tables']['files']['Row']
export type EventRow = Database['public']['Tables']['events']['Row']
export type CommentRow = Database['public']['Tables']['comments']['Row']

// ============================================
// RPC 返回类型
// ============================================
export type UserRoleRPCResult = {
  role: string                  // coalesce 保证不会是 null
  profile: ProfileRow | null    // to_jsonb(p) 返回 JSONB，可能没有行
  is_admin: boolean             // 布尔
}

}