import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut, Database, Key, Bug } from 'lucide-react';
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
  const [showTracer, setShowTracer] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileRef]);

  const testDatabaseConnection = async () => {
    try {
      showNotification('Test de connexion à la base de données en cours...', 'loading');
      const response = await fetch('/api/health/db');
      const data = await response.json();
      if (data.success) {
        addToast('Connexion à la base de données réussie', 'success');
        showNotification('Connexion à la base de données réussie', 'success');
      } else {
        addToast(data.message || 'Échec de la connexion', 'error');
        showNotification(data.message || 'Échec de la connexion', 'error');
      }
    } catch (error) {
      addToast('Échec du test de connexion à la base de données', 'error');
      showNotification('Échec du test de connexion à la base de données', 'error');
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
              <h1 className="text-xl font-semibold text-gray-800">Moniteur de Qualité des Données</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={testDatabaseConnection}
            >
              <span className="sr-only">Tester la connexion</span>
              <Database className="h-5 w-5" />
            </button>

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
                        {user?.role === 'ADMIN' && 'Administrateur'}
                        {user?.role === 'AUDITOR' && 'Auditeur'}
                        {user?.role === 'AGENCY_USER' && 'Utilisateur Agence'}
                        {user?.role === 'USER' && 'Utilisateur'}
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
