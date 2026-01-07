<<<<<<< HEAD
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Sparkles,
  Shield,
  type LucideIcon,
=======
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Database, AlertTriangle,
  BellRing, Users, X, FileCode, FileBarChart,
  Settings, Flag, LineChart, Ticket, Activity, TrendingUp,
  CheckCircle, UsersRound, GitCompare
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

<<<<<<< HEAD
interface NavItem {
  name: string;
  icon: LucideIcon;
  path: string;
  badge?: string | number;
}

const Sidebar = ({ isMobile, isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  useTheme(); // Initialize theme context
  const { open: openCommandPalette } = useCommandPalette();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen && !isMobile) return null;

=======
const Sidebar = ({ isMobile, isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  
  if (!isOpen && !isMobile) return null;
  
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
  // Définir les éléments de navigation en fonction du rôle de l'utilisateur
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isAuditor = userRole === 'AUDITOR';
  const isAgencyUser = userRole === 'AGENCY_USER' || user?.agencyCode;
<<<<<<< HEAD

  // Navigation groups
  const mainNavigation: NavItem[] = [
    { name: 'Tableau de bord', icon: BarChart3, path: '/dashboard' },
    { name: 'Anomalies', icon: AlertTriangle, path: '/anomalies', badge: 12 },
    { name: 'Tickets', icon: Ticket, path: '/tickets' },
  ];

  const qualityNavigation: NavItem[] = [
    { name: 'Validation "4 Yeux"', icon: CheckCircle, path: '/validation' },
    { name: 'FATCA', icon: Flag, path: '/fatca' },
    { name: 'Détection Doublons', icon: UsersRound, path: '/duplicates' },
    { name: 'Réconciliation CBS', icon: GitCompare, path: '/reconciliation/dashboard' },
  ];

  const analyticsNavigation: NavItem[] = [
    { name: 'KPIs', icon: TrendingUp, path: '/kpis' },
    { name: 'Suivi Global', icon: LineChart, path: '/tracking' },
    { name: 'Rapports', icon: FileBarChart, path: '/reports' },
    { name: 'Workflow RPA', icon: Activity, path: '/workflow' },
  ];

  const configNavigation: NavItem[] = [
    { name: 'Règles', icon: FileCode, path: '/rules' },
    { name: 'Alertes', icon: BellRing, path: '/alerts' },
    { name: 'Configuration', icon: Settings, path: '/config' },
  ];

  const adminNavigation: NavItem[] = [
    { name: 'Utilisateurs', icon: Users, path: '/users' },
    { name: 'CoreBanking', icon: Database, path: '/corebanking-config' },
  ];

  // Build navigation based on role
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

  // Animation variants
  const sidebarVariants = {
    expanded: { width: 280 },
    collapsed: { width: 80 },
  };

  const itemVariants = {
    expanded: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -10 },
  };

  const NavItem = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.path;

    return (
      <NavLink
        to={item.path}
        onClick={isMobile ? onClose : undefined}
        className="relative block"
      >
        <motion.div
          className={`
            group flex items-center gap-3 px-3 py-2.5 rounded-xl
            transition-all duration-200
            ${isActive
              ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-700 hover:text-slate-900 dark:hover:text-white'
            }
          `}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Active indicator */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </AnimatePresence>

          {/* Icon */}
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

          {/* Label */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                className="flex-1 text-sm font-medium truncate"
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={itemVariants}
                transition={{ duration: 0.2 }}
              >
                {item.name}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Badge */}
          {item.badge && !isCollapsed && (
            <motion.span
              className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {item.badge}
            </motion.span>
          )}
        </motion.div>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:flex'}
          flex-col h-screen
          bg-white dark:bg-surface-900
          border-r border-slate-200 dark:border-surface-700
          transition-colors duration-300
        `}
        initial={false}
        animate={isMobile ? 'expanded' : isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-surface-700">
          <div className="flex items-center gap-3 overflow-hidden">
            <motion.div
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  className="overflow-hidden"
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={itemVariants}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    BSIC Bank
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    Data Quality Monitor
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
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
            <motion.button
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-surface-700 dark:hover:text-slate-300"
              onClick={() => setIsCollapsed(!isCollapsed)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </div>

        {/* Command Palette Trigger */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              className="px-4 py-3"
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              variants={itemVariants}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {navigationGroups.map((group) => (
            <div key={group.title}>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.p
                    className="px-3 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider"
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    variants={itemVariants}
                  >
                    {group.title}
                  </motion.p>
                )}
              </AnimatePresence>
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
          {/* Theme Toggle */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                className="flex items-center justify-between"
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={itemVariants}
              >
                <span className="text-sm text-slate-600 dark:text-slate-400">Thème</span>
                <ThemeToggle variant="dropdown" size="sm" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status indicator */}
          <div
            className={`
              flex items-center gap-3 p-3 rounded-xl
              bg-gradient-to-r from-success-50 to-success-100
              dark:from-success-900/20 dark:to-success-900/10
            `}
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-success-600 dark:text-success-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-success-500 rounded-full animate-pulse" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  className="overflow-hidden"
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  variants={itemVariants}
                >
                  <p className="text-sm font-medium text-success-700 dark:text-success-400">
                    Système actif
                  </p>
                  <p className="text-xs text-success-600/70 dark:text-success-500">
                    Mode Démo
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Agency info for agency users */}
          {isAgencyUser && user?.agencyCode && !isCollapsed && (
            <motion.div
              className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-xs text-primary-600/70 dark:text-primary-400/70">
                Agence assignée
              </p>
              <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                {user.agencyCode}
              </p>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
=======
  
  // Navigation commune à tous les utilisateurs
  const commonNavigation = [
    { name: 'Tickets', icon: Ticket, path: '/tickets' },
    { name: 'Anomalies', icon: AlertTriangle, path: '/anomalies' },
  ];

  // Navigation pour les administrateurs et auditeurs
  const auditorNavigation = [
    { name: 'Tableau de bord', icon: BarChart, path: '/dashboard' },
    { name: 'FATCA', icon: Flag, path: '/fatca' },
    { name: 'Validation "4 Yeux"', icon: CheckCircle, path: '/validation' },
    { name: 'Détection Doublons', icon: UsersRound, path: '/duplicates' },
    { name: 'Réconciliation CBS', icon: GitCompare, path: '/reconciliation/dashboard' },
    { name: 'Suivi Global', icon: LineChart, path: '/tracking' },
    { name: 'Workflow RPA', icon: Activity, path: '/workflow' },
    { name: 'KPIs', icon: TrendingUp, path: '/kpis' },
    { name: 'Règles', icon: FileCode, path: '/rules' },
    { name: 'Rapports', icon: FileBarChart, path: '/reports' },
    { name: 'Alertes', icon: BellRing, path: '/alerts' },
    { name: 'Configuration', icon: Settings, path: '/config' },
  ];
  
  // Navigation pour les administrateurs uniquement
  const adminNavigation = [
    { name: 'Gestion des utilisateurs', icon: Users, path: '/users' },
    { name: 'Configuration CoreBanking', icon: Database, path: '/corebanking-config' },
  ];
  
  // Construire la navigation finale en fonction du rôle
  let finalNavigation = [...commonNavigation];
  
  if (isAdmin || isAuditor) {
    finalNavigation = [...auditorNavigation, ...commonNavigation];
  }
  
  if (isAdmin) {
    finalNavigation = [...finalNavigation, ...adminNavigation];
  }

  return (
    <div className={`
      ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'hidden lg:block'} 
      w-64 bg-primary-500 text-white transition-transform
    `}>
      <div className="flex flex-col h-full">
        {isMobile && (
          <div className="flex items-center justify-between p-4 border-b border-primary-400">
            <span className="text-xl font-semibold text-white">BSIC Bank</span>
            <button
              type="button"
              className="text-white hover:text-gray-200"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}
        
        <div className="flex items-center p-4">
          <div className="flex-shrink-0">
            <img src="/logo-bsic-2.png" alt="BSIC Bank" className="h-10 w-auto" />
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-lg font-semibold text-white">BSIC Bank</p>
            <p className="text-sm text-primary-200">Moniteur Qualité Données</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {finalNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  ${isActive ? 'bg-primary-600 text-white' : 'text-primary-100 hover:bg-primary-600'}
                  group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors
                `}
                onClick={isMobile ? onClose : undefined}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-primary-400">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-400 flex items-center justify-center text-white">
              <Database className="h-4 w-4" />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white">Connecté à:</p>
              <p className="text-xs text-primary-200">Mode Démo (120k+ enregistrements simulés)</p>
            </div>
          </div>
          
          {/* Indicateur de performance */}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-primary-200">Système optimisé</span>
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 bg-success-400 rounded-full animate-pulse"></div>
              <span className="text-success-300">Mode Démo</span>
            </div>
          </div>
          
          {/* Afficher l'agence pour les utilisateurs d'agence */}
          {isAgencyUser && user?.agencyCode && (
            <div className="mt-3 p-2 bg-primary-600 rounded-md">
              <p className="text-xs text-primary-200 truncate">Agence assignée:</p>
              <p className="text-sm font-medium text-white truncate">{user.agencyCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
>>>>>>> 745e2a7 (Initial commit after re-initializing repository)
