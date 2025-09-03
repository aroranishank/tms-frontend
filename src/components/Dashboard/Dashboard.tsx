import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { getTasks, searchUserTasks, createTask, updateTask, deleteTask } from '../../services/apiService';
import TaskCard from '../Tasks/TaskCard';
import TaskModal from '../Tasks/TaskModal';
import LoadingSpinner from '../common/LoadingSpinner';
import ThemeLoader from '../common/ThemeLoader';
import UserProfile from '../User/UserProfile';
import UserManagement from '../User/UserManagement';
import AdminTaskManagement from '../Admin/AdminTaskManagement';
import type { Task, TaskFormData, TaskStats, PaginationInfo } from '../../types';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';

const Dashboard = memo(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_previous: false
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'user-management' | 'admin-tasks'>('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy] = useState<'created' | 'due_date' | 'priority' | 'title'>('created');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');
  const { user, logout } = useAuth();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadTasks = useCallback(async () => {
    console.log('Loading tasks...');
    
    setIsSearching(true);
    setError('');
    try {
      const searchValue = searchTerm.trim() === '' ? undefined : searchTerm;
      const response = await searchUserTasks(searchValue, currentPage, 10);
      console.log('Tasks loaded successfully:', response);
      setTasks(response.tasks);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load tasks: ${errorMessage}`);
      // Set empty array on error so UI shows "no tasks" instead of infinite loading
      setTasks([]);
      // Also reset pagination on error
      setPagination({
        current_page: 1,
        total_pages: 1,
        total_items: 0,
        items_per_page: 10,
        has_next: false,
        has_previous: false
      });
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
      setIsSearching(false);
    }
  }, [searchTerm, currentPage]);

  // Initial load when user is available
  useEffect(() => {
    if (user && currentPage === 1 && !searchTerm) {
      setIsLoading(true);
      loadTasks();
    }
  }, [user]);

  // Load tasks when page changes
  useEffect(() => {
    if (user && currentPage > 1) {
      loadTasks();
    }
  }, [currentPage, user]);

  useEffect(() => {
    // Debounced search effect
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchTerm.length >= 3 || searchTerm === '*' || searchTerm === '') {
        setCurrentPage(1); // Reset to first page on new search
        if (user) {
          loadTasks();
        }
      }
    }, 500); // 500ms delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, loadTasks, user]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showUserMenu]);

  const sortedTasks = useMemo(() => {
    // Ensure tasks is always an array
    const taskArray = tasks || [];

    // Search and filtering is now handled server-side, only handle client-side sorting if needed
    const sorted = [...taskArray];
    
    // Sort tasks (server already returns them in a reasonable order, but allow client-side sorting)
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
    });

    return sorted;
  }, [tasks, sortBy]);

  const handleCreateTask = useCallback(async (taskData: TaskFormData) => {
    setIsCreating(true);
    try {
      await createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      });
      // Refresh data from server
      loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    } finally {
      setIsCreating(false);
    }
  }, [loadTasks]);

  const handleUpdateTask = useCallback(async (taskData: TaskFormData) => {
    if (!editingTask) return;
    setIsUpdating(true);
    try {
      await updateTask(editingTask.id, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      }, user?.is_admin || false);
      // Refresh data from server
      loadTasks();
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, [editingTask, user?.is_admin, loadTasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      setIsDeleting(true);
      try {
        await deleteTask(taskId);
        // Refresh data from server
        loadTasks();
      } catch (error) {
        console.error('Failed to delete task:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  }, [loadTasks]);

  const handleToggleStatus = useCallback(async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'completed' ? 'pending' : 'completed';
    setIsUpdating(true);
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: newStatus,
        due_date: task.due_datetime ? task.due_datetime.split('T')[0] : (task.due_date?.trim() || undefined),
        start_datetime: task.start_datetime ? task.start_datetime.split('T')[0] : undefined,
        end_datetime: task.end_datetime ? task.end_datetime.split('T')[0] : undefined
      }, user?.is_admin || false);
      // Refresh data from server
      loadTasks();
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }, [user?.is_admin, loadTasks]);


  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const taskStats: TaskStats = useMemo(() => {
    // Ensure tasks is always an array
    const taskArray = tasks || [];
    const stats = { total: taskArray.length, completed: 0, pending: 0, inProgress: 0 };
    
    taskArray.forEach(task => {
      switch (task.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'in_progress':
          stats.inProgress++;
          break;
      }
    });
    
    return stats;
  }, [tasks]);

  if (!user) {
    return <LoadingSpinner message="Loading user..." />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <ThemeLoader message="Loading your tasks..." size="lg" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold">Error Loading Tasks</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => {
              setError('');
              loadTasks();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
          <div className="mt-4">
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'user-management') {
    return <UserManagement onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'admin-tasks') {
    return <AdminTaskManagement onBack={() => setCurrentView('dashboard')} />;
  }

  // Admin users get a different dashboard focused on management
  if (user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-indigo-600" />
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user?.username}!</span>
                
                <div className="relative user-menu-container" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                  >
                    <User className="w-4 h-4" />
                    <span>Account</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsProfileOpen(true);
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      
                      <hr className="my-2 border-gray-200" />
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg mx-auto mb-6">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Administrator Dashboard</h2>
            <p className="text-lg text-gray-600 mb-8">Manage users and oversee team tasks</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setCurrentView('admin-tasks')}>
              <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mx-auto mb-6">
                <ClipboardList className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">Task Management</h3>
              <p className="text-gray-600 text-center mb-6">
                View and manage all user tasks, assign new tasks, and monitor team progress
              </p>
              <div className="flex justify-center">
                <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                  Manage Tasks
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setCurrentView('user-management')}>
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mx-auto mb-6">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-3">User Management</h3>
              <p className="text-gray-600 text-center mb-6">
                Create and manage user accounts, assign admin privileges, and control access
              </p>
              <div className="flex justify-center">
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  Manage Users
                </button>
              </div>
            </div>
          </div>
        </main>

        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <CheckSquare className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.username}!</span>
              
              <div className="relative user-menu-container" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserMenu(!showUserMenu);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                >
                  <User className="w-4 h-4" />
                  <span>Account</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsProfileOpen(true);
                        setShowUserMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    
                    <hr className="my-2 border-gray-200" />
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{taskStats.total}</p>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 rounded-xl group-hover:from-indigo-100 group-hover:to-purple-100 transition-all duration-300">
                <CheckSquare className="w-8 h-8 text-gray-500 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">Completed</p>
                <p className="text-3xl font-bold text-green-600 group-hover:text-green-700 transition-colors">{taskStats.completed}</p>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                <CheckCircle className="w-8 h-8 text-green-500 group-hover:text-green-700 transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600 group-hover:text-yellow-700 transition-colors">{taskStats.inProgress}</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-3 rounded-xl group-hover:from-yellow-200 group-hover:to-yellow-300 transition-all duration-300">
                <AlertCircle className="w-8 h-8 text-yellow-500 group-hover:text-yellow-700 transition-colors" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 p-6 group hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-800 transition-colors">Pending</p>
                <p className="text-3xl font-bold text-red-600 group-hover:text-red-700 transition-colors">{taskStats.pending}</p>
              </div>
              <div className="bg-gradient-to-br from-red-100 to-red-200 p-3 rounded-xl group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300">
                <Clock className="w-8 h-8 text-red-500 group-hover:text-red-700 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8 backdrop-blur-sm bg-white/90">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0 mb-6">
            <div className="relative flex-1 max-w-2xl">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                <Search className={`w-5 h-5 transition-colors duration-300 ${searchTerm ? 'text-indigo-500' : 'text-gray-400'}`} />
              </div>
              <input
                type="text"
                placeholder="🔍 Search your tasks... (min 3 chars, * for all)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-300 text-lg placeholder-gray-500 bg-gray-50/50 focus:bg-white hover:border-gray-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Create New Task</span>
            </button>
          </div>
          
          {/* Enhanced Results info */}
          {pagination && pagination.total_items > 0 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                📊 Showing <span className="font-semibold text-gray-900">{((currentPage - 1) * pagination.items_per_page) + 1}-{Math.min(currentPage * pagination.items_per_page, pagination.total_items)}</span> of <span className="font-semibold text-gray-900">{pagination.total_items}</span> tasks
              </div>
              {searchTerm && (
                <div className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  🔍 Searching: "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>

        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {(tasks || []).length === 0 
                ? "Get started by creating your first task!"
                : "Try adjusting your search terms."}
            </p>
            {(tasks || []).length === 0 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create Your First Task
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={handleDeleteTask}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* Enhanced Pagination Controls */}
        {pagination && pagination.total_pages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-8 backdrop-blur-sm bg-white/90">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 flex items-center space-x-2">
                <span>📄</span>
                <span>Page <span className="font-semibold text-gray-900">{pagination.current_page}</span> of <span className="font-semibold text-gray-900">{pagination.total_pages}</span></span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!pagination.has_previous}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                
                {/* Page numbers */}
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                    let page;
                    if (pagination.total_pages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= pagination.total_pages - 2) {
                      page = pagination.total_pages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
                          page === currentPage
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-110'
                            : 'text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
                  disabled={!pagination.has_next}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <TaskModal
        isOpen={isModalOpen || !!editingTask}
        onClose={handleCloseModal}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        isAdmin={user?.is_admin || false}
        currentUserId={user?.id}
      />
      
      <UserProfile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      
      {/* Loading Overlays for all API calls */}
      {isSearching && (
        <ThemeLoader 
          message="Searching your tasks..." 
          size="md" 
          variant="overlay" 
        />
      )}
      
      {isCreating && (
        <ThemeLoader 
          message="Creating new task..." 
          size="md" 
          variant="overlay" 
        />
      )}
      
      {isUpdating && (
        <ThemeLoader 
          message="Updating task..." 
          size="md" 
          variant="overlay" 
        />
      )}
      
      {isDeleting && (
        <ThemeLoader 
          message="Deleting task..." 
          size="md" 
          variant="overlay" 
        />
      )}
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;