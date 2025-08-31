import { memo, useCallback } from 'react';
import { 
  Clock,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  Square,
  CheckSquare,
  Calendar,
  Flag
} from 'lucide-react';
import type { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleStatus: (task: Task) => void;
}

const TaskCard = memo(({ task, onEdit, onDelete, onToggleStatus }: TaskCardProps) => {
  const priorityConfig = {
    low: { 
      bg: 'bg-emerald-50 border-emerald-200', 
      text: 'text-emerald-700',
      icon: <Flag className="w-3 h-3" />
    },
    medium: { 
      bg: 'bg-amber-50 border-amber-200', 
      text: 'text-amber-700',
      icon: <Flag className="w-3 h-3" />
    },
    high: { 
      bg: 'bg-red-50 border-red-200', 
      text: 'text-red-700',
      icon: <Flag className="w-3 h-3" />
    }
  };

  const statusConfig = {
    pending: { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-200'
    },
    in_progress: { 
      icon: <AlertCircle className="w-4 h-4" />, 
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200'
    },
    completed: { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200'
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [task, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  const handleToggleStatus = useCallback(() => {
    onToggleStatus(task);
  }, [task, onToggleStatus]);

  const currentStatus = statusConfig[task.status] || {
    icon: <Clock className="w-4 h-4" />, 
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200'
  };
  const currentPriority = priorityConfig[task.priority] || {
    bg: 'bg-gray-50 border-gray-200', 
    text: 'text-gray-700',
    icon: <Flag className="w-3 h-3" />
  };

  return (
    <div className={`group bg-white rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
      isOverdue ? 'border-red-300 shadow-red-50' : 'border-gray-200'
    } ${task.status === 'completed' ? 'opacity-75' : ''}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <h3 className={`text-lg font-bold leading-tight ${
                task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {task.title}
              </h3>
              {isOverdue && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                  Overdue
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleEdit}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${currentPriority.bg} ${currentPriority.text}`}>
              {currentPriority.icon}
              <span className="ml-1.5 capitalize">{task.priority}</span>
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${currentStatus.bg} ${currentStatus.color}`}>
              {currentStatus.icon}
              <span className="ml-1.5 capitalize">{task.status.replace('_', ' ')}</span>
            </span>
          </div>
        </div>
        
        {task.due_date && (
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className={`w-4 h-4 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${
              isOverdue ? 'text-red-600' : 'text-gray-600'
            }`}>
              Due: {new Date(task.due_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleToggleStatus}
            className={`flex items-center space-x-2 text-sm font-medium transition-all duration-200 hover:scale-105 ${
              task.status === 'completed' 
                ? 'text-orange-600 hover:text-orange-700' 
                : 'text-green-600 hover:text-green-700'
            }`}
          >
            {task.status === 'completed' ? (
              <Square className="w-4 h-4" />
            ) : (
              <CheckSquare className="w-4 h-4" />
            )}
            <span>
              {task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;