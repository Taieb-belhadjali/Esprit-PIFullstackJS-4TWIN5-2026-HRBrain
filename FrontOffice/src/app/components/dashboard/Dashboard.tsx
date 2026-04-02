import { useEffect, useMemo, useState } from 'react';
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

type UserRole = 'HR' | 'Manager' | 'Employee';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

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

export function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        return <Settings onLogout={onLogout} />;
      default:
        return <Home userRole={user.role} />;
    }
  };

  return (
    <VoiceCommandProvider>
      <div className="flex h-screen bg-secondary overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={(view) => navigate(`/dashboard/${view}`)}
          userRole={user.role}
          userName={user.name}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        <main className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {renderView()}
        </main>
        <VoiceAssistant />
      </div>
    </VoiceCommandProvider>
  );
}
