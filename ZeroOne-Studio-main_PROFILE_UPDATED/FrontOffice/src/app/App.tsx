import { useState } from 'react';
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
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'dashboard'>('login');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (email: string, role: UserRole) => {
    setUser({ email, role, name: email.split('@')[0] });
    setCurrentView('dashboard');
  };

  const handleSignup = (email: string, role: UserRole) => {
    setUser({ email, role, name: email.split('@')[0] });
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return (
      <Login 
        onLogin={handleLogin}
        onSwitchToSignup={() => setCurrentView('signup')}
      />
    );
  }

  if (currentView === 'signup') {
    return (
      <Signup 
        onSignup={handleSignup}
        onSwitchToLogin={() => setCurrentView('login')}
      />
    );
  }

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : null;
}
