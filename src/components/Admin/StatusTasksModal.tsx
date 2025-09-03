import React from 'react';
import { X, Calendar, User as UserIcon, AlertTriangle, CheckCircle, Play, Clock, Circle } from 'lucide-react';
import type { Task, User } from '../../types';

interface StatusTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  users: User[];
  statusType: 'overdue' | 'in_progress' | 'pending' | 'completed';
  title: string;
}

const StatusTasksModal: React.FC<StatusTasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  users,
  statusType,
  title
}) => {
  if (!isOpen) return null;

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

  // Filter tasks based on status type
  const filteredTasks = tasks.filter(task => {
    const now = new Date();
    const dueDate = task.due_datetime || task.due_date;
    
    switch (statusType) {
      case 'overdue':
        return dueDate && new Date(dueDate) < now && task.status !== 'completed';
      case 'in_progress':
        return task.status === 'in_progress';
      case 'pending':
        return task.status === 'pending';
      case 'completed':
        return task.status === 'completed';
      default:
        return false;
    }
  });

  const getStatusTypeIcon = () => {
    switch (statusType) {
      case 'overdue': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'in_progress': return <Play className="w-5 h-5 text-yellow-600" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-600" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      default: return <Circle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {getStatusTypeIcon()}
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
              {filteredTasks.length} tasks
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="opacity-50 mb-4">
                {getStatusTypeIcon()}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No {title.toLowerCase()} found</h3>
              <p className="text-gray-600">There are currently no tasks with this status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                // Find the task owner from users list
                const owner = users.find(user => user.id === task.owner_id) || 
                             users.find(user => user.id === task.user_id);
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isOverdue(task)
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
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
                                <span className="text-gray-500"> ({owner.email})</span>
                              )}
                            </span>
                          </div>
                        )}
                        
                        {task.description && (
                          <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {(task.due_datetime || task.due_date) && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due: {new Date(task.due_datetime || task.due_date!).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.created_at && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusTasksModal;