import { useState, useEffect, useCallback, memo, FormEvent, ChangeEvent } from 'react';
import { X, Calendar, Flag, Clock } from 'lucide-react';
import type { Task, TaskFormData } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  onSubmit: (data: TaskFormData) => void;
  isAdmin?: boolean; // New prop to determine if user is admin
  currentUserId?: string; // Current user's ID to check task ownership
}

const TaskModal = memo(({ isOpen, onClose, task = null, onSubmit, isAdmin = true, currentUserId }: TaskModalProps) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    due_date: '',
    start_datetime: '',
    end_datetime: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if user has full edit access
  // Admin users always have full access
  // Normal users have:
  // 1. Full access when creating new tasks (task is null)
  // 2. Restricted access when editing existing tasks (regardless of who created them)
  const hasFullAccess = isAdmin || !task;
  const isRestrictedEdit = !hasFullAccess;

  // Debug logging
  console.log('🔍 TaskModal Access Debug:', {
    isAdmin,
    currentUserId,
    taskExists: !!task,
    taskTitle: task?.title,
    hasFullAccess,
    isRestrictedEdit,
    mode: task ? 'edit' : 'create'
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        due_date: task.due_datetime ? task.due_datetime.split('T')[0] : (task.due_date ? task.due_date.split('T')[0] : ''),
        start_datetime: task.start_datetime ? task.start_datetime.split('T')[0] : '',
        end_datetime: task.end_datetime ? task.end_datetime.split('T')[0] : ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
        start_datetime: '',
        end_datetime: ''
      });
    }
  }, [task, isOpen]);

  const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      console.log('TaskModal submitting formData:', formData);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit task:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, onClose, isSubmitting]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [onClose, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl max-w-lg w-full animate-in slide-in-from-bottom-4 duration-300">
        <div className="relative p-8">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-gray-600">
              {task ? 'Update your task details' : 'Fill in the details for your new task'}
            </p>
            {isRestrictedEdit && task && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-amber-800 flex items-center">
                  <span className="mr-2">ℹ️</span>
                  <strong>Restricted Access:</strong> You can only edit Status, Start Date, and End Date (admin-created task)
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  isRestrictedEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70'
                }`}
                placeholder="Enter task title"
                required
                disabled={isSubmitting || isRestrictedEdit}
                readOnly={isRestrictedEdit}
              />
              {isRestrictedEdit && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <span className="mr-1">🔒</span>
                  This field is read-only for normal users
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-28 resize-none transition-all duration-200 ${
                  isRestrictedEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70'
                }`}
                placeholder="Describe your task (optional)"
                disabled={isSubmitting || isRestrictedEdit}
                readOnly={isRestrictedEdit}
              />
              {isRestrictedEdit && (
                <p className="text-xs text-amber-600 mt-1 flex items-center">
                  <span className="mr-1">🔒</span>
                  This field is read-only for normal users
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Flag className="w-4 h-4" />
                  <span>Priority</span>
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    isRestrictedEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70'
                  }`}
                  disabled={isSubmitting || isRestrictedEdit}
                >
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
                {isRestrictedEdit && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <span className="mr-1">🔒</span>
                    Read-only for normal users
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Status</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70"
                  disabled={isSubmitting}
                >
                  <option value="pending">⏳ Pending</option>
                  <option value="in_progress">🔄 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Start Date</span>
                </label>
                <input
                  type="date"
                  name="start_datetime"
                  value={formData.start_datetime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70"
                  disabled={isSubmitting}
                />
              </div>
              
              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>End Date</span>
                </label>
                <input
                  type="date"
                  name="end_datetime"
                  value={formData.end_datetime}
                  onChange={handleInputChange}
                  min={formData.start_datetime || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/70"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Calendar className="w-4 h-4" />
                  <span>Due Date</span>
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                    isRestrictedEdit ? 'bg-gray-100 cursor-not-allowed' : 'bg-white/70'
                  }`}
                  disabled={isSubmitting || isRestrictedEdit}
                  readOnly={isRestrictedEdit}
                />
                {isRestrictedEdit && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center">
                    <span className="mr-1">🔒</span>
                    Read-only for normal users
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {task ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  task ? '✨ Update Task' : '🚀 Create Task'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

TaskModal.displayName = 'TaskModal';

export default TaskModal;