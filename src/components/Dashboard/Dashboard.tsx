import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';
import { getTasks, createTask, updateTask, deleteTask } from '../../services/apiService';
import TaskCard from '../Tasks/TaskCard';
import TaskModal from '../Tasks/TaskModal';
import LoadingSpinner from '../common/LoadingSpinner';
import UserProfile from '../User/UserProfile';
import UserManagement from '../User/UserManagement';
import AdminTaskManagement from '../Admin/AdminTaskManagement';
import type { Task, TaskFormData, TaskStats } from '../../types';
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
  ClipboardList
} from 'lucide-react';

const Dashboard = memo(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'user-management' | 'admin-tasks'>('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all');
  const [sortBy] = useState<'created' | 'due_date' | 'priority' | 'title'>('created');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const { user, logout } = useAuth();
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const loadTasks = useCallback(async () => {
    console.log('Loading tasks...');
    setIsLoading(true);
    setError('');
    try {
      const tasksData = await getTasks();
      console.log('Tasks loaded successfully:', tasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to load tasks: ${errorMessage}`);
      // Set empty array on error so UI shows "no tasks" instead of infinite loading
      setTasks([]);
    } finally {
      console.log('Setting loading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [loadTasks, user]);

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

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Filter by search term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    // Sort tasks
    filtered.sort((a, b) => {
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

    return filtered;
  }, [tasks, debouncedSearchTerm, statusFilter, priorityFilter, sortBy]);

  const handleCreateTask = useCallback(async (taskData: TaskFormData) => {
    try {
      const newTask = await createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      });
      setTasks(prev => [newTask, ...prev]);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, []);

  const handleUpdateTask = useCallback(async (taskData: TaskFormData) => {
    if (!editingTask) return;
    try {
      const updatedTask = await updateTask(editingTask.id, {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      }, user?.is_admin || false);
      setTasks(prev => prev.map(task => task.id === editingTask.id ? updatedTask : task));
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, [editingTask, user?.is_admin]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        setTasks(prev => prev.filter(task => task.id !== taskId));
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  }, []);

  const handleToggleStatus = useCallback(async (task: Task) => {
    const newStatus: Task['status'] = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const updatedTask = await updateTask(task.id, {
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        status: newStatus,
        due_date: task.due_datetime ? task.due_datetime.split('T')[0] : (task.due_date?.trim() || undefined),
        start_datetime: task.start_datetime ? task.start_datetime.split('T')[0] : undefined,
        end_datetime: task.end_datetime ? task.end_datetime.split('T')[0] : undefined
      }, user?.is_admin || false);
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task status:', error);
      alert('Failed to update task status. Please try again.');
    }
  }, [user?.is_admin]);


  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
  }, []);

  const taskStats: TaskStats = useMemo(() => {
    const stats = { total: tasks.length, completed: 0, pending: 0, inProgress: 0 };
    
    tasks.forEach(task => {
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
    return <LoadingSpinner message="Loading tasks..." />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
              </div>
              <CheckSquare className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{taskStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600">{taskStats.inProgress}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-red-600">{taskStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | Task['status'])}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'all' | Task['priority'])}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {filteredAndSortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-600 mb-6">
              {tasks.length === 0 
                ? "Get started by creating your first task!"
                : "Try adjusting your search or filters."}
            </p>
            {tasks.length === 0 && (
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
            {filteredAndSortedTasks.map(task => (
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
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;