import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';

/**
 * Login page that redirects to Keycloak for authentication.
 * Shows a simple button to initiate the SSO login flow.
 */
const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center">
            <img src="/logo-bsic-2.png" alt="BSIC Bank" className="h-16 w-auto" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            BSIC Bank
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Moniteur de Qualite des Donnees Clients
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-card rounded-card sm:px-10 animate-slide-up">
            <div className="mb-6 text-center">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Connexion</h3>
              <p className="text-gray-500 text-sm mt-1">
                Cliquez ci-dessous pour vous connecter avec votre compte BSIC
              </p>
            </div>

            <Button
              onClick={handleLogin}
              fullWidth
              size="lg"
              leftIcon={<LogIn className="h-5 w-5" />}
            >
              Se connecter avec Keycloak
            </Button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Authentification securisee via Keycloak SSO
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Single Sign-On pour tous les services BSIC
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>En cas de probleme de connexion, contactez le support IT</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
