import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { Dashboard } from './components/dashboard/Dashboard';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (email: string, role: UserRole) => {
    setUser({ email, role, name: email.split('@')[0] });
  };

  const handleSignup = (email: string, role: UserRole) => {
    setUser({ email, role, name: email.split('@')[0] });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Login onLogin={handleLogin} onSwitchToSignupPath="/signup" />
          )
        }
      />
      <Route
        path="/signup"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Signup onSignup={handleSignup} onSwitchToLoginPath="/login" />
          )
        }
      />
      <Route
        path="/dashboard/*"
        element={
          user ? (
            <Dashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}