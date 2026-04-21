import { lazy, Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { VoiceCommandProvider } from '../voice/VoiceCommandContext';
import { TTSProvider } from '../tts/TTSContext';
import { FontSizeProvider } from '../a11y/FontSizeContext';
import { LanguageProvider } from '../../context/LanguageContext';

// ── Lazy-loaded views (code splitting) ────────────────────────────────────────
// Each view is loaded only when first visited, reducing initial bundle size
// and improving LCP / TTI on first load.
//
// Prefetch hints (/* @vite-prefetch */) tell the browser to fetch the chunk
// during idle time so the next navigation feels instant (0ms load delay).
// Strategy:
//   • prefetch  → views likely visited right after login, for all roles
//   • no hint   → heavy/rare views (Analytics, Recommendations) — loaded on demand
//   • widgets   → prefetched after main content is ready

// Always visited early by every role
const Home            = lazy(() => import('../views/Home').then(m => ({ default: m.Home })));
const Notifications   = lazy(() => import(/* @vite-prefetch */ '../views/Notifications').then(m => ({ default: m.Notifications })));
const Profile         = lazy(() => import(/* @vite-prefetch */ '../views/Profile').then(m => ({ default: m.Profile })));
const Settings        = lazy(() => import(/* @vite-prefetch */ '../views/Settings').then(m => ({ default: m.Settings })));

// Visited early by HR / Manager roles
const Employees       = lazy(() => import(/* @vite-prefetch */ '../views/Employees').then(m => ({ default: m.Employees })));
const Activities      = lazy(() => import(/* @vite-prefetch */ '../views/Activities').then(m => ({ default: m.Activities })));
const Skills          = lazy(() => import(/* @vite-prefetch */ '../views/Skills').then(m => ({ default: m.Skills })));

// Heavy views — loaded on demand only (no prefetch to avoid wasting bandwidth)
const Recommendations = lazy(() => import('../views/Recommendations').then(m => ({ default: m.Recommendations })));
const Analytics       = lazy(() => import('../views/Analytics').then(m => ({ default: m.Analytics })));
const Departments     = lazy(() => import('../views/Departments').then(m => ({ default: m.Departments })));

// Heavy widgets — prefetched after main content is interactive
const VoiceAssistant         = lazy(() => import(/* @vite-prefetch */ '../voice/VoiceAssistant').then(m => ({ default: m.VoiceAssistant })));
const KeyboardShortcutsPanel = lazy(() => import(/* @vite-prefetch */ '../ui/KeyboardShortcutsPanel').then(m => ({ default: m.KeyboardShortcutsPanel })));
const TTSWidget              = lazy(() => import(/* @vite-prefetch */ '../tts/TTSWidget').then(m => ({ default: m.TTSWidget })));

// Minimal skeleton shown while a view chunk is loading (avoids CLS)
function ViewSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse" aria-busy="true" aria-label="Chargement…">
      <div className="h-8 bg-secondary rounded w-1/3" />
      <div className="h-4 bg-secondary rounded w-2/3" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-secondary rounded-lg" />
        ))}
      </div>
    </div>
  );
}

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

export type ViewType =
  | 'home'
  | 'employees'
  | 'departments'
  | 'skills'
  | 'activities'
  | 'recommendations'
  | 'analytics'
  | 'notifications'
  | 'profile'
  | 'settings';

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
    home:            ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    employees:       ['HR', 'Manager', 'SUPERADMIN'],
    departments:     ['HR', 'SUPERADMIN'],
    skills:          ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    activities:      ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    recommendations: ['HR', 'Manager', 'SUPERADMIN'],
    analytics:       ['HR', 'Manager', 'SUPERADMIN'],
    notifications:   ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    profile:         ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    settings:        ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
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
    const role = user.role as any;
    switch (currentView) {
      case 'home':            return <Home userRole={role} />;
      case 'employees':       return <Employees userRole={role} />;
      case 'departments':     return <Departments userRole={role} />;
      case 'skills':          return <Skills userRole={role} />;
      case 'activities':      return <Activities userRole={role} />;
      case 'recommendations': return <Recommendations userRole={role} />;
      case 'analytics':       return <Analytics userRole={role} />;
      case 'notifications':   return <Notifications />;
      case 'profile':         return <Profile user={{ ...user, role: role }} />;
      case 'settings':        return <Settings onLogout={onLogout} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} />;
      default:                return <Home userRole={role} />;
    }
  };

  return (
    <LanguageProvider initialLanguage={language} onLanguageChange={setLanguage}>
      <FontSizeProvider>
        <TTSProvider>
          <VoiceCommandProvider>
            <div className="flex h-screen bg-secondary overflow-hidden">
              <Sidebar
                currentView={currentView}
                onViewChange={(view) => navigate(`/dashboard/${view}`)}
                userRole={user.role as any}
                userName={user.name}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                language={language}
              />
              {/* WCAG 1.3.1 — <main> landmark identifie le contenu principal pour les lecteurs d'écran */}
              <main
                id="main-content"
                className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}
                aria-label={`Vue ${currentView}`}
              >
                <Suspense fallback={<ViewSkeleton />}>
                  {renderView()}
                </Suspense>
              </main>
              <Suspense fallback={null}>
                <TTSWidget />
                <VoiceAssistant />
              </Suspense>
            </div>

            {/* Panneau raccourcis clavier (touche ?) */}
            {showShortcuts && (
              <Suspense fallback={null}>
                <KeyboardShortcutsPanel onClose={() => setShowShortcuts(false)} />
              </Suspense>
            )}
          </VoiceCommandProvider>
        </TTSProvider>
      </FontSizeProvider>
    </LanguageProvider>
  );
}
