import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut, Database, FileText, Key, Bug } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '../../components/ui/Toaster';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showTracer, setShowTracer] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (logsRef.current && !logsRef.current.contains(event.target as Node)) {
        setShowLogs(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileRef, logsRef]);

  const testDatabaseConnection = async () => {
    try {
      setIsTestingDb(true);
      showNotification('Test de connexion à la base de données en cours...', 'loading');
      
      // En mode démo, simuler un test réussi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addToast('Mode démo actif - Utilisation des données fictives', 'success');
      showNotification('Mode démo actif - Utilisation des données fictives', 'success');
    } catch (error) {
      addToast(
        'Failed to test database connection',
        'error'
      );
      showNotification(
        'Failed to test database connection',
        'error'
      );
    } finally {
      setIsTestingDb(false);
    }
  };

  const downloadLogs = () => {
    try {
      const logs = "Application logs - Demo mode";
      const blob = new Blob([logs], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `application-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('Logs downloaded');
    } catch (error) {
      console.error('Error downloading logs:', error);
    }
  };

  const handleChangePassword = () => {
    setProfileOpen(false);
    navigate('/change-password');
  };

  return (
    <nav className="bg-white border-b border-gray-200 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 mr-2"
              onClick={onMenuClick}
            >
              <span className="sr-only">Ouvrir le menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex items-center">
              <img src="/logo-bsic-2.png" alt="BSIC Bank" className="h-8 w-auto mr-3" />
              <h1 className="text-xl font-semibold text-gray-800">Moniteur de Qualité des Données</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={testDatabaseConnection}
              disabled={isTestingDb}
            >
              <span className="sr-only">Tester la connexion</span>
              <Database className={`h-5 w-5 ${isTestingDb ? 'animate-spin' : ''}`} />
            </button>

            <div className="relative" ref={logsRef}>
              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                onClick={() => setShowLogs(!showLogs)}
              >
                <span className="sr-only">Voir les logs</span>
                <FileText className="h-5 w-5" />
              </button>

              {showLogs && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Logs de l'Application</h3>
                      <button
                        onClick={downloadLogs}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Télécharger
                      </button>
                    </div>
                    <div className="max-h-96 overflow-auto">
                      <div className="py-2 border-t border-gray-100 first:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-info-600">
                            SYSTEM
                          </span>
                          <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">Application démarrée en mode démo</p>
                      </div>
                      <div className="py-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-success-600">
                            DATABASE
                          </span>
                          <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">Connexion à la base de données établie (mode démo)</p>
                      </div>
                      <div className="py-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-info-600">
                            SECURITY
                          </span>
                          <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
                        </div>
                        <p className="mt-1 text-sm text-gray-700">Utilisateur connecté: {user?.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowTracer(!showTracer)}
            >
              <span className="sr-only">Voir le tracer</span>
              <Bug className="h-5 w-5" />
            </button>

            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Voir les notifications</span>
              <Bell className="h-5 w-5" />
            </button>

            <div className="ml-3 relative" ref={profileRef}>
              <div>
                <button
                  type="button"
                  className="flex items-center max-w-xs rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  id="user-menu-button"
                  aria-expanded={profileOpen}
                  aria-haspopup="true"
                  onClick={() => setProfileOpen(!profileOpen)}
                >
                  <span className="sr-only">Ouvrir le menu utilisateur</span>
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                    {user?.username && user?.username.length > 0 ? user?.username.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span className="ml-2 hidden md:block text-sm font-medium text-gray-700">
                    {user?.username || 'Chargement...'}
                  </span>
                  {user?.agencyCode && (
                    <span className="ml-1 hidden md:block text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                      {user.agencyCode}
                    </span>
                  )}
                </button>
              </div>

              {profileOpen && (
                <div 
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 animate-scale-up"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <div className="py-1 border-b border-gray-100">
                    <div className="block px-4 py-2 text-sm text-gray-700">
                      <p className="font-semibold">{user?.username || 'Chargement...'}</p>
                      <p className="text-gray-500">{user?.email || 'Chargement...'}</p>
                      <p className="mt-1 text-xs px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full inline-block">
                        {user?.role === 'admin' && 'Administrateur'}
                        {user?.role === 'auditor' && 'Auditeur'}
                        {user?.role === 'agency_user' && 'Utilisateur Agence'}
                        {user?.role === 'user' && 'Utilisateur'}
                        {!user?.role && 'Chargement...'}
                      </p>
                      {user?.agencyCode && (
                        <p className="mt-1 text-xs px-2 py-0.5 bg-success-100 text-success-800 rounded-full inline-block">
                          Agence: {user.agencyCode}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleChangePassword}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      Changer mot de passe
                    </button>
                    <button
                      onClick={logout}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      tabIndex={-1}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-lg font-semibold text-white">BSIC Bank</p>
          <img src="/logo-bsic-2.png" alt="BSIC Bank" className="h-12 w-auto" />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;