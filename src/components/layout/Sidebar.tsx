import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Database, AlertTriangle,
  BellRing, Users, X, FileCode, FileBarChart,
  Settings, Flag, LineChart, Ticket, Activity, TrendingUp,
  CheckCircle, UsersRound, GitCompare
} from 'lucide-react';

interface SidebarProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isMobile, isOpen, onClose }: SidebarProps) => {
  const { user } = useAuth();
  
  if (!isOpen && !isMobile) return null;
  
  // Définir les éléments de navigation en fonction du rôle de l'utilisateur
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const isAuditor = userRole === 'AUDITOR';
  const isAgencyUser = userRole === 'AGENCY_USER' || user?.agencyCode;
  
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