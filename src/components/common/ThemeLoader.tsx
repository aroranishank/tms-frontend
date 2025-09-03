import { memo } from 'react';
import { CheckSquare, Users } from 'lucide-react';

interface ThemeLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'overlay';
}

const ThemeLoader = memo(({ 
  message = "Loading...", 
  size = 'md', 
  variant = 'primary' 
}: ThemeLoaderProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (variant === 'overlay') {
    return (
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center">
          <div className="relative mb-6">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-full animate-spin opacity-20" 
                 style={{ animationDuration: '3s' }} />
            
            {/* Main spinning icon */}
            <div className="relative bg-white rounded-full p-4 shadow-lg">
              <div className="relative">
                <CheckSquare className={`${sizeClasses[size]} text-indigo-600 animate-pulse`} />
                
                {/* Orbiting dots */}
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                  <div className="absolute top-0 left-1/2 w-2 h-2 bg-purple-500 rounded-full transform -translate-x-1/2 -translate-y-2"></div>
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '0.5s' }}>
                  <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 translate-y-2"></div>
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '1s' }}>
                  <div className="absolute left-0 top-1/2 w-2 h-2 bg-indigo-500 rounded-full transform -translate-x-2 -translate-y-1/2"></div>
                </div>
                <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDelay: '1.5s' }}>
                  <div className="absolute right-0 top-1/2 w-2 h-2 bg-purple-400 rounded-full transform translate-x-2 -translate-y-1/2"></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className={`font-semibold text-gray-900 ${textSizes[size]}`}>
              {message}
            </h3>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Primary variant (inline loader)
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-6">
        {/* Animated gradient ring */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 rounded-full animate-spin opacity-30" 
             style={{ animationDuration: '2s' }} />
        
        {/* Main icon container */}
        <div className="relative bg-white rounded-full p-6 shadow-lg">
          <CheckSquare className={`${sizeClasses[size]} text-indigo-600 animate-pulse`} />
          
          {/* Floating particles */}
          <div className="absolute inset-0">
            <div className="absolute top-2 right-2 w-1 h-1 bg-purple-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-4 left-4 w-1 h-1 bg-indigo-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        </div>
      </div>
      
      <div className="text-center space-y-3">
        <h3 className={`font-semibold text-gray-900 ${textSizes[size]}`}>
          {message}
        </h3>
        
        {/* Animated dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
        </div>
        
        {/* Progress bar simulation */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
});

ThemeLoader.displayName = 'ThemeLoader';

export default ThemeLoader;