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
  excerpt?: string // 文章摘要
  author_id: string
  author?: Profile
  published: boolean
  created_at: string
  updated_at?: string
}

export interface File {
  id?: string
  title: string
  description?: string
  path: string
  file_name: string
  file_size: number
  file_type: string
  uploader_id: string
  uploader?: Profile
  created_at: string
  updated_at?: string
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