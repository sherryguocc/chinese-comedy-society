// 严格的小写角色类型 - profiles 表只有 guest 和 member
export type ProfileRole = 'guest' | 'member'
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
  role: ProfileRole // 只能是 'guest' 或 'member'
  created_at: string
}

export interface Admin {
  id: string // UUID reference to auth.users(id)
  email: string
  full_name?: string
  created_at: string
  updated_at: string
  is_super_admin: boolean
  permissions: AdminPermissions
  created_by?: string // UUID reference to admins(id)
}

// 扩展的用户角色类型，包含所有可能的角色
export type UserRole = ProfileRole | 'admin' | 'super_admin'

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
          id?: string
          email: string
          full_name?: string
          is_super_admin: boolean
          permissions: AdminPermissions
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          full_name?: string
          is_super_admin?: boolean
          permissions?: AdminPermissions
          created_by?: string
          created_at?: string
          updated_at?: string
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
}