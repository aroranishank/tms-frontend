import { useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard/Dashboard';
import LoginForm from './components/Auth/LoginForm';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {user ? <Dashboard /> : <LoginForm />}
      </div>
    </ErrorBoundary>
  );
}

export default App;