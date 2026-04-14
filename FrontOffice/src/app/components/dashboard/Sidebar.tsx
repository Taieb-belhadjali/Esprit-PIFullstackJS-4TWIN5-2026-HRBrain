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
import { useFontSize } from '../a11y/FontSizeContext';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  userRole: UserRole;
  userName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuItem {
  id: ViewType;
  label: string;
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
}: SidebarProps) {
  const { increase, decrease, reset, canIncrease, canDecrease, sizeIndex, percent } = useFontSize();
  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: <Users className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'SUPERADMIN'],
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: <Building2 className="w-5 h-5" />,
      roles: ['HR', 'SUPERADMIN'],
    },
    {
      id: 'skills',
      label: 'Skills',
      icon: <Brain className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'activities',
      label: 'Activities',
      icon: <Activity className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: <Target className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'SUPERADMIN'],
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'SUPERADMIN'],
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      roles: ['HR', 'Manager', 'Employee', 'SUPERADMIN'],
    },
    {
      id: 'settings',
      label: 'Settings',
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
                <div className="bg-white rounded-lg p-2">
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
                  title={isCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Text size controls – WCAG 1.4.4 */}
        <div className="p-3 border-t border-sidebar-border">
          {isCollapsed ? (
            <button
              onClick={increase}
              disabled={!canIncrease}
              title="Agrandir le texte"
              aria-label="Agrandir le texte"
              className="w-full flex items-center justify-center py-1.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs font-semibold"
            >
              A+
            </button>
          ) : (
            <div
              role="group"
              aria-label="Taille du texte"
              className="flex items-center justify-between"
            >
              <span className="text-xs text-sidebar-foreground/50 font-medium">Texte</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={decrease}
                  disabled={!canDecrease}
                  aria-label="Réduire la taille du texte"
                  title="A−"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-sidebar-foreground/70 text-xs font-semibold hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  A−
                </button>
                <button
                  onClick={reset}
                  aria-label={`Réinitialiser la taille (${percent}%)`}
                  title={`Réinitialiser (${percent}%)`}
                  className="h-7 px-1.5 rounded-md flex items-center justify-center text-[11px] font-medium hover:bg-sidebar-accent transition-colors min-w-[36px]"
                >
                  <span className={sizeIndex === 0 ? 'text-sidebar-foreground/40' : 'text-blue-300'}>
                    {sizeIndex === 0 ? 'A' : `${percent}%`}
                  </span>
                </button>
                <button
                  onClick={increase}
                  disabled={!canIncrease}
                  aria-label="Augmenter la taille du texte"
                  title="A+"
                  className="w-7 h-7 rounded-md flex items-center justify-center text-sidebar-foreground/70 text-sm font-semibold hover:bg-sidebar-accent hover:text-sidebar-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  A+
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
