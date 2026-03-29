import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut, Database, Key, Bug } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '../../components/ui/Toaster';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../ui/ConfirmDialog';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showTracer, setShowTracer] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLButtonElement[]>([]);
  const { addToast } = useToast();
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

  // Focus first menu item when dropdown opens
  useEffect(() => {
    if (profileOpen && menuItemsRef.current.length > 0) {
      menuItemsRef.current[0]?.focus();
    }
  }, [profileOpen]);

  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = menuItemsRef.current.filter(Boolean);
    const currentIndex = items.findIndex(item => item === document.activeElement);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        items[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        items[items.length - 1]?.focus();
        break;
      case 'Escape':
        e.preventDefault();
        setProfileOpen(false);
        break;
      case 'Tab':
        setProfileOpen(false);
        break;
    }
  }, []);

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch('/api/health/db');
      const data = await response.json();
      if (data.success) {
        addToast('Connexion à la base de données réussie', 'success');
      } else {
        addToast(data.message || 'Échec de la connexion', 'error');
      }
    } catch (error) {
      addToast('Échec du test de connexion à la base de données', 'error');
    }
  };

  const handleChangePassword = () => {
    setProfileOpen(false);
    navigate('/change-password');
  };

  const handleLogout = () => {
    setProfileOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  return (
    <>
      <nav className="bg-white dark:bg-surface-900 border-b border-gray-200 dark:border-surface-700 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 mr-2"
                onClick={onMenuClick}
              >
                <span className="sr-only">Ouvrir le menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Moniteur de Qualité des Données</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {import.meta.env.DEV && (
                <>
                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={testDatabaseConnection}
                  >
                    <span className="sr-only">Tester la connexion</span>
                    <Database className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setShowTracer(!showTracer)}
                  >
                    <span className="sr-only">Voir le tracer</span>
                    <Bug className="h-5 w-5" />
                  </button>
                </>
              )}

              <button
                type="button"
                className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
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
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300">
                      {user?.username && user?.username.length > 0 ? user?.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="ml-2 hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">
                      {user?.username || 'Chargement...'}
                    </span>
                    {user?.structureCodes && user.structureCodes.length > 0 && (
                      <span className="ml-1 hidden md:block text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
                        {user.structureCodes.length === 1 ? user.structureCodes[0] : `${user.structureCodes.length} agences`}
                      </span>
                    )}
                  </button>
                </div>

                {profileOpen && (
                  <div
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-surface-800 ring-1 ring-black ring-opacity-5 dark:ring-surface-600 focus:outline-none z-10"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                    onKeyDown={handleMenuKeyDown}
                  >
                    <div className="py-2 px-4 border-b border-gray-100 dark:border-surface-700">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user?.username || 'Chargement...'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'Chargement...'}</p>
                      <p className="mt-1.5 text-xs px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full inline-block">
                        {user?.role === 'ADMIN' && 'Administrateur'}
                        {user?.role === 'AUDITOR' && 'Auditeur'}
                        {user?.role === 'AGENCY_USER' && 'Utilisateur Agence'}
                        {user?.role === 'USER' && 'Utilisateur'}
                        {!user?.role && 'Chargement...'}
                      </p>
                      {user?.structureCodes && user.structureCodes.length > 0 && (
                        <p className="mt-1 text-xs px-2 py-0.5 bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-300 rounded-full inline-block">
                          {user.structureCodes.length === 1 ? `Agence: ${user.structureCodes[0]}` : `Agences: ${user.structureCodes.join(', ')}`}
                        </p>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        ref={el => { if (el) menuItemsRef.current[0] = el; }}
                        onClick={handleChangePassword}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-700 focus:bg-gray-100 dark:focus:bg-surface-700 focus:outline-none"
                        role="menuitem"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Changer mot de passe
                      </button>
                      <button
                        ref={el => { if (el) menuItemsRef.current[1] = el; }}
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 focus:bg-error-50 dark:focus:bg-error-900/20 focus:outline-none"
                        role="menuitem"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden lg:flex items-center space-x-2 ml-4">
                <img src="/logo-bsic-2.png" alt="BSIC Bank" className="h-8 w-auto" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">BSIC Bank</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <ConfirmDialog
        open={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        title="Se déconnecter"
        description="Voulez-vous vraiment vous déconnecter ? Toute modification non enregistrée sera perdue."
        confirmLabel="Se déconnecter"
        cancelLabel="Annuler"
        variant="warning"
      />
    </>
  );
};

export default Navbar;
