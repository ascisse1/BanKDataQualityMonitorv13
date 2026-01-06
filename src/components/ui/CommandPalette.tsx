import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  AlertTriangle,
  FileCheck,
  Ticket,
  Users,
  Settings,
  FileText,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  Command,
  RefreshCw,
  Database,
  BarChart3,
  Shield,
  Bell,
  Workflow,
  Copy,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Types
interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  shortcut?: string[];
  action?: () => void;
  href?: string;
  group: string;
  keywords?: string[];
}

interface CommandPaletteContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined);

// Provider
export const CommandPaletteProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggle, close]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <CommandPalette />
    </CommandPaletteContext.Provider>
  );
};

// Hook
export const useCommandPalette = (): CommandPaletteContextType => {
  const context = useContext(CommandPaletteContext);
  if (!context) {
    throw new Error('useCommandPalette must be used within a CommandPaletteProvider');
  }
  return context;
};

// Main Component
const CommandPalette = () => {
  const { isOpen, close } = useCommandPalette();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useTheme();

  // Define commands
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'dashboard',
        title: 'Tableau de bord',
        subtitle: 'Vue d\'ensemble des données',
        icon: <LayoutDashboard className="w-4 h-4" />,
        href: '/',
        group: 'Navigation',
        keywords: ['accueil', 'home', 'dashboard'],
      },
      {
        id: 'anomalies',
        title: 'Anomalies',
        subtitle: 'Gérer les anomalies détectées',
        icon: <AlertTriangle className="w-4 h-4" />,
        href: '/anomalies',
        group: 'Navigation',
        keywords: ['erreurs', 'problèmes', 'issues'],
      },
      {
        id: 'validation',
        title: 'Validation',
        subtitle: 'Workflow de validation 4 yeux',
        icon: <FileCheck className="w-4 h-4" />,
        href: '/validation',
        group: 'Navigation',
        keywords: ['approuver', 'valider', 'approve'],
      },
      {
        id: 'tickets',
        title: 'Tickets',
        subtitle: 'Tickets de correction',
        icon: <Ticket className="w-4 h-4" />,
        href: '/tickets',
        group: 'Navigation',
        keywords: ['corrections', 'demandes'],
      },
      {
        id: 'reconciliation',
        title: 'Réconciliation',
        subtitle: 'Réconciliation CBS',
        icon: <RefreshCw className="w-4 h-4" />,
        href: '/reconciliation',
        group: 'Navigation',
        keywords: ['cbs', 'sync', 'informix'],
      },
      {
        id: 'reports',
        title: 'Rapports',
        subtitle: 'Générer des rapports',
        icon: <FileText className="w-4 h-4" />,
        href: '/reports',
        group: 'Navigation',
        keywords: ['pdf', 'excel', 'export'],
      },
      {
        id: 'kpis',
        title: 'KPIs',
        subtitle: 'Indicateurs de performance',
        icon: <BarChart3 className="w-4 h-4" />,
        href: '/kpis',
        group: 'Navigation',
        keywords: ['metrics', 'performance', 'statistiques'],
      },
      {
        id: 'fatca',
        title: 'FATCA',
        subtitle: 'Conformité FATCA',
        icon: <Shield className="w-4 h-4" />,
        href: '/fatca',
        group: 'Navigation',
        keywords: ['compliance', 'conformité'],
      },
      {
        id: 'rules',
        title: 'Règles de validation',
        subtitle: 'Configurer les règles',
        icon: <Database className="w-4 h-4" />,
        href: '/rules',
        group: 'Navigation',
        keywords: ['configuration', 'paramètres'],
      },
      {
        id: 'alerts',
        title: 'Alertes',
        subtitle: 'Gérer les alertes',
        icon: <Bell className="w-4 h-4" />,
        href: '/alerts',
        group: 'Navigation',
        keywords: ['notifications'],
      },
      {
        id: 'workflow',
        title: 'Workflow',
        subtitle: 'Moniteur de workflow RPA',
        icon: <Workflow className="w-4 h-4" />,
        href: '/workflow',
        group: 'Navigation',
        keywords: ['rpa', 'uipath', 'automatisation'],
      },
      {
        id: 'users',
        title: 'Utilisateurs',
        subtitle: 'Gérer les utilisateurs',
        icon: <Users className="w-4 h-4" />,
        href: '/users',
        group: 'Administration',
        keywords: ['admin', 'permissions', 'roles'],
      },
      {
        id: 'config',
        title: 'Configuration',
        subtitle: 'Paramètres système',
        icon: <Settings className="w-4 h-4" />,
        href: '/config',
        group: 'Administration',
        keywords: ['settings', 'préférences'],
      },

      // Actions
      {
        id: 'toggle-theme',
        title: resolvedTheme === 'dark' ? 'Mode clair' : 'Mode sombre',
        subtitle: 'Changer le thème de l\'application',
        icon: resolvedTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        action: toggleTheme,
        group: 'Actions',
        keywords: ['dark', 'light', 'theme', 'apparence'],
      },
      {
        id: 'logout',
        title: 'Déconnexion',
        subtitle: 'Se déconnecter de l\'application',
        icon: <LogOut className="w-4 h-4" />,
        action: () => {
          // Trigger logout
          window.dispatchEvent(new CustomEvent('logout'));
        },
        group: 'Actions',
        keywords: ['signout', 'exit', 'quitter'],
      },
      {
        id: 'copy-url',
        title: 'Copier l\'URL',
        subtitle: 'Copier l\'URL de la page actuelle',
        icon: <Copy className="w-4 h-4" />,
        action: () => {
          navigator.clipboard.writeText(window.location.href);
        },
        group: 'Actions',
        keywords: ['link', 'share', 'partager'],
      },
    ],
    [resolvedTheme, toggleTheme]
  );

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query) return commands;

    const lowerQuery = query.toLowerCase();
    return commands.filter((cmd) => {
      const searchText = [
        cmd.title,
        cmd.subtitle,
        ...(cmd.keywords || []),
      ].join(' ').toLowerCase();
      return searchText.includes(lowerQuery);
    });
  }, [commands, query]);

  // Group filtered commands
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.group]) {
        groups[cmd.group] = [];
      }
      groups[cmd.group].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle selection
  const handleSelect = useCallback(
    (command: CommandItem) => {
      close();
      setQuery('');

      if (command.action) {
        command.action();
      } else if (command.href) {
        navigate(command.href);
      }
    },
    [close, navigate]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          handleSelect(filteredCommands[activeIndex]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, handleSelect]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={close}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50"
          >
            <div className="bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-700 overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-surface-700">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher une commande..."
                  className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none"
                  autoFocus
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-surface-700 rounded">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Aucun résultat pour "{query}"
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-4 py-2">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {group}
                        </p>
                      </div>
                      {items.map((command) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isActive = globalIndex === activeIndex;

                        return (
                          <button
                            key={command.id}
                            onClick={() => handleSelect(command)}
                            onMouseEnter={() => setActiveIndex(globalIndex)}
                            className={`
                              w-full flex items-center gap-3 px-4 py-2.5 text-left
                              transition-colors duration-100
                              ${isActive
                                ? 'bg-primary-50 dark:bg-primary-900/20'
                                : 'hover:bg-slate-50 dark:hover:bg-surface-800'
                              }
                            `}
                          >
                            <div
                              className={`
                                p-2 rounded-lg
                                ${isActive
                                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                  : 'bg-slate-100 dark:bg-surface-700 text-slate-500 dark:text-slate-400'
                                }
                              `}
                            >
                              {command.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`
                                  text-sm font-medium truncate
                                  ${isActive
                                    ? 'text-primary-900 dark:text-primary-100'
                                    : 'text-slate-900 dark:text-white'
                                  }
                                `}
                              >
                                {command.title}
                              </p>
                              {command.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                  {command.subtitle}
                                </p>
                              )}
                            </div>
                            {isActive && (
                              <ChevronRight className="w-4 h-4 text-primary-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-200 dark:border-surface-700 bg-slate-50 dark:bg-surface-800/50">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-surface-600 rounded text-[10px]">↑</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-surface-600 rounded text-[10px]">↓</kbd>
                      naviguer
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-surface-600 rounded text-[10px]">↵</kbd>
                      sélectionner
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
