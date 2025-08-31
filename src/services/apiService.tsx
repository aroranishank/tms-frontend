import type { Task, LoginResponse, User, UserCreate, UserUpdate } from '../types';

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
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  });
  
  if (!response.ok) {
    await handleApiError(response);
  }
  
  return response.json();
};

export const updateTask = async (id: string, task: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>>): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
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

// Note: Admin-specific endpoints would be implemented here when backend supports them
// For now, using regular task endpoints with admin permissions

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