import { useEffect, useState } from 'react';
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

const THEME_KEY = 'hrbrain_theme';
const LANGUAGE_KEY = 'hrbrain_language';

function saveTheme(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_KEY, theme);
}

function loadLanguage(): string {
  const auth = loadAuth();
  if (auth?.user?.language) {
    return auth.user.language;
  }
  return localStorage.getItem(LANGUAGE_KEY) || 'en';
}

function saveLanguage(language: string) {
  localStorage.setItem(LANGUAGE_KEY, language);
  const auth = loadAuth();
  if (auth) {
    auth.user.language = language;
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  }
}

interface AppProps {
  initialTheme?: 'light' | 'dark';
}

export default function App({ initialTheme = 'light' }: AppProps) {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);
  const [theme, setTheme] = useState<'light' | 'dark'>(initialTheme);
  const [language, setLanguage] = useState<string>(loadLanguage);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

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

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    saveLanguage(lang);
    if (auth) {
      const updatedAuth = {
        ...auth,
        user: {
          ...auth.user,
          language: lang
        }
      };
      saveAuth(updatedAuth);
      setAuth(updatedAuth);
    }
  };

  // Map backend roles to frontend roles
  const mapRole = (role: string): 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN' => {
    if (role === 'SUPERADMIN') return 'SUPERADMIN';
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
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={handleLanguageChange}
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
