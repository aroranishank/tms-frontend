import React from 'react';
import { 
  Clock,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  Square,
  CheckSquare
} from 'lucide-react';

const TaskCard = ({ task, onEdit, onDelete, onToggleStatus }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    in_progress: <AlertCircle className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${isOverdue ? 'border-red-200' : 'border-gray-200'} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{task.title}</h3>
          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}
        </div>
        <div className="flex space-x-2 ml-4">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
          <div className="flex items-center space-x-1 text-gray-600 text-sm">
            {statusIcons[task.status]}
            <span className="capitalize">{task.status.replace('_', ' ')}</span>
          </div>
        </div>
        
        {task.due_date && (
          <div className={`text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            Due: {new Date(task.due_date).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => onToggleStatus(task)}
          className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {task.status === 'completed' ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
          <span>
            {task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default TaskCard;