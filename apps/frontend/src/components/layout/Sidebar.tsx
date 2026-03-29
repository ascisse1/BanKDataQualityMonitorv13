import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useCommandPalette } from '../ui/CommandPalette';
import ThemeToggle from '../ui/ThemeToggle';
import {
  BarChart3,
  Database,
  AlertTriangle,
  BellRing,
  Users,
  X,
  FileCode,
  FileBarChart,
  Settings,
  Flag,
  LineChart,
  Ticket,
  Activity,
  TrendingUp,
  CheckCircle,
  UsersRound,
  GitCompare,
  ChevronLeft,
  ChevronRight,
  Command,
  Shield,
  type LucideIcon,
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemDef {
  name: string;
  icon: LucideIcon;
  path: string;
  badge?: string | number;
}

const Sidebar = ({ isMobile, isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  useTheme();
  const { open: openCommandPalette } = useCommandPalette();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openAnomaliesCount, setOpenAnomaliesCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const fetchAnomalyCount = async () => {
      try {
        const response = await fetch('/api/anomalies/counts/by-status', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          const counts = data.data || data;
          const open = (counts.PENDING || 0) + (counts.OPEN || 0) + (counts.IN_PROGRESS || 0);
          setOpenAnomaliesCount(open > 0 ? open : undefined);
        }
      } catch {
        // Silently ignore
      }
    };

    fetchAnomalyCount();
    const interval = setInterval(fetchAnomalyCount, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen && !isMobile) return null;

  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isAuditor = userRole === 'AUDITOR';
  const isAgencyUser = userRole === 'AGENCY_USER' || (user?.agencyCodes && user.agencyCodes.length > 0);

  const mainNavigation: NavItemDef[] = [
    ...(isAdmin || isAuditor
      ? [{ name: 'Tableau de bord', icon: BarChart3, path: '/dashboard' }]
      : []),
    { name: 'Anomalies', icon: AlertTriangle, path: '/anomalies', badge: openAnomaliesCount },
    { name: 'Tickets', icon: Ticket, path: '/tickets' },
  ];

  const qualityNavigation: NavItemDef[] = [
    { name: 'Validation "4 Yeux"', icon: CheckCircle, path: '/validation' },
    { name: 'FATCA', icon: Flag, path: '/fatca' },
    { name: 'Détection Doublons', icon: UsersRound, path: '/duplicates' },
    { name: 'Réconciliation CBS', icon: GitCompare, path: '/reconciliation' },
  ];

  const analyticsNavigation: NavItemDef[] = [
    { name: 'KPIs', icon: TrendingUp, path: '/kpis' },
    { name: 'Suivi Global', icon: LineChart, path: '/tracking' },
    { name: 'Rapports', icon: FileBarChart, path: '/reports' },
    { name: 'Workflow', icon: Activity, path: '/workflow' },
  ];

  const configNavigation: NavItemDef[] = [
    { name: 'Règles', icon: FileCode, path: '/rules' },
    { name: 'Alertes', icon: BellRing, path: '/alerts' },
    { name: 'Configuration', icon: Settings, path: '/config' },
  ];

  const adminNavigation: NavItemDef[] = [
    { name: 'Utilisateurs', icon: Users, path: '/users' },
    { name: 'Gestion des acces', icon: Shield, path: '/user-access' },
    { name: 'CoreBanking', icon: Database, path: '/corebanking-config' },
  ];

  const navigationGroups = [
    { title: 'Principal', items: mainNavigation },
    ...(isAdmin || isAuditor
      ? [
          { title: 'Qualité', items: qualityNavigation },
          { title: 'Analytics', items: analyticsNavigation },
          { title: 'Configuration', items: configNavigation },
        ]
      : []),
    ...(isAdmin ? [{ title: 'Administration', items: adminNavigation }] : []),
  ];

  const NavItem = ({ item }: { item: NavItemDef }) => {
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        to={item.path}
        onClick={isMobile ? onClose : undefined}
        className="relative block"
      >
        <div
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-xl
            transition-colors duration-200
            ${isActive
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-700 hover:text-slate-900 dark:hover:text-white'
            }
          `}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full" />
          )}

          <div
            className={`
              flex-shrink-0 p-1.5 rounded-lg transition-colors
              ${isActive
                ? 'bg-primary-500/20'
                : 'bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-surface-600'
              }
            `}
          >
            <item.icon className="w-5 h-5" />
          </div>

          {!isCollapsed && (
            <span className="flex-1 text-sm font-medium truncate">
              {item.name}
            </span>
          )}

          {item.badge && !isCollapsed && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
              {item.badge}
            </span>
          )}
        </div>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'}
          flex-col h-screen
          bg-white dark:bg-surface-900
          border-r border-slate-200 dark:border-surface-700
          transition-[width] duration-200 ease-out
        `}
        style={{ width: isMobile ? 280 : isCollapsed ? 80 : 280 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-surface-700">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  BSIC Bank
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Data Quality Monitor
                </p>
              </div>
            )}
          </div>

          {isMobile ? (
            <button
              type="button"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-700"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-700 dark:hover:text-slate-300"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Command Palette Trigger */}
        {!isCollapsed && (
          <div className="px-4 py-3">
            <button
              onClick={openCommandPalette}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-surface-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-surface-700 transition-colors"
            >
              <Command className="w-4 h-4" />
              <span className="flex-1 text-sm text-left">Rechercher...</span>
              <kbd className="px-2 py-0.5 text-xs bg-white dark:bg-surface-600 rounded border border-slate-200 dark:border-surface-500">
                ⌘K
              </kbd>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {group.title}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavItem key={item.path} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-surface-700 space-y-4">
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Thème</span>
              <ThemeToggle variant="dropdown" size="sm" />
            </div>
          )}

          {/* Agency info for agency users */}
          {isAgencyUser && user?.agencyCodes && user.agencyCodes.length > 0 && !isCollapsed && (
            <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <p className="text-xs text-primary-600/70 dark:text-primary-400/70">
                {user.agencyCodes.length === 1 ? 'Agence assignee' : 'Agences assignees'}
              </p>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {user.agencyCodes.join(', ')}
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
