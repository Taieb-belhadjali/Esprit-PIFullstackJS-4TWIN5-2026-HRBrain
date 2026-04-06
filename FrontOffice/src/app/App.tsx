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

const AUTH_KEY = 'hrbrain_auth';

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

function saveAuth(auth: AuthState) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);

  const handleLogin = (result: { token: string; mustChangePassword: boolean; user: User }) => {
    saveAuth(result);
    setAuth(result);
  };

  const handlePasswordChanged = () => {
    if (auth) {
      const updated = { ...auth, mustChangePassword: false };
      saveAuth(updated);
      setAuth(updated);
    }
  };

  const handleLogout = () => {
    clearAuth();
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
