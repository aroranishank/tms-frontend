import { useState, useCallback, memo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Circle, 
  Play,
  Plus,
  Edit3,
  Trash2,
  Calendar,
  User as UserIcon,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getAllUsers, searchTasks, createTaskForUser, updateTask, deleteTask } from '../../services/apiService';
import TaskEditModal from './TaskEditModal';
import StatusTasksModal from './StatusTasksModal';
import TaskCreationModal from './TaskCreationModal';
import type { User, Task, TaskFormData, PaginationInfo } from '../../types';

interface AdminTaskManagementProps {
  onBack: () => void;
}

const AdminTaskManagement = memo(({ onBack }: AdminTaskManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_previous: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string>('');
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalType, setStatusModalType] = useState<'overdue' | 'in_progress' | 'pending' | 'completed'>('pending');
  const [statusModalTitle, setStatusModalTitle] = useState('');
  const [isTaskCreationModalOpen, setIsTaskCreationModalOpen] = useState(false);
  const [isTaskEditModalOpen, setIsTaskEditModalOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usersData, tasksResponse] = await Promise.all([
        getAllUsers(),
        searchTasks(searchTerm.trim() === '' ? undefined : searchTerm, currentPage, 10)
      ]);
      
      setUsers(usersData);
      setAllTasks(tasksResponse.tasks);
      setPagination(tasksResponse.pagination);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load task management data');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  useEffect(() => {
    // Debounced search effect
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchTerm.length >= 3 || searchTerm === '*' || searchTerm === '') {
        setCurrentPage(1); // Reset to first page on new search
        loadData();
      }
    }, 500); // 500ms delay

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    // Set up interval to refresh data every 60 seconds to update overdue status
    const interval = setInterval(() => {
      loadData();
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [loadData]);

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress': return <Play className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <Circle className="w-4 h-4 text-gray-600" />;
      default: return <Circle className="w-4 h-4 text-gray-600" />;
    }
  };

  const isOverdue = (task: Task) => {
    const dueDate = task.due_datetime || task.due_date;
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const handleCreateTask = useCallback(async (taskData: TaskFormData, userId: string) => {
    try {
      // Ensure we're not assigning tasks to admin users
      const targetUser = users.find(user => user.id === userId);
      if (targetUser?.is_admin) {
        throw new Error('Cannot assign tasks to admin users');
      }
      
      const taskPayload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      };
      
      console.log('AdminTaskManagement creating task for user:', userId);
      console.log('Original taskData:', taskData);
      
      // Use admin endpoint to create task for specific user
      await createTaskForUser(userId, taskPayload);
      
      await loadData(); // Refresh data
      setIsTaskCreationModalOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, [loadData, users]);

  const handleLegacyCreateTask = useCallback(async (taskData: TaskFormData) => {
    try {
      if (!assigningUserId) {
        throw new Error('Please select a user to assign the task to');
      }
      
      // Ensure we're not assigning tasks to admin users
      const targetUser = users.find(user => user.id === assigningUserId);
      if (targetUser?.is_admin) {
        throw new Error('Cannot assign tasks to admin users');
      }
      
      const taskPayload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      };
      
      console.log('AdminTaskManagement creating task for user:', assigningUserId);
      console.log('Original taskData:', taskData);
      
      // Use admin endpoint to create task for specific user
      await createTaskForUser(assigningUserId, taskPayload);
      
      await loadData(); // Refresh data
      setIsTaskModalOpen(false);
      setAssigningUserId('');
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, [assigningUserId, loadData, users]);

  const handleUpdateTask = useCallback(async (taskData: TaskFormData & { owner_id?: string }) => {
    if (!editingTask) return;
    
    try {
      const updatePayload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined,
        ...(taskData.owner_id && { owner_id: taskData.owner_id })
      };
      
      console.log('AdminTaskManagement updating task with payload:', updatePayload);
      console.log('Original taskData:', taskData);
      
      await updateTask(editingTask.id, updatePayload, true); // Admin has full access
      
      await loadData(); // Refresh data
      setEditingTask(null);
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, [editingTask, loadData]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
        await loadData(); // Refresh data
      } catch (error) {
        console.error('Failed to delete task:', error);
        setError('Failed to delete task');
      }
    }
  }, [loadData]);

  const handleAddTaskClick = (userId: string) => {
    setAssigningUserId(userId);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleStatusTileClick = (type: 'overdue' | 'in_progress' | 'pending' | 'completed', title: string) => {
    setStatusModalType(type);
    setStatusModalTitle(title);
    setIsStatusModalOpen(true);
  };

  const handleNewTaskClick = () => {
    setIsTaskCreationModalOpen(true);
  };

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setAssigningUserId('');
    setIsTaskEditModalOpen(true);
  };

  // Get only regular users (no filtering needed since we removed user filter)
  const regularUsers = users.filter(user => !user.is_admin);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading task management data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
            <h3 className="font-semibold">Error Loading Data</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => {
              setError('');
              loadData();
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate overall stats from allTasks for accurate totals
  const overallStats = allTasks.reduce(
    (acc, task) => {
      const now = new Date();
      if (task.status === 'completed') acc.completed++;
      else if (task.status === 'in_progress') acc.inProgress++;
      else if (task.status === 'pending') acc.pending++;
      
      // Check if task is overdue (has due date, past due, and not completed)
      const dueDate = task.due_datetime || task.due_date;
      if (dueDate && new Date(dueDate) < now && task.status !== 'completed') {
        acc.overdue++;
      }
      return acc;
    },
    { overdue: 0, completed: 0, inProgress: 0, pending: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                <Users className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Implementation Note */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-1">Admin Task Management</h4>
                <p className="text-sm text-green-800">
                  Search and manage all tasks in the system. Tasks are displayed based on your search criteria.
                </p>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button
              onClick={() => handleStatusTileClick('overdue', 'Overdue Tasks')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-red-300 transition-all duration-200 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                  <p className="text-3xl font-bold text-red-600">{overallStats.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </button>
            
            <button
              onClick={() => handleStatusTileClick('in_progress', 'In Progress Tasks')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-yellow-300 transition-all duration-200 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-3xl font-bold text-yellow-600">{overallStats.inProgress}</p>
                </div>
                <Play className="w-8 h-8 text-yellow-400" />
              </div>
            </button>
            
            <button
              onClick={() => handleStatusTileClick('pending', 'Pending Tasks')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all duration-200 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-gray-600">{overallStats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
            </button>
            
            <button
              onClick={() => handleStatusTileClick('completed', 'Completed Tasks')}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all duration-200 text-left w-full"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{overallStats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search tasks by title, description, username, or email... (min 3 chars, * for all)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              {/* Results info */}
              <div className="text-sm text-gray-600">
                {pagination.total_items > 0 && (
                  <>
                    Showing {((currentPage - 1) * pagination.items_per_page) + 1}-{Math.min(currentPage * pagination.items_per_page, pagination.total_items)} of {pagination.total_items} tasks
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header with Add Task Button */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
                  <p className="text-sm text-gray-600">
                    {pagination.total_items} tasks found
                  </p>
                </div>
                
                {/* Add Task Button */}
                <button
                  onClick={handleNewTaskClick}
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Task</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {allTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Found</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No tasks match your search criteria.' : 'No tasks in the system yet.'}
                  </p>
                  {searchTerm && (
                    <p className="text-sm text-gray-500 mt-2">
                      Try searching with "*" to see all tasks or adjust your search terms.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid gap-4">
                  {allTasks.map((task) => {
                    // Find the task owner from users list
                    const owner = users.find(user => user.id === task.owner_id) || 
                                 users.find(user => user.id === task.user_id);
                    
                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isOverdue(task)
                            ? 'bg-red-50 border-red-200 shadow-md'
                            : 'bg-gray-50 border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              {getStatusIcon(task.status)}
                              <h4 className="font-semibold text-gray-900">{task.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority} priority
                              </span>
                              {isOverdue(task) && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Overdue</span>
                                </span>
                              )}
                            </div>
                            
                            {/* Task owner info */}
                            {owner && (
                              <div className="flex items-center space-x-2 mb-2">
                                <UserIcon className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Assigned to: <span className="font-medium">{owner.username}</span>
                                  {owner.email && (
                                    <span className="text-gray-500 ml-1">({owner.email})</span>
                                  )}
                                </span>
                              </div>
                            )}
                            
                            {task.description && (
                              <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                            )}
                            
                            {(task.due_datetime || task.due_date) && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>Due: {new Date(task.due_datetime || task.due_date!).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditTaskClick(task)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit task"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Pagination Controls */}
          {pagination.total_pages > 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Page {pagination.current_page} of {pagination.total_pages}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.has_previous}
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                            page === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 hover:bg-gray-50 border border-gray-200'
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
                    className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <TaskEditModal
        isOpen={isTaskEditModalOpen}
        onClose={() => {
          setIsTaskEditModalOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
        onSubmit={handleUpdateTask}
        users={users}
      />

      <StatusTasksModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        tasks={allTasks}
        users={users}
        statusType={statusModalType}
        title={statusModalTitle}
      />

      <TaskCreationModal
        isOpen={isTaskCreationModalOpen}
        onClose={() => setIsTaskCreationModalOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
      />
    </div>
  );
});

AdminTaskManagement.displayName = 'AdminTaskManagement';

export default AdminTaskManagement;