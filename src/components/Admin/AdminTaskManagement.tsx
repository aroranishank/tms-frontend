import { useState, useCallback, memo, useEffect } from 'react';
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
  Filter
} from 'lucide-react';
import { getAllUsers, getTasks, getAllTasksForAdmin, createTask, createTaskForUser, updateTask, deleteTask } from '../../services/apiService';
import TaskModal from '../Tasks/TaskModal';
import type { User, Task, TaskFormData } from '../../types';

interface AdminTaskManagementProps {
  onBack: () => void;
}

interface UserWithTasks {
  user: User;
  tasks: Task[];
  overdueCount: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
}

const AdminTaskManagement = memo(({ onBack }: AdminTaskManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userTasks, setUserTasks] = useState<UserWithTasks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [assigningUserId, setAssigningUserId] = useState<string>('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [usersData, allTasks] = await Promise.all([
        getAllUsers(),
        getAllTasksForAdmin() // Using admin endpoint to get all tasks
      ]);
      
      setUsers(usersData);
      setTasks(allTasks);

      // Filter out admin users - they should not have tasks
      const regularUsers = usersData.filter(user => !user.is_admin);
      
      // Group tasks by user and calculate statistics
      const userTasksMap = new Map<string, Task[]>();
      
      // Initialize all regular users with empty task arrays
      regularUsers.forEach(user => {
        userTasksMap.set(user.id!, []);
      });

      // Group tasks by user (only for regular users)
      allTasks.forEach(task => {
        const userId = task.user_id || task.owner_id || 'unassigned';
        if (userTasksMap.has(userId)) {
          userTasksMap.get(userId)!.push(task);
        }
      });

      const userTasksData: UserWithTasks[] = regularUsers.map(user => {
        const userTasks = userTasksMap.get(user.id!) || [];
        const now = new Date();
        
        const stats = userTasks.reduce(
          (acc, task) => {
            if (task.status === 'completed') acc.completedCount++;
            else if (task.status === 'in_progress') acc.inProgressCount++;
            else if (task.status === 'pending') acc.pendingCount++;
            
            // Check if task is overdue
            const dueDate = task.due_datetime || task.due_date;
            if (dueDate && new Date(dueDate) < now && task.status !== 'completed') {
              acc.overdueCount++;
            }
            
            return acc;
          },
          { overdueCount: 0, completedCount: 0, inProgressCount: 0, pendingCount: 0 }
        );

        return {
          user,
          tasks: userTasks,
          ...stats
        };
      });

      setUserTasks(userTasksData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load task management data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
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

  const handleCreateTask = useCallback(async (taskData: TaskFormData) => {
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

  const handleUpdateTask = useCallback(async (taskData: TaskFormData) => {
    if (!editingTask) return;
    
    try {
      const updatePayload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        status: taskData.status,
        due_date: taskData.due_date?.trim() || undefined,
        start_datetime: taskData.start_datetime?.trim() || undefined,
        end_datetime: taskData.end_datetime?.trim() || undefined
      };
      
      console.log('AdminTaskManagement updating task with payload:', updatePayload);
      console.log('Original taskData:', taskData);
      
      await updateTask(editingTask.id, updatePayload);
      
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

  const handleEditTaskClick = (task: Task) => {
    setEditingTask(task);
    setAssigningUserId('');
    setIsTaskModalOpen(true);
  };

  const filteredUserTasks = userTasks.filter(({ user, tasks }) => {
    // Only filter by selected user, always show all users for status filtering
    if (selectedUser !== 'all' && user.id !== selectedUser) return false;
    return true;
  }).map(({ user, tasks, overdueCount, completedCount, inProgressCount, pendingCount }) => {
    // Apply status filter to individual tasks within each user
    const filteredTasks = statusFilter === 'all' ? tasks : tasks.filter(task => task.status === statusFilter);
    
    // Recalculate stats for all tasks (not just filtered ones) to show accurate overdue count
    const allTaskStats = tasks.reduce(
      (acc, task) => {
        if (task.status === 'completed') acc.completedCount++;
        else if (task.status === 'in_progress') acc.inProgressCount++;
        else if (task.status === 'pending') acc.pendingCount++;
        
        const dueDate = task.due_datetime || task.due_date;
        if (dueDate && new Date(dueDate) < new Date() && task.status !== 'completed') {
          acc.overdueCount++;
        }
        
        return acc;
      },
      { overdueCount: 0, completedCount: 0, inProgressCount: 0, pendingCount: 0 }
    );
    
    return {
      user,
      tasks: filteredTasks, // Only tasks matching status filter for display
      totalTaskCount: tasks.length, // Total number of tasks for this user
      ...allTaskStats // But stats include all tasks for accurate counts
    };
  });


  // Get only regular users for the dropdown filter
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

  // Calculate overall stats from original userTasks (not filtered) for accurate totals
  const overallStats = userTasks.reduce(
    (acc, { tasks }) => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.status === 'completed') acc.completed++;
        else if (task.status === 'in_progress') acc.inProgress++;
        else if (task.status === 'pending') acc.pending++;
        
        // Check if task is overdue (has due date, past due, and not completed)
        const dueDate = task.due_datetime || task.due_date;
        if (dueDate && new Date(dueDate) < now && task.status !== 'completed') {
          acc.overdue++;
        }
      });
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
        {/* Implementation Note */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-green-900 mb-1">Admin Task Management</h4>
              <p className="text-sm text-green-800">
                This interface shows all tasks created by users in the system. Tasks are properly organized by their owners and admins can view, edit, and delete tasks as needed.
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
                <p className="text-3xl font-bold text-red-600">{overallStats.overdue}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600">{overallStats.inProgress}</p>
              </div>
              <Play className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-600">{overallStats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600">{overallStats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <span className="font-medium text-gray-900">Filters:</span>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                {regularUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
              
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
            </div>
          </div>
        </div>

        {/* User Task Overview */}
        <div className="space-y-6">
          {filteredUserTasks.map(({ user, tasks, totalTaskCount, overdueCount, completedCount, inProgressCount, pendingCount }) => (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                        <span>{user.username}</span>
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            Admin
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {totalTaskCount} total tasks • {overdueCount > 0 && (
                          <span className="text-red-600 font-medium">{overdueCount} overdue • </span>
                        )}
                        {completedCount} completed • {inProgressCount} in progress • {pendingCount} pending
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddTaskClick(user.id!)}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Task</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p>
                      {statusFilter !== 'all' ? 
                        `No tasks with status "${statusFilter.replace('_', ' ')}" for this user` : 
                        'No tasks for this user'
                      }
                    </p>
                    {statusFilter !== 'all' && totalTaskCount > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        This user has {totalTaskCount} total tasks, but none match the current filter
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {tasks.map((task) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setAssigningUserId('');
        }}
        task={editingTask}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
      />
    </div>
  );
});

AdminTaskManagement.displayName = 'AdminTaskManagement';

export default AdminTaskManagement;