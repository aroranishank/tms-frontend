import React from 'react';
import { useAuth } from './hooks/useAuth';
import Dashboard from './components/Dashboard/Dashboard';
import LoginForm from './components/Auth/LoginForm';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return (
    <div className="App">
      {user ? <Dashboard /> : <LoginForm />}
    </div>
  );
}

export default App;