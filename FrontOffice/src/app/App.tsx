import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Login } from './components/auth/Login';
import { ChangePassword } from './components/auth/ChangePassword';
import { OAuthCallback } from './components/auth/OAuthCallback';
import { Dashboard } from './components/dashboard/Dashboard';

type UserRole = 'HR' | 'MANAGER' | 'EMPLOYEE';

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

interface AuthState {
  token: string;
  user: User;
  mustChangePassword: boolean;
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);

    const handleLogin = (result: { token: string; mustChangePassword: boolean; user: User }) => {
        setAuth(result);
    };

  const handlePasswordChanged = () => {
    if (auth) {
      setAuth({ ...auth, mustChangePassword: false });
    }
  };

  const handleLogout = () => {
    setAuth(null);
  };

  // Map backend roles to frontend roles
  const mapRole = (role: string): 'HR' | 'Manager' | 'Employee' => {
    if (role === 'HR') return 'HR';
    if (role === 'MANAGER') return 'Manager';
    return 'Employee';
  };

  return (
    <Routes>
      <Route
        path="/oauth/callback"
        element={<OAuthCallback onLogin={handleLogin} />}
      />
      <Route
        path="/login"
        element={
          !auth ? (
            <Login onLogin={handleLogin} />
          ) : auth.mustChangePassword ? (
            <Navigate to="/change-password" replace />
          ) : (
            <Navigate to="/dashboard" replace />
          )
        }
      />

      <Route
        path="/change-password"
        element={
          auth && auth.mustChangePassword ? (
            <ChangePassword
              token={auth.token}
              onPasswordChanged={handlePasswordChanged}
            />
          ) : auth && !auth.mustChangePassword ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/dashboard/*"
        element={
          auth && !auth.mustChangePassword ? (
            <Dashboard
              user={{ email: auth.user.email, role: mapRole(auth.user.role), name: auth.user.name }}
              onLogout={handleLogout}
            />
          ) : auth && auth.mustChangePassword ? (
            <Navigate to="/change-password" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={!auth ? '/login' : auth.mustChangePassword ? '/change-password' : '/dashboard'}
            replace
          />
        }
      />
    </Routes>
  );
}
