import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Home } from '../views/Home';
import { Employees } from '../views/Employees';
import { Skills } from '../views/Skills';
import { Activities } from '../views/Activities';
import { Recommendations } from '../views/Recommendations';
import { Analytics } from '../views/Analytics';
import { Notifications } from '../views/Notifications';
import { Profile } from '../views/Profile';
import { Settings } from '../views/Settings';
import { Departments } from '../views/Departments';
import { VoiceAssistant } from '../voice/VoiceAssistant';
import { VoiceCommandProvider } from '../voice/VoiceCommandContext';
import { KeyboardShortcutsPanel } from '../ui/KeyboardShortcutsPanel';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export function Dashboard({ user, onLogout, theme, setTheme, language, setLanguage }: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const viewRoles: Record<ViewType, UserRole[]> = {
    home: ['HR', 'Manager', 'Employee'],
    employees: ['HR', 'Manager'],
    departments: ['HR'],
    skills: ['HR', 'Manager', 'Employee'],
    activities: ['HR', 'Manager', 'Employee'],
    recommendations: ['HR', 'Manager'],
    analytics: ['HR', 'Manager'],
    notifications: ['HR', 'Manager', 'Employee'],
    profile: ['HR', 'Manager', 'Employee'],
    settings: ['HR', 'Manager', 'Employee'],
  };

  const currentView = useMemo<ViewType>(() => {
    const segment = location.pathname.split('/')[2] as ViewType | undefined;
    if (!segment || !(segment in viewRoles)) {
      return 'home';
    }
    return segment;
  }, [location.pathname]);

  useEffect(() => {
    if (!viewRoles[currentView].includes(user.role)) {
      navigate('/dashboard/home', { replace: true });
      return;
    }

    if (location.pathname === '/dashboard') {
      navigate('/dashboard/home', { replace: true });
    }
  }, [currentView, location.pathname, navigate, user.role]);

  // ── Raccourcis clavier globaux ─────────────────────────────────────────────
  const handleKeyShortcuts = useCallback((e: KeyboardEvent) => {
    // Ignorer si l'utilisateur tape dans un champ texte
    const tag = (e.target as HTMLElement).tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
    if (isTyping) return;

    // Alt+E → Employés  (e.code = touche physique, fonctionne sur macOS & Windows)
    if (e.altKey && e.code === 'KeyE') {
      e.preventDefault();
      navigate('/dashboard/employees');
      return;
    }
    // Alt+S → Skills
    if (e.altKey && e.code === 'KeyS') {
      e.preventDefault();
      navigate('/dashboard/skills');
      return;
    }
    // Alt+D → Départements
    if (e.altKey && e.code === 'KeyD') {
      e.preventDefault();
      navigate('/dashboard/departments');
      return;
    }
    // Alt+T → Activités  (Alt+A est réservé par Chrome sur macOS)
    if (e.altKey && e.code === 'KeyT') {
      e.preventDefault();
      navigate('/dashboard/activities');
      return;
    }
    // Alt+R → Recommandations
    if (e.altKey && e.code === 'KeyR') {
      e.preventDefault();
      navigate('/dashboard/recommendations');
      return;
    }
    // Alt+L → Analytics
    if (e.altKey && e.code === 'KeyL') {
      e.preventDefault();
      navigate('/dashboard/analytics');
      return;
    }
    // Alt+N → Notifications
    if (e.altKey && e.code === 'KeyN') {
      e.preventDefault();
      navigate('/dashboard/notifications');
      return;
    }
    // Alt+P → Profil
    if (e.altKey && e.code === 'KeyP') {
      e.preventDefault();
      navigate('/dashboard/profile');
      return;
    }
    // Alt+H → Accueil
    if (e.altKey && e.code === 'KeyH') {
      e.preventDefault();
      navigate('/dashboard/home');
      return;
    }
    // ? → Aide raccourcis
    if (e.key === '?') {
      e.preventDefault();
      setShowShortcuts(s => !s);
      return;
    }
    // Échap → Fermer panneau
    if (e.key === 'Escape') {
      setShowShortcuts(false);
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyShortcuts, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyShortcuts, { capture: true });
  }, [handleKeyShortcuts]);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home userRole={user.role} />;
      case 'employees':
        return <Employees userRole={user.role} />;
      case 'departments':
        return <Departments userRole={user.role} />;
      case 'skills':
        return <Skills userRole={user.role} />;
      case 'activities':
        return <Activities userRole={user.role} />;
      case 'recommendations':
        return <Recommendations userRole={user.role} />;
      case 'analytics':
        return <Analytics userRole={user.role} />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile user={user} />;
      case 'settings':
        return <Settings onLogout={onLogout} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />;
      default:
        return <Home userRole={user.role} />;
    }
  };

  return (
    <VoiceCommandProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => navigate(`/dashboard/${view}`)}
          userRole={user.role}
          userName={user.name}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          language={language}
        />
        <main className={`flex-1 overflow-auto transition-all duration-300 bg-background ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {renderView()}
        </main>
        <VoiceAssistant />
      </div>

      {/* Panneau raccourcis clavier (touche ?) */}
      {showShortcuts && (
        <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />
      )}
    </VoiceCommandProvider>
  );
}
