import { useState } from 'react';
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
  | 'skills'
  | 'activities'
  | 'recommendations'
  | 'analytics'
  | 'notifications'
  | 'profile'
  | 'settings';

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <Home userRole={user.role} />;
      case 'employees':
        return <Employees userRole={user.role} />;
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
    <div className="flex h-screen bg-secondary overflow-hidden">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        userRole={user.role}
        userName={user.name}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main className={`flex-1 overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {renderView()}
      </main>
    </div>
  );
}
