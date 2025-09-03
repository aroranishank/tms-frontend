import type { Task, LoginResponse, User, UserCreate, UserUpdate, PaginatedUsersResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const handleApiError = async (response: Response): Promise<never> => {
  const errorText = await response.text();
  let errorMessage = 'An error occurred';
  
  try {
    const errorData = JSON.parse(errorText);
    errorMessage = errorData.detail || errorData.message || 'An error occurred';
  } catch {
    errorMessage = errorText || `HTTP ${response.status}: ${response.statusText}`;
  }
  
  throw new Error(errorMessage);
};

export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password })
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

// Registration endpoint not available - admin creates users via /users endpoint

export const getTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> => {
  // Convert frontend date fields to backend datetime fields
  const taskData = { ...task };
  
  console.log('createTask received:', task);
  console.log('createTask taskData before conversion:', taskData);
  
  if (taskData.due_date !== undefined) {
    if (taskData.due_date) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.due_datetime = taskData.due_date + 'T23:59:59.000Z';
    } else {
      taskData.due_datetime = undefined;
    }
    delete taskData.due_date;
  }
  
  if (taskData.start_datetime !== undefined) {
    if (taskData.start_datetime) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.start_datetime = taskData.start_datetime + 'T00:00:00.000Z';
    } else {
      taskData.start_datetime = undefined;
    }
  }
  
  if (taskData.end_datetime !== undefined) {
    if (taskData.end_datetime) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.end_datetime = taskData.end_datetime + 'T23:59:59.000Z';
    } else {
      taskData.end_datetime = undefined;
    }
  }
  
  console.log('createTask final payload:', taskData);
  
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const updateTask = async (id: string, task: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>, isAdmin: boolean = false): Promise<Task> => {
  // Convert frontend date fields to backend datetime fields
  let taskData = { ...task };
  
  if (taskData.due_date !== undefined) {
    if (taskData.due_date) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.due_datetime = taskData.due_date + 'T23:59:59.000Z';
    } else {
      taskData.due_datetime = undefined;
    }
    delete taskData.due_date;
  }
  
  if (taskData.start_datetime !== undefined) {
    if (taskData.start_datetime) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.start_datetime = taskData.start_datetime + 'T00:00:00.000Z';
    } else {
      taskData.start_datetime = undefined;
    }
  }
  
  if (taskData.end_datetime !== undefined) {
    if (taskData.end_datetime) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.end_datetime = taskData.end_datetime + 'T23:59:59.000Z';
    } else {
      taskData.end_datetime = undefined;
    }
  }
  
  // Filter payload for normal users AFTER date conversions
  // Apply restrictions if user is not admin (simpler approach)
  const shouldRestrict = !isAdmin;
  
  if (shouldRestrict) {
    const allowedFields = ['status', 'start_datetime', 'end_datetime'];
    const originalTaskData = { ...taskData };
    taskData = Object.keys(taskData).reduce((filtered, key) => {
      if (allowedFields.includes(key)) {
        (filtered as any)[key] = (taskData as any)[key];
      }
      return filtered;
    }, {} as Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>);
    
    console.log('🔒 Restricted task update (normal user):');
    console.log('Original payload:', originalTaskData);
    console.log('Filtered payload:', taskData);
  } else {
    console.log('✅ Full access task update (admin user):', taskData);
  }
  
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const deleteTask = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
};

// Admin-specific task management
export const getAllTasksForAdmin = async (): Promise<Task[]> => {
  const response = await fetch(`${API_BASE_URL}/admin/tasks`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  const result = await response.json();
  // Handle backward compatibility - if it's paginated response, return just tasks
  if (result.tasks) {
    return result.tasks;
  }
  return result;
};

export const searchTasks = async (
  search?: string, 
  page: number = 1, 
  limit: number = 10
): Promise<{ tasks: Task[]; pagination: PaginationInfo }> => {
  const params = new URLSearchParams();
  
  if (search !== undefined && search !== null) {
    params.append('search', search);
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await fetch(`${API_BASE_URL}/admin/tasks?${params}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const createTaskForUser = async (userId: string, task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'owner_id'>): Promise<Task> => {
  // Convert frontend date fields to backend datetime fields
  const taskData = { ...task };
  
  console.log('createTaskForUser received:', task);
  console.log('createTaskForUser taskData before conversion:', taskData);
  
  if (taskData.due_date !== undefined) {
    if (taskData.due_date) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.due_date = taskData.due_date + 'T23:59:59.000Z';
    } else {
      taskData.due_date = undefined;
    }
  }
  
  if (taskData.start_datetime !== undefined) {
    if (taskData.start_datetime) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.start_datetime = taskData.start_datetime + 'T00:00:00.000Z';
    } else {
      taskData.start_datetime = undefined;
    }
  }
  
  if (taskData.end_datetime !== undefined) {
    if (taskData.end_datetime) {
      // Keep the date in local timezone - just append time and convert to ISO
      taskData.end_datetime = taskData.end_datetime + 'T23:59:59.000Z';
    } else {
      taskData.end_datetime = undefined;
    }
  }
  // Remove fields that should not be sent to the API
  delete (taskData as any).user_id;
  delete (taskData as any).owner_id;
  
  console.log('createTaskForUser final payload:', taskData);
  
  const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(taskData)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

// User Management API calls
export const getCurrentUser = async (): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const updateCurrentUser = async (userData: UserUpdate): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

// Admin-only user management
export const getAllUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  const result = await response.json();
  // Handle backward compatibility - if it's paginated response, return just users
  if (result.users) {
    return result.users;
  }
  return result;
};

export const searchUsers = async (
  search?: string, 
  page: number = 1, 
  limit: number = 10
): Promise<PaginatedUsersResponse> => {
  const params = new URLSearchParams();
  
  if (search !== undefined && search !== null) {
    params.append('search', search);
  }
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  
  const response = await fetch(`${API_BASE_URL}/users?${params}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const createUser = async (userData: UserCreate): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const updateUser = async (userId: string, userData: Partial<UserUpdate>): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
};