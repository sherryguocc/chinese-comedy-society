export interface Profile {
  id: string
  email: string
  full_name?: string
  role: 'guest' | 'member' | 'admin'
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  author_id: string
  created_at: string
  updated_at: string
  author?: Profile
}

export interface File {
  id: string
  title: string
  description?: string
  file_path: string
  file_size?: number
  uploaded_by: string
  created_at: string
  uploader?: Profile
}

export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  location?: string
  created_by: string
  created_at: string
  creator?: Profile
}

export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  created_at: string
  author?: Profile
}