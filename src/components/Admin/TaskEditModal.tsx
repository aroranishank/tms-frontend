import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, User as UserIcon, AlertTriangle, CheckCircle, Play, Clock, Circle, Search, ChevronDown, Check } from 'lucide-react';
import type { User, Task, TaskFormData } from '../../types';

interface TaskEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: TaskFormData & { owner_id?: string }) => Promise<void>;
  task: Task | null;
  users: User[];
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  task,
  users
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    start_datetime: '',
    end_datetime: ''
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter regular users (non-admin) and apply search
  const regularUsers = users.filter(user => !user.is_admin);
  const filteredUsers = regularUsers.filter(user => 
    user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (task && isOpen) {
      // Find and set the current owner
      const currentOwner = users.find(user => user.id === task.owner_id) || 
                          users.find(user => user.id === task.user_id);
      if (currentOwner) {
        setSelectedUser(currentOwner);
        setUserSearch(currentOwner.username);
      } else {
        setSelectedUser(null);
        setUserSearch('');
      }
      // Convert datetime fields to date strings for the form
      const formatDateForInput = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };

      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        due_date: formatDateForInput(task.due_datetime || task.due_date),
        start_datetime: formatDateForInput(task.start_datetime),
        end_datetime: formatDateForInput(task.end_datetime)
      });
      setError('');
    } else if (!isOpen) {
      // Reset form when modal is closed
      setSelectedUser(null);
      setUserSearch('');
      setIsUserDropdownOpen(false);
      setError('');
    }
  }, [task, isOpen, users]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Please select a user to assign the task to');
      return;
    }

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Include owner_id in the submission if user was changed
      const submitData = { 
        ...formData, 
        owner_id: selectedUser.id !== task?.owner_id ? selectedUser.id : undefined 
      };
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task');
    } finally {
      setIsSubmitting(false);
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

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const isOverdue = (task: Task) => {
    const dueDate = task.due_datetime || task.due_date;
    if (!dueDate || task.status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setUserSearch(user.username);
    setIsUserDropdownOpen(false);
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getStatusIcon(task.status)}
            <h2 className="text-xl font-bold text-gray-900">Edit Task</h2>
            {isOverdue(task) && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Assignment Info */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserIcon className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-sm font-medium text-gray-900">Currently assigned to: </span>
                {selectedUser ? (
                  <>
                    <span className="text-sm text-gray-600">{selectedUser.username}</span>
                    {selectedUser.email && (
                      <span className="text-sm text-gray-500 ml-2">({selectedUser.email})</span>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-red-600">No user selected</span>
                )}
              </div>
            </div>
            {task.owner_id !== selectedUser?.id && selectedUser && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                Will be reassigned
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* User Reassignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reassign to User *
              </label>
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setIsUserDropdownOpen(true);
                      // Clear selection if user is typing a new search
                      if (selectedUser && e.target.value !== selectedUser.username) {
                        setSelectedUser(null);
                      }
                    }}
                    onFocus={() => setIsUserDropdownOpen(true)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <ChevronDown 
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-transform ${
                      isUserDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Dropdown */}
                {isUserDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-gray-500 text-sm">
                        No users found matching "{userSearch}"
                      </div>
                    ) : (
                      filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className={`w-full text-left px-3 py-3 hover:bg-gray-50 flex items-center space-x-3 ${
                            selectedUser?.id === user.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                          }`}
                        >
                          <UserIcon className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{user.username}</div>
                            {user.email && (
                              <div className="text-sm text-gray-500">{user.email}</div>
                            )}
                          </div>
                          {selectedUser?.id === user.id && (
                            <Check className="w-4 h-4 text-indigo-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Task Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Task Information</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><span className="font-medium">Task ID:</span> {task.id}</p>
                    {task.created_at && (
                      <p><span className="font-medium">Created:</span> {new Date(task.created_at).toLocaleString()}</p>
                    )}
                    {task.updated_at && (
                      <p><span className="font-medium">Last Updated:</span> {new Date(task.updated_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter task description..."
              />
            </div>

            {/* Priority and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskFormData['priority'] })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <div className="mt-1 text-xs">
                  <span className={`font-medium ${getPriorityColor(formData.priority)}`}>
                    Current: {formData.priority} priority
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskFormData['status'] })}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="mt-1 text-xs flex items-center space-x-1">
                  {getStatusIcon(formData.status)}
                  <span className="text-gray-600">
                    Current: {formData.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.start_datetime}
                      onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.end_datetime}
                      onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.title.trim() || !selectedUser}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Task</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskEditModal;