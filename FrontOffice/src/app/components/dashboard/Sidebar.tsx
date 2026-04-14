import {
  Home,
  Users,
  Building2,
  Brain,
  Activity,
  Target,
  BarChart3,
  Bell,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ViewType } from './Dashboard';
import { useTranslation } from '../../../api/translations';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userRole: UserRole;
  userName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  language: string;
}

interface MenuItem {
  id: ViewType;
  labelKey: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

export function Sidebar({
  currentView,
  onViewChange,
  userRole,
  userName,
  isCollapsed,
  onToggleCollapse,
  language,
}: SidebarProps) {
  const t = useTranslation(language);
  
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      labelKey: 'home',
      icon: <Home className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'employees',
      labelKey: 'employees',
      icon: <Users className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'SUPERADMIN'],
    },
    {
      id: 'departments',
      labelKey: 'departments',
      icon: <Building2 className="w-5 h-5" />,
      roles: ['HR', 'SUPERADMIN'],
    },
    {
      id: 'skills',
      labelKey: 'skills',
      icon: <Brain className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'activities',
      labelKey: 'activities',
      icon: <Activity className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'recommendations',
      labelKey: 'recommendations',
      icon: <Target className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'SUPERADMIN'],
    },
    {
      id: 'analytics',
      labelKey: 'analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'SUPERADMIN'],
    },
    {
      id: 'notifications',
      labelKey: 'notifications',
      icon: <Bell className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'profile',
      labelKey: 'profile',
      icon: <User className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'settings',
      labelKey: 'settings',
      icon: <Settings className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="bg-card rounded-lg p-2">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="font-semibold text-lg">HRBrain</h1>
                  <p className="text-xs text-sidebar-foreground/70">{userRole}</p>
                </div>
              </div>
            )}
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {userName.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{userName}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">
                  {userRole} Account
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    currentView === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'hover:bg-sidebar-accent text-sidebar-foreground'
                  }`}
                  title={isCollapsed ? t(item.labelKey) : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span className="flex-1 text-left">{t(item.labelKey)}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
