// 严格的小写角色类型
export type UserRole = 'guest' | 'member' | 'admin'

export interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  phone_number?: string
  role: UserRole // 必须是小写的 'guest', 'member', 或 'admin'
  created_at: string
  updated_at?: string
}

export interface Post {
  id: string
  title: string
  content: string
  author_id: string
  author?: Profile
  created_at: string
  updated_at: string
  published: boolean
}

export interface File {
  id: string
  name: string
  file_path: string
  file_type: string
  file_size: number
  uploader_id: string
  uploader?: Profile
  created_at: string
  member_only: boolean
}

export interface Event {
  id: string
  title: string
  description: string
  event_date: string
  location?: string
  author_id: string
  author?: Profile
  created_at: string
  updated_at: string
  published: boolean
}

export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  author?: Profile
  created_at: string
}