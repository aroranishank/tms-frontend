export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  due_date?: string; // Frontend compatibility
  due_datetime?: string;
  start_datetime?: string;
  end_datetime?: string;
  completion_datetime?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  owner_id?: string;
}

export interface User {
  id?: string;
  username: string;
  email?: string;
  is_admin?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCreate {
  username: string;
  email?: string;
  password: string;
  is_admin?: boolean;
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  is_admin?: boolean;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: Task['priority'];
  status: Task['status'];
  due_date: string;
  start_datetime?: string;
  end_datetime?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedUsersResponse {
  users: User[];
  pagination: PaginationInfo;
}